import { GovernanceCommandShell } from "@/components/governance/shell/GovernanceCommandShell";

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return <GovernanceCommandShell>{children}</GovernanceCommandShell>;
}
