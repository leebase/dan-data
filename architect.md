
# architecture.md — Dataset Generation Plan (Python + SQLite)

## Objective
Generate a **deterministic, referentially intact SQLite database** (`workspace/mental_health_demo.sqlite`) that simulates mental-health operations with:
- controlled messiness for Power Query practice
- metric verification views for Black Belt validation
- SPC readiness fields for CONTROL phase

## Ralph Loop Contract (Must Follow)
Ralph receives no external context. This file is **authoritative** for:
- schema
- generation order
- invariants
- realism patterns
- required views
- verification/traceability artifacts

**Traceability Requirement (binding):**
The generator must compute SHA256 of:
- `workspace/readme.md`
- `workspace/architecture.md`

…and write them to:
1) SQLite `meta` table (single row)
2) `workspace/spec_fingerprint.json`

The verifier will recompute these hashes from file contents and require exact match.

---

## Technical Constraints
1. **Language:** Python 3.x
2. **Libraries:** Standard Library only (`sqlite3`, `random`, `datetime`, `math`, `hashlib`, `json`, `pathlib`)
3. **Determinism:** `random.seed(42)` and record in `meta`
4. **Foreign Keys:** Enforce with `PRAGMA foreign_keys = ON`
5. **Date Keys:** INTEGER **YYYYMMDD** format

---

## Schema Specification

### Dimensions (Generate First)

**dim_date**
- `date_key` INTEGER PK (YYYYMMDD)
- `full_date` TEXT ISO-8601 (YYYY-MM-DD)
- `year`, `quarter`, `month_num`, `month_name`
- `day_of_week` (1-7), `day_name`, `is_weekend` (0/1)

**dim_facility**
- `facility_id` INTEGER PK
- `facility_name` TEXT (dirty capitalization in 5–10%)
- `region_type` TEXT (Urban/Suburban/Rural)
- `state` TEXT (AZ + at least 2 others)

**dim_provider**
- `provider_id` INTEGER PK
- `provider_name` TEXT (trailing whitespace in 5–10%)
- `role` TEXT (Psychiatrist/Therapist/CaseManager)
- `home_facility_id` INTEGER FK → dim_facility
- `bi_tip` TEXT (optional meta-learning breadcrumb)

**dim_patient**
- `patient_id` INTEGER PK
- `age_band` TEXT
- `gender` TEXT
- `risk_tier` INTEGER (1–3)

**dim_diagnosis**
- `diagnosis_id` INTEGER PK
- `diagnosis_group` TEXT
- `severity_band` TEXT (Mild/Moderate/Severe)

**dim_payer**
- `payer_id` INTEGER PK
- `payer_type` TEXT (Commercial/Medicaid/Medicare/SelfPay)
- `payer_name` TEXT

---

### Fact (Generate Second)

**fact_encounter**
- `encounter_id` INTEGER PK
- Foreign keys:
  - `patient_id` → dim_patient
  - `provider_id` → dim_provider
  - `facility_id` → dim_facility
  - `diagnosis_id` → dim_diagnosis
  - `payer_id` → dim_payer
  - `request_date_key` → dim_date
  - `scheduled_date_key` → dim_date
  - `completed_date_key` → dim_date (nullable)
- Attributes / Metrics:
  - `encounter_status` TEXT (Completed/NoShow/Cancelled/Scheduled)
  - `visit_type` TEXT (Intake/FollowUp/Crisis/Group)
  - `wait_days` INTEGER (must equal scheduled-request delta)
  - `duration_minutes` INTEGER
  - `outcome_score` INTEGER (1–10; nullable; only Completed)
  - `no_show_flag` INTEGER (0/1; consistent with status)
  - `sigma_band` TEXT (Within_1σ / Within_2σ / Within_3σ / Outside_3σ)
  - `data_quality_flag` INTEGER (0=clean, 1=investigate)
  - `quality_note` TEXT

**meta** (single-row)
- `dataset_name` TEXT
- `version` TEXT
- `generated_utc` TEXT
- `random_seed` INTEGER
- `rowcount_fact_encounter` INTEGER
- `spec_version` TEXT
- `readme_sha256` TEXT
- `architecture_sha256` TEXT
- `dedication` TEXT

---

## Generation Order (Hard Requirement)
1. Load file contents of `workspace/readme.md` and `workspace/architecture.md`
2. Compute SHA256 for each (hex digest)
3. Connect to SQLite and set `PRAGMA foreign_keys = ON;`
4. Create tables with PK/FK constraints
5. Populate dimensions (in order):
   - dim_date (>= 2 full years daily)
   - dim_facility
   - dim_provider
   - dim_patient
   - dim_diagnosis
   - dim_payer
6. Cache dimension keys in memory lists
7. Generate fact rows by sampling ONLY from cached keys
8. Create indexes on fact FK columns and date keys
9. Create views
10. Run integrity checks; fail fast on violations
11. Insert single meta row including hashes + seed + rowcounts
12. Write `workspace/spec_fingerprint.json` containing:
    - spec_version
    - readme_sha256
    - architecture_sha256
    - random_seed
    - rowcount_fact_encounter
13. Close DB

---

## Logic & Realism Rules

### Date Logic (Prevent “Time Travel”)
For each encounter:
- request_date_key <= scheduled_date_key
- If status == Completed:
  - completed_date_key NOT NULL
  - completed_date_key >= scheduled_date_key
- Else:
  - completed_date_key NULL (recommended)

**wait_days must equal (scheduled - request) in days.**

### Operational Patterns
- Seasonality: higher no-shows in summer + December
- Day-of-week: Monday/Friday higher no-show probability
- Provider continuity: patient tends to see the same provider often
- Cascade: a no-show slightly increases probability of next no-show for that patient
- Intake bottleneck: intake waits longer than follow-ups
- Rural effect: wait days higher in Rural region_type

### SPC Readiness (`sigma_band`) distribution
- Within_1σ: 68%
- Within_2σ: 27%
- Within_3σ: 4%
- Outside_3σ: 1%

### Data Quality Flags
At least 2% of rows:
- data_quality_flag=1
- quality_note non-empty (e.g., Late entry, Weekend scheduling)

---

## Controlled Messiness (Power Query Trap)
- 5–10% facility_name inconsistent capitalization
- 5–10% provider_name trailing whitespace
Never dirty keys. Never null foreign keys.

---

## Required Views (Verification + Learning)

### vw_kpi_baseline (one row)
- total_encounters
- avg_wait_days
- no_show_rate

### vw_wait_time_audit (one row)
- total_rows
- mismatch_count
- avg_variance

mismatch_count must be 0.

---

## Integrity Checks (Must Pass)
- PRAGMA foreign_keys = 1
- Orphan checks for all fact FK joins return 0
- Date logic checks pass
- vw_wait_time_audit.mismatch_count = 0
