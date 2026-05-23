import { describe, expect, it } from "vitest";

import { ECONOMIC_GRAPH_PEER_SCAN_LIMIT } from "./relational-economic-signal-graph.constants";
import { buildPeerScanDiagnostics, slicePeersForBoundedScan } from "./relational-economic-peer-scan";

describe("Instruction 20.19A — peer scan diagnostics", () => {
  it("10 peers → limitApplied false", () => {
    const d = buildPeerScanDiagnostics(10, 10);
    expect(d.peerScanLimit).toBe(ECONOMIC_GRAPH_PEER_SCAN_LIMIT);
    expect(d.peerScanLimitApplied).toBe(false);
    expect(d.peerScannedCount).toBe(10);
    expect(d.warnings).toBeUndefined();
  });

  it("20 peers → limitApplied true + scanned 15", () => {
    const { peers, diagnostics } = slicePeersForBoundedScan(
      Array.from({ length: 20 }, (_, i) => ({ id: `peer-${i}` })),
    );
    expect(peers).toHaveLength(15);
    expect(diagnostics.peerScanLimitApplied).toBe(true);
    expect(diagnostics.peerScannedCount).toBe(15);
    expect(diagnostics.peerCandidatesCount).toBe(20);
    expect(diagnostics.warnings).toEqual(["PEER_SCAN_BOUNDED_V1"]);
    expect(diagnostics.peerScanMode).toBe("BOUNDED_V1");
  });
});
