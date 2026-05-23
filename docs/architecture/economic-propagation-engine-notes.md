# Economic propagation engine — credibility and scope (v1)

This note documents what the **economic propagation** slice in VENEXT represents today, so investor and industrial audiences do not over-interpret demo output as econometric truth.

## Deterministic heuristic v1

The engine is a **deterministic heuristic v1**: thresholds, ratios, and rule tables operate on a **cross-pole snapshot** built from existing domain data services. There is **no RNG** in the core shock and chain materialization paths described for Instruction 18.1 / 18.1A.

## Symbolic projection is not real GIS

Operational canvases that visualize propagation may place zones inside a **demo bounding box** using **hash-derived pseudo-coordinates**. The API and UI label this as **symbolic projection** (`geometryMode: SYMBOLIC_PROJECTION`, `realGeography: false`). These shapes are **not** surveyed parcel boundaries, cadastre, or verified logistics geography.

## Simulation uses synthetic anchor shocks

The **simulation** endpoint projects impacts from a **synthetic anchor shock** chosen from supported trigger types and optional territory / severity inputs. Anchors are **counterfactual probes** on the same snapshot lattice, not predictions from a calibrated macro model.

## Causality is rule-based, not econometric

Cross-pole **chains** and **impacts** come from an explicit **rule engine** (pole targets, weights, delays, explanations). This is **rule-based narrative causality** for supervision and sequencing discipline — not yet **econometric identification**, historical backtesting, or learned causal graphs validated on production outcomes.

## Roadmap (industrial credibility)

A production-grade propagation layer would require at minimum:

- **Calibration** of thresholds to sector and corridor baselines  
- **Historical validation** (out-of-sample stress episodes, receivable behavior, logistics KPIs)  
- **Stronger causal evidence** (confounding controls, counterfactual baselines, explicit uncertainty quantification)  
- Clear separation between **observatory** outputs and **decision** policies

Until then, bundles should be presented as **decision-support heuristics** aligned to the symbolic map disclaimer and this document.
