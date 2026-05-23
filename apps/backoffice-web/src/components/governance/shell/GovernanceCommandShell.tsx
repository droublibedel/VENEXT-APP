"use client";

import { useEffect, type ReactNode } from "react";
import { GovernanceShellProvider, useGovernanceShell } from "../context/GovernanceShellContext";
import { CommandHeader } from "./CommandHeader";
import { LeftNav } from "./LeftNav";
import { RightRail } from "./RightRail";

function ShellInner({ children }: { children: ReactNode }) {
  const { refreshOverview } = useGovernanceShell();

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0d1114" }}>
      <CommandHeader />
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 lg:grid-cols-[220px_1fr_260px]">
        <LeftNav />
        <section className="min-h-[calc(100vh-120px)] border-x border-white/[0.06] px-4 py-5">{children}</section>
        <RightRail />
      </div>
    </div>
  );
}

export function GovernanceCommandShell({ children }: { children: ReactNode }) {
  return (
    <GovernanceShellProvider>
      <ShellInner>{children}</ShellInner>
    </GovernanceShellProvider>
  );
}
