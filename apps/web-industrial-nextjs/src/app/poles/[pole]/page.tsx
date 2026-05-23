import { notFound } from "next/navigation";

import { PoleEntryClient } from "@/poles/shell/PoleEntryClient";
import { POLE_SLUGS, getPoleEntry } from "@/poles/registry";
import type { PoleSlug } from "@/poles/types";

export function generateStaticParams() {
  return POLE_SLUGS.map((pole) => ({ pole }));
}

export default async function PoleRoutePage({
  params,
}: {
  params: Promise<{ pole: string }>;
}) {
  const { pole } = await params;
  if (!getPoleEntry(pole)) notFound();
  return <PoleEntryClient pole={pole as PoleSlug} />;
}
