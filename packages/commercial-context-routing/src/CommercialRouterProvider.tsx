import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { detaillantTabFromReference } from "./createDetaillantCommercialRouter";
import { grossisteAWorkspaceFromReference } from "./createGrossisteACommercialRouter";
import { grossisteBTabFromReference } from "./createGrossisteBCommercialRouter";
import {
  producerPoleFromReference,
  producerSubTabFromReference,
} from "./createProducerCommercialRouter";
import type {
  DetaillantTabDestination,
  GrossisteAWorkspaceDestination,
  GrossisteBTabDestination,
  ProducerPoleDestination,
  ProducerWorkspaceTabDestination,
} from "./commercial-actor-destinations";
import type {
  CommercialContextReference,
  CommercialContextRouter,
  CommercialContextRoutingFlags,
} from "./commercial-context-routing.types";
import { isCommercialContextRoutingEnabled } from "./commercial-context-routing";
import { restorePreviousCommercialContext } from "./commercial-context-history";

export type CommercialRouterContextValue = {
  router: CommercialContextRouter | null;
  focusReference: CommercialContextReference;
  setFocusReference: (ref: CommercialContextReference) => void;
  goBack: () => CommercialContextReference | null;
  routingInput: { router?: CommercialContextRouter; flags?: CommercialContextRoutingFlags };
};

const CommercialRouterCtx = createContext<CommercialRouterContextValue | null>(null);

export const CommercialRouterProvider = memo(function CommercialRouterProvider({
  router,
  flags = {},
  focusReference: focusProp,
  onFocusReferenceChange,
  children,
}: {
  router: CommercialContextRouter | null;
  flags?: CommercialContextRoutingFlags;
  focusReference?: CommercialContextReference;
  onFocusReferenceChange?: (ref: CommercialContextReference) => void;
  children: ReactNode;
}) {
  const [localFocus, setLocalFocus] = useState<CommercialContextReference>(
    () => focusProp ?? router?.store.active ?? {},
  );

  const focusReference = focusProp ?? localFocus;

  const setFocusReference = useCallback(
    (ref: CommercialContextReference) => {
      onFocusReferenceChange?.(ref);
      if (!focusProp) setLocalFocus(ref);
    },
    [focusProp, onFocusReferenceChange],
  );

  const goBack = useCallback(() => {
    if (!router) return null;
    const prev = router.goBack();
    if (prev) setFocusReference(prev);
    return prev;
  }, [router, setFocusReference]);

  const value = useMemo(
    (): CommercialRouterContextValue => ({
      router,
      focusReference,
      setFocusReference,
      goBack,
      routingInput: {
        router: router ?? undefined,
        flags: flags ?? router?.flags,
      },
    }),
    [router, focusReference, setFocusReference, goBack, flags],
  );

  return <CommercialRouterCtx.Provider value={value}>{children}</CommercialRouterCtx.Provider>;
});

export function useCommercialRouter(): CommercialRouterContextValue {
  const ctx = useContext(CommercialRouterCtx);
  return (
    ctx ?? {
      router: null,
      focusReference: {},
      setFocusReference: () => undefined,
      goBack: () => null,
      routingInput: {},
    }
  );
}

export function useCommercialRoutingInput(): CommercialRouterContextValue["routingInput"] {
  return useCommercialRouter().routingInput;
}

export function applyGrossisteBBackNavigation(
  ref: CommercialContextReference | null,
  setActiveTab: (tab: GrossisteBTabDestination) => void,
): void {
  if (!ref) return;
  const tab = grossisteBTabFromReference(ref);
  if (tab) setActiveTab(tab);
}

export function applyGrossisteABackNavigation(
  ref: CommercialContextReference | null,
  setActiveWorkspace: (workspace: GrossisteAWorkspaceDestination) => void,
): void {
  if (!ref) return;
  const workspace = grossisteAWorkspaceFromReference(ref);
  if (workspace) setActiveWorkspace(workspace);
}

export function applyDetaillantBackNavigation(
  ref: CommercialContextReference | null,
  setActiveTab: (tab: DetaillantTabDestination) => void,
): void {
  if (!ref) return;
  const tab = detaillantTabFromReference(ref);
  if (tab) setActiveTab(tab);
}

export function applyProducerBackNavigation(
  ref: CommercialContextReference | null,
  setActivePole: (pole: ProducerPoleDestination) => void,
  setRelationalTab?: (tab: ProducerWorkspaceTabDestination) => void,
): void {
  if (!ref) return;
  const pole = producerPoleFromReference(ref);
  if (pole) setActivePole(pole);
  const subTab = producerSubTabFromReference(ref);
  if (subTab) setRelationalTab?.(subTab);
}

export function useCommercialQuickReturn(
  flags: CommercialContextRoutingFlags = {},
): { canGoBack: boolean; goBack: () => void } {
  const { router, goBack } = useCommercialRouter();
  const canGoBack = Boolean(
    isCommercialContextRoutingEnabled(flags) &&
      router &&
      router.store.history.length >= 2,
  );
  return {
    canGoBack,
    goBack: () => {
      restorePreviousCommercialContext(router!.store, flags);
      goBack();
    },
  };
}
