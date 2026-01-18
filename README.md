
# README.md — Power BI Learning Project (Mental Health Ops Dataset)

## 🎯 Purpose (for Dan)
**Target Audience:** Dan (Six Sigma Black Belt / Ops Leader in Mental Health)

This project takes you from **Zero → Effective** in Power BI by running a full **DMAIC** journey on a realistic dataset (useful but imperfect).

You will use Power BI to answer real leadership questions, validate metrics like a Black Belt, and build dashboards you can demo in interviews.

---

## 🧭 IMPORTANT: How the Ralph Loop Works (for you + for Ralph)
That means these files are the *contract*:

1. `readme.md` — what Dan must do
2. `architecture.md` — how the dataset must be generated
3. `prd.json` — what Ralph must build

*(See [readme-ralph.md](readme-ralph.md) for full technical contract details)*

---

## 🛠️ Setup & Workflow (Dan)

### Step 1 — Connect Power BI to SQLite
1. Ensure you have a SQLite connector available:
   - If Power BI supports direct SQLite for your install, use it.
   - Otherwise use SQLite ODBC (then connect via ODBC).
2. Power BI Desktop → **Get Data**
3. Choose **SQLite** (or **ODBC**) → select: `workspace/mental_health_demo.sqlite`
4. Choose **Import** (not DirectQuery) to enable full Power Query features.

### Step 2 — Data Audit (Power Query Quick Win)
Before visualizing, do a Black Belt audit:
- Transform Data → inspect dimensions:
  - `dim_facility.facility_name` has inconsistent capitalization (5–10%)
  - `dim_provider.provider_name` has trailing spaces (5–10%)
- **Task:** Make slicers “executive clean”
  - Trim/Clean provider names
  - Proper-case facility names
  - Confirm data types (especially integer date keys)

---

## ✅ How to Verify Your Work (The Answer Key)
We have built a **Verification Web App** that mimics the exact Power BI dashboards you are trying to build. Use this as your "Answer Key" to check your numbers and logic.

### How to Run It (Easy Mode)
1. Open your terminal (PowerShell or Command Prompt) in this folder.
2. Run this single command:
   ```bash
   docker-compose up webapp
   ```
3. Open your browser to: **[http://localhost:3000](http://localhost:3000)**

### What You Will See
- **Define Phase**: Compare your KPI totals against these numbers.
- **Measure Phase**: See the exact rows that fail the wait time audit.
- **Analyze/Control**: See the target charts (Pareto, Control Charts) to replicate.

---

## 📊 Your DMAIC Journey

### Phase 1: DEFINE — Establish the Baseline
**Deliverable:** Executive Baseline Dashboard (Current State)
- KPI cards:
  - Total encounters
  - Avg wait days
  - No-show rate
- Trend by month: total encounters, avg wait days
- **Verification Gate:** Your totals must match SQL baseline view:
  - `vw_kpi_baseline`

---

### Phase 2: MEASURE — Validate the Metrics (Trust But Verify)
**Deliverable:** Metric Validation Report
- Dataset includes a stored column: `fact_encounter.wait_days`
- **Challenge:** Calculate wait days yourself:
  - wait = scheduled_date - request_date
- Compare your computed measure vs stored `wait_days`
- **Verification Gate:** Confirm audit view shows zero mismatch:
  - `vw_wait_time_audit.mismatch_count = 0`

---

### Phase 3: ANALYZE — Find Root Causes
**Deliverable:** Pareto + Root Cause Dashboard
- Pareto:
  - No-shows by facility
  - No-shows by provider
- Heatmap:
  - Facility × Day-of-week → No-show rate
- Scatter:
  - Provider load (X) vs Avg outcome (Y)

---

### Phase 4: IMPROVE — Model Interventions
**Deliverable:** What-If Scenario Dashboard
- Parameter: “Proposed No-Show Rate Reduction (%)”
- Show impact:
  - recovered minutes
  - recovered encounters

---

### Phase 5: CONTROL — Build Monitoring System (SPC-Ready)
**Deliverable:** Control Charts Dashboard
- Use `sigma_band` + time series to build SPC-style monitoring
- Flag out-of-control points (`sigma_band = 'Outside_3σ'`)

---

## ✅ Skill Progression Path (Checklist)

### Level 1: Basic Measures
- [ ] Count of encounters
- [ ] Average wait days
- [ ] No-show rate %

### Level 2: Time Intelligence
- [ ] MoM growth
- [ ] Moving 30-day average

### Level 3: Advanced DAX
- [ ] RANKX provider performance
- [ ] Running totals

### Level 4: Black Belt Specials (Optional)
- [ ] DPMO proxy (no-shows as defects)
- [ ] Throughput yield proxy (request→scheduled→completed)
- [ ] Capability-style analysis on wait time distribution

---

## ✅ Sanity Check Views (SQL)
- `vw_kpi_baseline` — one-row baseline totals
- `vw_wait_time_audit` — one-row audit (mismatch_count must be 0)

---

## 🧠 Data Model (Under the Hood)
Star schema:

- **Fact:** `fact_encounter`
- **Dims:** `dim_date`, `dim_facility`, `dim_provider`, `dim_patient`, `dim_diagnosis`, `dim_payer`

**Date keys are integers (YYYYMMDD)**:
- `request_date_key`
- `scheduled_date_key`
- `completed_date_key` (nullable)

The dataset includes real ops patterns:
- seasonality (summer + December)
- day-of-week effects (Mon/Fri higher no-shows)
- provider continuity (patients tend to see same provider)
- mild cascade effect (a no-show increases next no-show probability)

---

## 🤖 For Agent Developers (Ralph)
If you are working on the autonomous agent or the underlying generator logic, please consult:
**[readme-ralph.md](readme-ralph.md)**
