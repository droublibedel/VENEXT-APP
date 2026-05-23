import { BackofficeAuthProvider } from "@/pilotage/auth/BackofficeAuthProvider";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <BackofficeAuthProvider>{children}</BackofficeAuthProvider>;
}
