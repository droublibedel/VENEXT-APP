import type { Metadata } from "next";
import "./globals.css";
import "commerce-notifications/styles.css";
import "commercial-activity-feed/styles.css";
import "commerce-offline-foundation/styles.css";
import "commerce-ux-harmony/styles.css";
import "commerce-ux-harmony/skeleton.css";
import "commerce-humanized-errors/styles.css";

import { IndustrialHumanizedErrorShell } from "@/errors/IndustrialHumanizedErrorShell";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "VENEXT — Industrial pole",
  description: "Industrial intelligence surface for manufacturers and poles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-vx-surface text-vx-ink antialiased">
        <QueryProvider>
          <IndustrialHumanizedErrorShell>{children}</IndustrialHumanizedErrorShell>
        </QueryProvider>
      </body>
    </html>
  );
}
