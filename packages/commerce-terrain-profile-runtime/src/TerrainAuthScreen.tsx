import { memo, useState, type ReactNode } from "react";

import { TerrainReconnectLogin } from "./TerrainReconnectLogin.js";
import type { TerrainLoginActorRole } from "./terrain-login-api.js";

export const TerrainAuthScreen = memo(function TerrainAuthScreen({
  actorRole,
  onAuthenticated,
  renderRegister,
}: {
  actorRole: TerrainLoginActorRole;
  onAuthenticated: (result: { organizationId: string; profile: Record<string, unknown> }) => void;
  renderRegister: (options: { onSwitchToLogin: () => void }) => ReactNode;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");

  if (mode === "register") {
    return <>{renderRegister({ onSwitchToLogin: () => setMode("login") })}</>;
  }

  return (
    <div data-testid="terrain-auth-screen" style={{ padding: 16 }}>
      <p className="terrain-profile-badge" data-testid="terrain-app-brand" style={{ marginBottom: 16 }}>
        VENEXT
      </p>
      <TerrainReconnectLogin
        actorRole={actorRole}
        onSuccess={onAuthenticated}
        onRegisterClick={() => setMode("register")}
      />
    </div>
  );
});
