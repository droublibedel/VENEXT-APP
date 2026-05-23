import type { Relationship } from "@prisma/client";

import {
  ECONOMIC_GRAPH_PEER_SCAN_LIMIT,
  ECONOMIC_GRAPH_PEER_SCAN_MODE,
  ECONOMIC_GRAPH_PEER_SCAN_WARNING,
} from "./relational-economic-signal-graph.constants";

export type PeerScanDiagnostics = {
  peerScanLimit: number;
  peerScanLimitApplied: boolean;
  peerCandidatesCount: number;
  peerScannedCount: number;
  peerScanCompletenessRatio: number;
  peerScanMode: typeof ECONOMIC_GRAPH_PEER_SCAN_MODE;
  warnings?: string[];
};

export function buildPeerScanDiagnostics(
  peerCandidatesCount: number,
  peerScannedCount: number,
): PeerScanDiagnostics {
  const peerScanLimitApplied = peerCandidatesCount > ECONOMIC_GRAPH_PEER_SCAN_LIMIT;
  return {
    peerScanLimit: ECONOMIC_GRAPH_PEER_SCAN_LIMIT,
    peerScanLimitApplied,
    peerCandidatesCount,
    peerScannedCount,
    peerScanCompletenessRatio:
      peerCandidatesCount > 0 ? Math.round((peerScannedCount / peerCandidatesCount) * 1000) / 1000 : 1,
    peerScanMode: ECONOMIC_GRAPH_PEER_SCAN_MODE,
    warnings: peerScanLimitApplied ? [ECONOMIC_GRAPH_PEER_SCAN_WARNING] : undefined,
  };
}

export function slicePeersForBoundedScan<T extends Pick<Relationship, "id">>(
  candidates: T[],
): { peers: T[]; diagnostics: PeerScanDiagnostics } {
  const peerCandidatesCount = candidates.length;
  const peers = candidates.slice(0, ECONOMIC_GRAPH_PEER_SCAN_LIMIT);
  return {
    peers,
    diagnostics: buildPeerScanDiagnostics(peerCandidatesCount, peers.length),
  };
}
