import type { FeedEntry } from "./relational-feed.types.js";

export const MAX_CONSECUTIVE_SPONSORED = 3;
export const PARTNER_BATCH_BEFORE_SPONSORED = 5;

export function FeedContentBalancer(entries: FeedEntry[]): FeedEntry[] {
  const partners = entries.filter((e) => e.type === "PARTNER" || e.type === "EXTENDED");
  const sponsored = entries.filter((e) => e.type === "SPONSORED");
  const discovery = entries.filter(
    (e) => e.type === "DISCOVERY" || e.type === "BOOTSTRAP",
  );

  const out: FeedEntry[] = [];
  let partnerSinceSponsored = 0;
  let sponsoredStreak = 0;
  let si = 0;
  let di = 0;

  for (let i = 0; i < partners.length; i++) {
    out.push(partners[i]!);
    partnerSinceSponsored += 1;
    sponsoredStreak = 0;

    if (partnerSinceSponsored >= PARTNER_BATCH_BEFORE_SPONSORED && si < sponsored.length) {
      out.push(sponsored[si]!);
      si += 1;
      partnerSinceSponsored = 0;
      sponsoredStreak = 1;
    }
  }

  while (si < sponsored.length && sponsoredStreak < MAX_CONSECUTIVE_SPONSORED) {
    out.push(sponsored[si]!);
    si += 1;
    sponsoredStreak += 1;
    if (sponsoredStreak >= MAX_CONSECUTIVE_SPONSORED) break;
  }

  while (di < discovery.length) {
    out.push(discovery[di]!);
    di += 1;
  }

  while (si < sponsored.length) {
    if (out.length && out[out.length - 1]?.sponsored) {
      const streak = countTrailingSponsored(out);
      if (streak >= MAX_CONSECUTIVE_SPONSORED) {
        if (di < discovery.length) {
          out.push(discovery[di]!);
          di += 1;
        } else break;
      }
    }
    out.push(sponsored[si]!);
    si += 1;
  }

  return out;
}

function countTrailingSponsored(entries: FeedEntry[]): number {
  let n = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (!entries[i]?.sponsored) break;
    n += 1;
  }
  return n;
}

export function hasExcessiveConsecutiveSponsored(entries: FeedEntry[]): boolean {
  let streak = 0;
  for (const e of entries) {
    if (e.sponsored) {
      streak += 1;
      if (streak > MAX_CONSECUTIVE_SPONSORED) return true;
    } else streak = 0;
  }
  return false;
}
