"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { vx } from "../ui/vx-styles";

const NAV = [
  { href: "/governance/overview", label: "Overview" },
  { href: "/governance/features", label: "Feature control" },
  { href: "/governance/organizations", label: "Ecosystem" },
  { href: "/governance/relationships", label: "Relationship graph" },
  { href: "/governance/sponsored-visibility", label: "Sponsored visibility" },
  { href: "/governance/ai-gateway", label: "AI gateway" },
  { href: "/governance/realtime", label: "Realtime" },
  { href: "/governance/industrial-poles", label: "Industrial poles" },
  { href: "/governance/payments", label: "Payments" },
  { href: "/governance/safety", label: "Safety" },
  { href: "/governance/data-quality", label: "Data quality" },
  { href: "/governance/audit-logs", label: "Audit logs" },
  { href: "/governance/enterprise-governance", label: "Enterprise governance" },
] as const;

export function LeftNav() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col border-r py-3" style={{ borderColor: vx.line, backgroundColor: "#12171c" }}>
      <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Governance</p>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className="mx-2 rounded px-2 py-2 text-[12px] leading-tight transition-colors"
              style={{
                backgroundColor: active ? vx.teal : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.72)",
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
