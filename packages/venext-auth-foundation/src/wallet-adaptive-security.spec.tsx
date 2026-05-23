/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { WalletAdaptiveSecurityShell } from "./WalletAdaptiveSecurityShell";
import { WalletBceaoActivationFlow } from "./WalletBceaoActivationFlow";
import { WalletSecuredLockGate } from "./WalletSecuredLockGate";
import {
  VenextAuthProvider,
  VenextWalletSecurityProvider,
  clearWalletSecurityPersistence,
  configureWalletPin,
  lockWalletSession,
  secureWalletSession,
} from "./index";

const terrainFlags = {
  venext_auth_foundation_enabled: true,
  terrain_unlimited_session_enabled: true,
  wallet_adaptive_security_enabled: true,
  wallet_bceao_kyc_enabled: true,
  wallet_biometric_unlock_enabled: true,
};

function SecurityHarness({
  balanceFcfa = 0,
  children,
}: {
  balanceFcfa?: number;
  children: React.ReactNode;
}) {
  return (
    <VenextAuthProvider actorRole="GROSSISTE_B" flags={terrainFlags} walletBalanceFcfa={balanceFcfa}>
      <VenextWalletSecurityProvider actorRole="GROSSISTE_B" balanceFcfa={balanceFcfa} flags={terrainFlags}>
        {children}
      </VenextWalletSecurityProvider>
    </VenextAuthProvider>
  );
}

describe("wallet adaptive security UI (20.78-A)", () => {
  beforeEach(() => {
    clearWalletSecurityPersistence();
    localStorage.clear();
  });

  afterEach(() => cleanup());

  it("light mode renders wallet content without lock gate", () => {
    render(
      <SecurityHarness balanceFcfa={0}>
        <WalletAdaptiveSecurityShell>
          <p data-testid="wallet-inner">Solde visible</p>
        </WalletAdaptiveSecurityShell>
      </SecurityHarness>,
    );
    expect(screen.getByTestId("wallet-inner")).toBeTruthy();
    expect(screen.queryByTestId("wallet-secured-lock-gate")).toBeNull();
    expect(screen.queryByTestId("wallet-bceao-activation")).toBeNull();
  });

  it("secured balance without PIN shows BCEAO activation flow", () => {
    render(
      <SecurityHarness balanceFcfa={1500}>
        <WalletAdaptiveSecurityShell>
          <p data-testid="wallet-inner">Solde visible</p>
        </WalletAdaptiveSecurityShell>
      </SecurityHarness>,
    );
    expect(screen.getByTestId("wallet-bceao-activation")).toBeTruthy();
    expect(screen.queryByTestId("wallet-inner")).toBeNull();
  });

  it("activation flow advances from intro to identity", () => {
    render(
      <SecurityHarness balanceFcfa={2000}>
        <WalletBceaoActivationFlow />
      </SecurityHarness>,
    );
    fireEvent.click(screen.getByTestId("wallet-activation-start"));
    expect(screen.getByTestId("wallet-kyc-firstname")).toBeTruthy();
  });

  it("secured mode with PIN configured shows lock gate when locked", () => {
    configureWalletPin("1234");
    secureWalletSession("1234");
    lockWalletSession();

    render(
      <SecurityHarness balanceFcfa={2000}>
        <WalletSecuredLockGate>
          <p data-testid="wallet-inner">Protégé</p>
        </WalletSecuredLockGate>
      </SecurityHarness>,
    );
    expect(screen.getByTestId("wallet-secured-lock-gate")).toBeTruthy();
    expect(screen.getByTestId("wallet-unlock-pin")).toBeTruthy();
    expect(screen.queryByTestId("wallet-inner")).toBeNull();
  });

  it("unlock with valid PIN reveals wallet content", () => {
    configureWalletPin("5678");
    secureWalletSession("5678");
    lockWalletSession();

    render(
      <SecurityHarness balanceFcfa={2500}>
        <WalletSecuredLockGate>
          <p data-testid="wallet-inner">Protégé</p>
        </WalletSecuredLockGate>
      </SecurityHarness>,
    );

    fireEvent.change(screen.getByTestId("wallet-unlock-pin"), { target: { value: "5678" } });
    fireEvent.click(screen.getByTestId("wallet-unlock-submit"));
    expect(screen.getByTestId("wallet-inner")).toBeTruthy();
  });
});
