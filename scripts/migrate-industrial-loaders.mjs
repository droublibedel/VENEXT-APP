import fs from "node:fs";
import path from "node:path";

const root = path.resolve("apps/web-industrial-nextjs/src");
const importLine =
  'import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";\n';

const patterns = [
  [/return <p className="px-4 py-6 text-xs text-slate-500">Chargement[^<]*<\/p>;/g, "return <VenextInlineSkeleton />;"],
  [/return <p className="text-sm text-slate-500">Chargement[^<]*<\/p>;/g, 'return <VenextInlineSkeleton variant="wallet" className="p-2" />;'],
  [/return <p className="text-xs text-slate-500">Chargement[^<]*<\/p>;/g, 'return <VenextInlineSkeleton variant="table" className="p-2" />;'],
  [/return <p className="text-\[9px\] text-slate-500">Chargement[^<]*<\/p>;/g, 'return <VenextInlineSkeleton variant="table" className="p-1" />;'],
  [/return <p className="p-4 text-sm text-slate-400">Chargement[^<]*<\/p>;/g, 'return <VenextInlineSkeleton variant="messaging" className="p-4" />;'],
  [/<p className="px-4 py-6 text-xs text-slate-500">Chargement[^<]*<\/p>/g, "<VenextInlineSkeleton />"],
  [/<p className="mt-1 text-sm text-neutral-600">Chargement[^<]*<\/p>/g, '<VenextInlineSkeleton variant="orders" className="mt-1 py-2" />'],
  [/<p className="mt-2 text-xs text-slate-500">Chargement[^<]*<\/p>/g, '<VenextInlineSkeleton variant="pole" className="mt-2 py-2" />'],
  [/\{feedLoading \? <p className="text-xs text-slate-500">Chargement[^<]*<\/p> : null\}/g, "{feedLoading ? <VenextInlineSkeleton variant=\"catalog\" className=\"py-2\" /> : null}"],
  [/\{loading \? <p className="text-sm text-slate-500">Chargement[^<]*<\/p> : null\}/g, "{loading ? <VenextInlineSkeleton variant=\"pole\" className=\"py-2\" /> : null}"],
  [/\{loadingMore \? "Chargement…" : "Charger page suivante"\}/g, '{loadingMore ? "Suite en cours…" : "Charger page suivante"}'],
  [
    /<Suspense fallback={<p className="[^"]*">Chargement[^<]*<\/p>}>/g,
    "<Suspense fallback={<VenextInlineSkeleton />}>",
  ],
  [
    /fallback={<p className="p-8 text-sm text-slate-400">Chargement[^<]*<\/p>}/g,
    'fallback={<VenextInlineSkeleton variant="messaging" className="p-8" />}',
  ],
  [/Chargement cockpit producteur…/g, ""],
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  if (!/Chargement/.test(src)) continue;
  if (/relational-fulfillment-copy|loadingMore|Chargement confirmé|Chargement partiel/.test(src)) continue;
  const original = src;
  for (const [re, rep] of patterns) src = src.replace(re, rep);
  if (src === original) continue;
  if (!src.includes("VenextInlineSkeleton")) {
    const idx = src.indexOf("\n");
    src = src.slice(0, idx + 1) + importLine + src.slice(idx + 1);
  }
  fs.writeFileSync(file, src);
  changed += 1;
  console.log("updated", file);
}
console.log("files", changed);
