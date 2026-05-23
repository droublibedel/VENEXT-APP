"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearPilotageSessionToken,
  getPilotageSessionToken,
  pilotageFetch,
  setPilotageSessionToken,
} from "@/lib/pilotage-api";

type AuthState = {
  token: string | null;
  loading: boolean;
  requestCode: (email: string) => Promise<{ devCode?: string }>;
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function BackofficeAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getPilotageSessionToken());
    setLoading(false);
  }, []);

  const requestCode = useCallback(async (email: string) => {
    const res = await pilotageFetch<{ ok: boolean; devCode?: string }>("/api/backoffice/auth/request-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { devCode: res.devCode };
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const res = await pilotageFetch<{ token: string }>("/api/backoffice/auth/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    setPilotageSessionToken(res.token);
    setToken(res.token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await pilotageFetch("/api/backoffice/auth/logout", { method: "POST" });
    } finally {
      clearPilotageSessionToken();
      setToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({ token, loading, requestCode, verifyCode, logout }),
    [token, loading, requestCode, verifyCode, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBackofficeAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("BackofficeAuthProvider required");
  return ctx;
}
