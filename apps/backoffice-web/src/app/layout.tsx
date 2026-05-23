import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "commerce-humanized-errors/styles.css";
import "commerce-ux-harmony/styles.css";
import "commerce-ux-harmony/skeleton.css";

import { BackofficeHumanizedRoot } from "@/errors/BackofficeHumanizedRoot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VENEXT — Backoffice",
  description: "Governance, audit, and network operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CI">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BackofficeHumanizedRoot>{children}</BackofficeHumanizedRoot>
      </body>
    </html>
  );
}
