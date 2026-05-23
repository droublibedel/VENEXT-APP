import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  FormalActorProfile,
  TerrainActorProfile,
  VenextActorRole,
  VenextAuthFlags,
  VenextAuthState,
  VenextLocaleTag,
  VenextPermissionKey,
} from "./venext-auth.types";
import {
  guardUxMessage,
  requireAuthenticatedActor,
  requireFormalActor,
  requireRelationshipPermission,
  requireTerrainActor,
} from "./venext-auth-guards";
import {
  redirectAuthenticatedActor,
  rememberNavigationSnapshot,
  restoreLastCommercialContext,
  restoreLastWorkspace,
} from "./venext-auth-navigation";
import {
  hasPermission,
  resolveCommercePermissions,
  visiblePermissions,
  type VenextPermissionContext,
} from "./venext-auth-permissions";
import { profileDisplayLabel } from "./venext-auth-profile";
import {
  completeFormalAuth,
  completeTerrainAuth,
  createInitialAuthState,
  emptyProfileForRole,
  isProfileCompleteForRole,
  logoutAuthState,
  refreshAuthState,
  validateFormalIdentifier,
  validateFormalPassword,
  validateTerrainOtp,
  validateTerrainPhone,
} from "./venext-auth.viewmodel";
import { persistAuthBundle } from "./venext-auth-persistence";
import { readPersistedLocale, writePersistedLocale } from "./venext-auth-storage";

export type VenextAuthContextValue = {
  actorRole: VenextActorRole;
  state: VenextAuthState;
  isAuthenticated: boolean;
  isRestoring: boolean;
  flags: VenextAuthFlags;
  permissions: Record<VenextPermissionKey, boolean>;
  visiblePermissionKeys: VenextPermissionKey[];
  profileLabel: string;
  restoreWorkspace: () => string;
  restoreCommercialContext: () => Record<string, string>;
  redirectTarget: ReturnType<typeof redirectAuthenticatedActor>;
  loginTerrain: (profile: Partial<TerrainActorProfile> & { phone: string }, otp: string) => boolean;
  loginFormal: (
    identifier: string,
    password: string,
    profile: Partial<FormalActorProfile> & { structureName: string },
  ) => boolean;
  logout: () => void;
  refreshSession: () => void;
  rememberWorkspace: (workspace: string, context?: Record<string, string>) => void;
  establishTerrainSession: (
    profile: Partial<TerrainActorProfile> & { phone: string },
  ) => void;
  setLocale: (locale: VenextLocaleTag) => void;
  requireAuth: () => ReturnType<typeof requireAuthenticatedActor>;
  requireFormal: () => ReturnType<typeof requireFormalActor>;
  requireTerrain: () => ReturnType<typeof requireTerrainActor>;
  requirePermission: (key: VenextPermissionKey) => ReturnType<typeof requireRelationshipPermission>;
  guardMessage: (result: ReturnType<typeof requireAuthenticatedActor>) => string | null;
};

const VenextAuthCtx = createContext<VenextAuthContextValue | null>(null);

export const VenextAuthProvider = memo(function VenextAuthProvider({
  actorRole,
  flags = {},
  walletBalanceFcfa = 0,
  children,
}: {
  actorRole: VenextActorRole;
  flags?: VenextAuthFlags;
  walletBalanceFcfa?: number;
  children: ReactNode;
}) {
  const walletCtx = useMemo(
    () => ({ balanceFcfa: walletBalanceFcfa }),
    [walletBalanceFcfa],
  );

  const [state, setState] = useState<VenextAuthState>(() => {
    const initial = createInitialAuthState(actorRole, flags, walletCtx);
    return initial.status === "restoring"
      ? initial
      : { ...initial, status: initial.session ? "authenticated" : "anonymous" };
  });

  const isAuthenticated = state.status === "authenticated" && Boolean(state.session);
  const permissionCtx: VenextPermissionContext = useMemo(
    () => ({ actorRole, flags }),
    [actorRole, flags],
  );
  const permissions = useMemo(() => resolveCommercePermissions(permissionCtx), [permissionCtx]);
  const visiblePermissionKeys = useMemo(() => visiblePermissions(permissionCtx), [permissionCtx]);

  const loginTerrain = useCallback(
    (profile: Partial<TerrainActorProfile> & { phone: string }, otp: string) => {
      if (!validateTerrainPhone(profile.phone) || !validateTerrainOtp(otp)) return false;
      const locale = state.preferences.locale ?? readPersistedLocale() ?? undefined;
      setState(
        completeTerrainAuth(
          actorRole,
          { ...profile, otpVerified: true },
          locale,
          flags,
          walletCtx,
        ),
      );
      return true;
    },
    [actorRole, state.preferences.locale, flags, walletCtx],
  );

  const loginFormal = useCallback(
    (
      identifier: string,
      password: string,
      profile: Partial<FormalActorProfile> & { structureName: string },
    ) => {
      if (!validateFormalIdentifier(identifier) || !validateFormalPassword(password)) {
        return false;
      }
      const locale = state.preferences.locale ?? readPersistedLocale() ?? undefined;
      const merged = {
        ...profile,
        email: identifier.includes("@") ? identifier : profile.email,
        phone: identifier.includes("@") ? profile.phone : identifier,
      };
      setState(completeFormalAuth(actorRole, merged, locale));
      return true;
    },
    [actorRole, state.preferences.locale],
  );

  const logout = useCallback(() => {
    const orgId =
      (state.profile && "organizationId" in state.profile
        ? String((state.profile as { organizationId?: string }).organizationId ?? "")
        : "") ||
      state.session?.sessionId ||
      "";
    setState(logoutAuthState());
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("venext:commerce-session-cleanup", {
          detail: { organizationId: orgId, reason: "logout" },
        }),
      );
    }
  }, [state.profile, state.session?.sessionId]);

  const refreshSession = useCallback(() => {
    setState((prev) => refreshAuthState(prev, flags, walletCtx));
  }, [flags, walletCtx]);

  const rememberWorkspace = useCallback(
    (workspace: string, context: Record<string, string> = {}) => {
      const prefs = rememberNavigationSnapshot(actorRole, workspace, context, state.preferences);
      setState((prev) => ({ ...prev, preferences: prefs }));
    },
    [actorRole, state.preferences],
  );

  const establishTerrainSession = useCallback(
    (profile: Partial<TerrainActorProfile> & { phone: string }) => {
      const locale = state.preferences.locale ?? readPersistedLocale() ?? undefined;
      setState(
        completeTerrainAuth(
          actorRole,
          { ...profile, otpVerified: true },
          locale,
          flags,
          walletCtx,
        ),
      );
    },
    [actorRole, state.preferences.locale, flags, walletCtx],
  );

  const setLocale = useCallback((locale: VenextLocaleTag) => {
    writePersistedLocale(locale);
    setState((prev) => {
      const preferences = { ...prev.preferences, locale };
      persistAuthBundle({ preferences, locale });
      return { ...prev, preferences };
    });
  }, []);

  const value = useMemo(
    (): VenextAuthContextValue => ({
      actorRole,
      state,
      isAuthenticated,
      isRestoring: state.status === "restoring",
      flags,
      permissions,
      visiblePermissionKeys,
      profileLabel: profileDisplayLabel(state.profile),
      restoreWorkspace: () => restoreLastWorkspace(actorRole, state.preferences),
      restoreCommercialContext: () => restoreLastCommercialContext(state.preferences),
      redirectTarget: redirectAuthenticatedActor(actorRole, state.preferences),
      loginTerrain,
      loginFormal,
      logout,
      refreshSession,
      rememberWorkspace,
      establishTerrainSession,
      setLocale,
      requireAuth: () => requireAuthenticatedActor(state, actorRole),
      requireFormal: () => requireFormalActor(state, actorRole),
      requireTerrain: () => requireTerrainActor(state, actorRole),
      requirePermission: (key) => requireRelationshipPermission({ ...permissionCtx }, key),
      guardMessage: guardUxMessage,
    }),
    [
      actorRole,
      state,
      isAuthenticated,
      flags,
      permissions,
      visiblePermissionKeys,
      loginTerrain,
      loginFormal,
      logout,
      refreshSession,
      rememberWorkspace,
      establishTerrainSession,
      setLocale,
      permissionCtx,
    ],
  );

  return <VenextAuthCtx.Provider value={value}>{children}</VenextAuthCtx.Provider>;
});

export function useVenextAuth(): VenextAuthContextValue {
  const ctx = useContext(VenextAuthCtx);
  if (!ctx) {
    throw new Error("useVenextAuth must be used within VenextAuthProvider");
  }
  return ctx;
}

export function useVenextAuthOptional(): VenextAuthContextValue | null {
  return useContext(VenextAuthCtx);
}

export { emptyProfileForRole, isProfileCompleteForRole };
