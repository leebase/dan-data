# Ralph & Dan Contract: Generator Architecture

This file is an AUTHORITATIVE contract for Ralph. Ralph must operate with zero outside context.

## Schema Declaration
- Dimensions: facilities, providers, patients, services, dates, referral sources
- Facts: encounters, wait times, outcomes, staffing, capacity, satisfaction
- Meta: single-row table for spec hashes and run metadata

## Generation Order (Mandatory)
1. Load authoritative specs (`workspace/readme.md`, `workspace/architecture.md`) and compute SHA256 hashes
2. Create SQLite with `PRAGMA foreign_keys = ON`
3. Populate dimension tables first and cache their keys
4. Generate fact tables using only cached keys
5. Create required views and indexes
6. Run integrity checks
7. Write meta table with hashes
8. Write `workspace/spec_fingerprint.json`

## Invariants (No Time Travel)
- `request_date_key` must be <= `scheduled_date_key`
- If `status = 'Completed'`, then `completed_date_key` is not null and >= `scheduled_date_key`
- `wait_days` equals (scheduled - request) in days

## Required Views
- `vw_kpi_baseline` (one-row baseline totals)
- `vw_wait_time_audit` (mismatch_count must be 0)

## Traceability Requirements
- SHA256 hashes of `workspace/readme.md` and `workspace/architecture.md` stored in the SQLite meta table
- Hashes written to `workspace/spec_fingerprint.json`

## Authority Statement
This document is the authoritative generator contract for Ralph. If anything conflicts with external docs, this file wins.
