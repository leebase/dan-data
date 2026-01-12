# Ralph & Dan Contract: Learning Dataset Spec

This file is an AUTHORITATIVE contract for Ralph. Ralph must operate with zero outside context.

## Purpose
This workspace spec defines the learner-facing dataset expectations for the Six Sigma mental health operations dataset. Treat it as the source of truth.

## DMAIC Phases, Deliverables, and Verification Gates

### Define
- Deliverables: problem statement, CTQs, stakeholder map
- Verification gate: confirm scope in `vw_kpi_baseline`

### Measure
- Deliverables: baseline metrics, data dictionary, measurement plan
- Verification gate: totals and row counts match `vw_kpi_baseline`

### Analyze
- Deliverables: root cause analysis, Pareto findings, sigma band review
- Verification gate: wait-time audit shows zero mismatches in `vw_wait_time_audit`

### Improve
- Deliverables: improvement plan, simulated interventions, future-state KPIs
- Verification gate: improvements still satisfy `vw_kpi_baseline` and `vw_wait_time_audit`

### Control
- Deliverables: control plan, monitoring dashboards, SOP updates
- Verification gate: control KPIs remain consistent with `vw_kpi_baseline`

## Authority Statement
This document is the authoritative learner contract for Ralph. If anything conflicts with external docs, this file wins.
