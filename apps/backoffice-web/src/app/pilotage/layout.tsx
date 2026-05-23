import { BackofficeAuthProvider } from "@/pilotage/auth/BackofficeAuthProvider";
import { BackofficeSessionGuard } from "@/pilotage/auth/BackofficeSessionGuard";
import { PilotageShell } from "@/pilotage/shell/PilotageShell";

export default function PilotageLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackofficeAuthProvider>
      <BackofficeSessionGuard>
        <PilotageShell>{children}</PilotageShell>
      </BackofficeSessionGuard>
    </BackofficeAuthProvider>
  );
}
