# Industrial evidence layer (Instruction 18.8 / 18.8A)

## Scope

This layer is a **technical provenance and trust registry**: it aggregates lightweight readouts from existing industrial-economic bundles (command, coordination, scenarios, propagation, memory, situation room, operational continuity) and exposes **evidence rows**, a **trust matrix**, **derived traces** (explicitly non-causal), **limitations**, and a **source map**.

It is **not**:

- a legal audit system,
- a decision engine,
- an “AI explains everything” assistant,
- a substitute for MES / ERP / warehouse ground truth,
- a **forensic engine** (no chain-of-custody, no tamper-evident log, no court-grade attestation).

## Trust ≠ proof

The **trust matrix** is an **ordinal classification** of how rows should be read (verified domain event vs heuristic vs symbolic vs demo). It answers: *“what class of epistemic claim is this row making?”* — not *“is this true?”*.

- **`VERIFIED_DOMAIN`** is the strongest bucket **within this registry**; it still does not override upstream systems of record.
- **Heuristic** buckets (`STRONG_HEURISTIC` / `WEAK_HEURISTIC`) survive even when **`symbolicProjection`** is true: symbolic presentation is a **secondary overlay**, not an automatic downgrade to `SYMBOLIC_ONLY` for ordinary command/propagation-style rows.
- **`SYMBOLIC_ONLY`** is reserved for **intrinsic** symbolic signal types (e.g. `SYMBOLIC_PROJECTION` evidence type) or equivalent semantics — not for “any row that touched a map.”
- **`SYNTHETIC_DEMO_ONLY`** **dominates** when `demoOrSynthetic` is true.
- Matrix diagnostics (`trustReason`, `classificationPath`, `derivedFromFlags`) document **why** a bucket was chosen — transparency, not scoring.

## Traces ≠ causality

**Traces** (`traceKind: DERIVED_TRACE_NOT_CAUSAL_PROOF`) describe **alignment / correlation / co-occurrence / shared-pressure** readouts in the same advisory compose window. They are labeled with:

- `nonCausalTrace: true`
- `interpretationRisk` — how a reader might **misread** ordered nodes as sequencing or production causality
- `explanatoryBoundary` — explicit exclusion of causal verbs, legal proof, and dispatch claims

They do **not** assert production causality, legal liability, scheduling impact, or “propagation proof.”

## Heuristic boundaries (confidence)

When `heuristicConfidence` is true, the numeric `confidence` field is disclosed as a **heuristic confidence estimate** only (`confidenceHeuristic`, `confidenceDerivedFrom`, `confidenceInputs`). It is **not** a calibrated industrial measurement. If there is no defensible structural basis, the row should fall into **`UNKNOWN_SOURCE`** trust posture rather than inventing precision.

## Symbolic boundaries

Symbolic layers (maps, cells, corridors) are **consultative presentation**. They are **not** surveyed geography, live plant state, or MES truth. Limitations of type `symbolic_projection_limit` reinforce this at the limitation stream level.

## Interpretation risks

Readers may:

- confuse **correlation** with **causation**,
- confuse **bundle co-location** with **operational sequencing**,
- treat **ordinal proxies** as **KPIs**.

The bundle exposes `interpretationBoundary` and `reliabilityBoundary`; each snapshot includes **`evidenceScope`** (`what_is_real`, `what_is_heuristic`, `what_is_symbolic`, `what_is_demo`, `what_is_missing`) so surfaces can state scope **without** implying forensic completeness.

## Bundle-first rationale

The **authoritative client contract** is `GET …/industrial-evidence/bundle`. Slice routes (trust-matrix, traces, etc.) are **projections of the same materialized snapshot**, not independent recomputes. The web pole therefore loads **bundle only** when healthy; parallel slice fetches would duplicate work and **imply** independent evidence streams.

Degraded mode may record `fallbackSource` / `fallbackReason` when the snapshot is incomplete — **explicit** slice fallback remains a separate, non-automatic path.

## Source map hardening

Source map entries carry **categorical** metadata (`sourceFreshness`, `sourceReliability`, `sourceCompleteness`, `sourceAvailability`) derived from real upstream timestamps where available, **skipped** poles, **compose failures**, and **flags** — not invented numeric “scores.”

## Slice cost semantics (bundle view)

HTTP slice diagnostics use **`FULL_BUNDLE_VIEW`**, **`CACHE_REUSED_BUNDLE_VIEW`**, and **`DEGRADED_BUNDLE_VIEW`** — naming the **client view class** and cache reuse, not a misleading universal “full compose” on every request.

## Why this protects VENEXT

Industrial buyers need **honest disclosure** of signal origin and weakness. This layer centralizes **limitations** and **trust classification** so product surfaces cannot silently upgrade heuristics into “facts.” It supports audit **narratives** only in the sense of **provenance transparency** — without pretending to be a compliance log or forensic engine.

## Real vs heuristic vs symbolic vs demo

- **Domain / operational reality** is not claimed by this layer; upstream bundles remain authoritative.
- **Heuristic** rows are bounded advisory readouts (scores are proxies, not calibrated KPIs unless separately validated).
- **Symbolic projection** distinguishes narrative / cockpit geometry from surveyed geography or live plant state; it **does not** automatically collapse all trust to `SYMBOLIC_ONLY` when other priority rules apply.
- **Demo / synthetic** provenance must be labeled (`demoOrSynthetic`) and is classified as `SYNTHETIC_DEMO_ONLY` in the trust matrix when present (**priority rule**).
