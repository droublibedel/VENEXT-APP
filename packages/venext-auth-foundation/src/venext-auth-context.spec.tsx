import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import {
  VenextAuthProvider,
  useVenextAuth,
  MOCK_TERRAIN_OTP,
  clearAllAuthPersistence,
} from "./index";

function AuthProbe() {
  const auth = useVenextAuth();
  return (
    <div>
      <span data-testid="auth-status">{auth.isAuthenticated ? "in" : "out"}</span>
      <span data-testid="auth-label">{auth.profileLabel}</span>
      <button type="button" data-testid="login" onClick={() => auth.loginTerrain({ phone: "+22507001111", displayName: "Test", city: "Abidjan", activities: [] }, MOCK_TERRAIN_OTP)}>
        login
      </button>
      <button type="button" data-testid="logout" onClick={() => auth.logout()}>
        logout
      </button>
    </div>
  );
}

describe("VenextAuthProvider", () => {
  beforeEach(() => {
    cleanup();
    clearAllAuthPersistence();
  });

  it("starts anonymous", () => {
    render(
      <VenextAuthProvider actorRole="GROSSISTE_B" flags={{ venext_auth_foundation_enabled: true }}>
        <AuthProbe />
      </VenextAuthProvider>,
    );
    expect(screen.getByTestId("auth-status").textContent).toBe("out");
  });

  it("loginTerrain authenticates", () => {
    render(
      <VenextAuthProvider actorRole="GROSSISTE_B" flags={{ venext_auth_foundation_enabled: true }}>
        <AuthProbe />
      </VenextAuthProvider>,
    );
    act(() => {
      screen.getByTestId("login").click();
    });
    expect(screen.getByTestId("auth-status").textContent).toBe("in");
    expect(screen.getByTestId("auth-label").textContent).toBeTruthy();
  });

  it("logout clears session", () => {
    render(
      <VenextAuthProvider actorRole="GROSSISTE_B" flags={{ venext_auth_foundation_enabled: true }}>
        <AuthProbe />
      </VenextAuthProvider>,
    );
    act(() => {
      screen.getByTestId("login").click();
    });
    act(() => {
      screen.getByTestId("logout").click();
    });
    expect(screen.getByTestId("auth-status").textContent).toBe("out");
  });
});
