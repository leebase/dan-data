#!/usr/bin/env python3
"""Populate dimension tables with controlled dirty data."""

from __future__ import annotations

import datetime as dt
import random
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "mental_health_demo.sqlite"


def date_key(date: dt.date) -> int:
    return int(date.strftime("%Y%m%d"))


def quarter_for_month(month: int) -> int:
    return (month - 1) // 3 + 1


def date_range(start: dt.date, end: dt.date) -> list[dt.date]:
    dates = []
    current = start
    while current <= end:
        dates.append(current)
        current += dt.timedelta(days=1)
    return dates


def sigma_band_value() -> str:
    roll = random.random()
    if roll < 0.68:
        return "Within_1σ"
    if roll < 0.95:
        return "Within_2σ"
    if roll < 0.99:
        return "Within_3σ"
    return "Outside_3σ"


def build_dim_date(cursor: sqlite3.Cursor, start: dt.date, end: dt.date) -> None:
    rows = []
    current = start
    while current <= end:
        rows.append(
            (
                date_key(current),
                current.isoformat(),
                current.year,
                quarter_for_month(current.month),
                current.month,
                current.strftime("%B"),
                current.isoweekday(),
                current.strftime("%A"),
                1 if current.isoweekday() >= 6 else 0,
            )
        )
        current += dt.timedelta(days=1)
    cursor.executemany(
        """
        INSERT INTO dim_date (
            date_key,
            full_date,
            year,
            quarter,
            month_num,
            month_name,
            day_of_week,
            day_name,
            is_weekend
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def build_dim_facility(cursor: sqlite3.Cursor) -> list[int]:
    facilities = [
        ("Phoenix Wellness Center", "Urban", "AZ"),
        ("Tucson Recovery Clinic", "Suburban", "AZ"),
        ("Flagstaff Behavioral Hub", "Rural", "AZ"),
        ("Mesa Family Counseling", "Suburban", "AZ"),
        ("Sedona Mindful Health", "Rural", "AZ"),
        ("Denver Mental Health", "Urban", "CO"),
        ("Boulder Resilience Center", "Suburban", "CO"),
        ("Santa Fe Support Services", "Rural", "NM"),
        ("Albuquerque Care Network", "Urban", "NM"),
        ("Austin Therapy Partners", "Urban", "TX"),
        ("Dallas Community Care", "Urban", "TX"),
        ("San Diego Wellness", "Urban", "CA"),
        ("Sacramento Behavioral", "Suburban", "CA"),
        ("Las Vegas Recovery", "Urban", "NV"),
        ("Reno Counseling Group", "Suburban", "NV"),
    ]

    dirty_count = max(1, round(len(facilities) * 0.07))
    dirty_indexes = set(random.sample(range(len(facilities)), dirty_count))

    rows = []
    for index, (name, region, state) in enumerate(facilities, start=1):
        if index - 1 in dirty_indexes:
            name = name.upper() if random.random() < 0.5 else name.lower()
        rows.append((index, name, region, state))

    cursor.executemany(
        """
        INSERT INTO dim_facility (facility_id, facility_name, region_type, state)
        VALUES (?, ?, ?, ?)
        """,
        rows,
    )
    return [row[0] for row in rows]


def build_dim_provider(cursor: sqlite3.Cursor, facility_ids: list[int]) -> None:
    first_names = [
        "Alex",
        "Jordan",
        "Taylor",
        "Morgan",
        "Riley",
        "Casey",
        "Sam",
        "Jamie",
        "Quinn",
        "Avery",
        "Cameron",
        "Drew",
        "Hayden",
        "Logan",
        "Parker",
        "Reese",
        "Rowan",
        "Spencer",
        "Sydney",
        "Zion",
    ]
    last_names = [
        "Adams",
        "Baker",
        "Carter",
        "Diaz",
        "Edwards",
        "Foster",
        "Garcia",
        "Hernandez",
        "Ibrahim",
        "Johnson",
        "Kim",
        "Lopez",
        "Miller",
        "Nguyen",
        "Olsen",
        "Patel",
        "Quintana",
        "Reed",
        "Singh",
        "Turner",
        "Usman",
        "Valdez",
        "Walker",
        "Xu",
        "Young",
        "Zamora",
    ]
    roles = ["Psychiatrist", "Therapist", "CaseManager"]

    provider_count = 80
    dirty_count = max(3, round(provider_count * 0.07))
    dirty_indexes = set(random.sample(range(provider_count), dirty_count))

    rows = []
    for index in range(provider_count):
        first = random.choice(first_names)
        last = random.choice(last_names)
        name = f"{first} {last}"
        if index in dirty_indexes:
            name = f"{name}  "
        rows.append(
            (
                index + 1,
                name,
                random.choice(roles),
                random.choice(facility_ids),
                None,
            )
        )

    cursor.executemany(
        """
        INSERT INTO dim_provider (provider_id, provider_name, role, home_facility_id, bi_tip)
        VALUES (?, ?, ?, ?, ?)
        """,
        rows,
    )


def build_dim_patient(cursor: sqlite3.Cursor) -> None:
    age_bands = ["Under 18", "18-25", "26-35", "36-45", "46-55", "56-65", "65+"]
    genders = ["Female", "Male", "Nonbinary", "Unknown"]
    risk_tiers = [1, 2, 3]

    rows = []
    for index in range(3000):
        rows.append(
            (
                index + 1,
                random.choice(age_bands),
                random.choice(genders),
                random.choices(risk_tiers, weights=[0.5, 0.3, 0.2])[0],
            )
        )

    cursor.executemany(
        """
        INSERT INTO dim_patient (patient_id, age_band, gender, risk_tier)
        VALUES (?, ?, ?, ?)
        """,
        rows,
    )


def build_dim_diagnosis(cursor: sqlite3.Cursor) -> None:
    rows = [
        (1, "Anxiety", "Mild"),
        (2, "Anxiety", "Moderate"),
        (3, "Depression", "Moderate"),
        (4, "Depression", "Severe"),
        (5, "PTSD", "Severe"),
        (6, "Substance Use", "Moderate"),
        (7, "Bipolar", "Severe"),
        (8, "ADHD", "Mild"),
        (9, "Adjustment", "Mild"),
        (10, "Eating Disorder", "Moderate"),
        (11, "Sleep Disorder", "Mild"),
        (12, "Grief", "Moderate"),
    ]
    cursor.executemany(
        """
        INSERT INTO dim_diagnosis (diagnosis_id, diagnosis_group, severity_band)
        VALUES (?, ?, ?)
        """,
        rows,
    )


def build_dim_payer(cursor: sqlite3.Cursor) -> None:
    rows = [
        (1, "Commercial", "Blue Horizon"),
        (2, "Medicaid", "AZ Medicaid"),
        (3, "Medicare", "Silver Shield"),
        (4, "SelfPay", "Self-Pay"),
        (5, "Commercial", "Summit Health"),
        (6, "Medicaid", "Community Care"),
    ]
    cursor.executemany(
        """
        INSERT INTO dim_payer (payer_id, payer_type, payer_name)
        VALUES (?, ?, ?)
        """,
        rows,
    )


def build_fact_encounter(cursor: sqlite3.Cursor, start: dt.date, end: dt.date) -> None:
    row_target = 80000
    visit_types = ["Intake", "FollowUp", "Crisis", "Group"]
    visit_weights = [0.2, 0.55, 0.1, 0.15]
    quality_notes = [
        "Late entry",
        "Weekend scheduling",
        "Missing consent form",
        "Manual correction",
    ]

    patient_ids = [row[0] for row in cursor.execute("SELECT patient_id FROM dim_patient").fetchall()]
    provider_rows = cursor.execute(
        "SELECT provider_id, home_facility_id FROM dim_provider"
    ).fetchall()
    provider_ids = [row[0] for row in provider_rows]
    provider_facilities = {row[0]: row[1] for row in provider_rows}
    facility_regions = {
        row[0]: row[1]
        for row in cursor.execute("SELECT facility_id, region_type FROM dim_facility").fetchall()
    }
    diagnosis_ids = [row[0] for row in cursor.execute("SELECT diagnosis_id FROM dim_diagnosis").fetchall()]
    payer_ids = [row[0] for row in cursor.execute("SELECT payer_id FROM dim_payer").fetchall()]

    max_wait_days = 30
    all_dates = date_range(start, end)
    latest_request_date = end - dt.timedelta(days=max_wait_days)
    request_dates = [date for date in all_dates if date <= latest_request_date]

    patient_provider = {}
    patient_last_noshow = {}

    rows = []
    for encounter_id in range(1, row_target + 1):
        patient_id = random.choice(patient_ids)
        if patient_id in patient_provider and random.random() < 0.7:
            provider_id = patient_provider[patient_id]
        else:
            provider_id = random.choice(provider_ids)
            patient_provider[patient_id] = provider_id

        facility_id = provider_facilities[provider_id]
        diagnosis_id = random.choice(diagnosis_ids)
        payer_id = random.choice(payer_ids)
        visit_type = random.choices(visit_types, weights=visit_weights, k=1)[0]
        request_date = random.choice(request_dates)

        base_wait = {
            "Intake": random.randint(7, 21),
            "FollowUp": random.randint(3, 14),
            "Crisis": random.randint(0, 3),
            "Group": random.randint(1, 10),
        }[visit_type]
        if facility_regions.get(facility_id) == "Rural":
            base_wait += random.randint(2, 6)
        wait_days = max(0, min(base_wait, max_wait_days))
        scheduled_date = request_date + dt.timedelta(days=wait_days)

        month = scheduled_date.month
        weekday = scheduled_date.isoweekday()
        no_show_prob = 0.12
        if month in {6, 7, 8, 12}:
            no_show_prob += 0.05
        if weekday in {1, 5}:
            no_show_prob += 0.05
        if patient_last_noshow.get(patient_id):
            no_show_prob += 0.05

        roll = random.random()
        if roll < no_show_prob:
            encounter_status = "NoShow"
        elif roll < no_show_prob + 0.08:
            encounter_status = "Cancelled"
        elif roll < no_show_prob + 0.13:
            encounter_status = "Scheduled"
        else:
            encounter_status = "Completed"

        no_show_flag = 1 if encounter_status == "NoShow" else 0
        if encounter_status == "Completed":
            completed_date = scheduled_date + dt.timedelta(days=random.randint(0, 2))
            completed_date_key = date_key(completed_date)
            outcome_score = random.randint(1, 10)
        else:
            completed_date_key = None
            outcome_score = None

        duration_minutes = {
            "Intake": random.randint(75, 120),
            "FollowUp": random.randint(45, 60),
            "Crisis": random.randint(60, 90),
            "Group": random.randint(90, 120),
        }[visit_type]

        data_quality_flag = 1 if random.random() < 0.025 else 0
        quality_note = random.choice(quality_notes) if data_quality_flag == 1 else ""

        rows.append(
            (
                encounter_id,
                patient_id,
                provider_id,
                facility_id,
                diagnosis_id,
                payer_id,
                date_key(request_date),
                date_key(scheduled_date),
                completed_date_key,
                encounter_status,
                visit_type,
                wait_days,
                duration_minutes,
                outcome_score,
                no_show_flag,
                sigma_band_value(),
                data_quality_flag,
                quality_note,
            )
        )

        patient_last_noshow[patient_id] = encounter_status == "NoShow"

    cursor.executemany(
        """
        INSERT INTO fact_encounter (
            encounter_id,
            patient_id,
            provider_id,
            facility_id,
            diagnosis_id,
            payer_id,
            request_date_key,
            scheduled_date_key,
            completed_date_key,
            encounter_status,
            visit_type,
            wait_days,
            duration_minutes,
            outcome_score,
            no_show_flag,
            sigma_band,
            data_quality_flag,
            quality_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )


def reset_tables(cursor: sqlite3.Cursor) -> None:
    cursor.execute("DELETE FROM fact_encounter")
    cursor.execute("DELETE FROM dim_provider")
    cursor.execute("DELETE FROM dim_patient")
    cursor.execute("DELETE FROM dim_diagnosis")
    cursor.execute("DELETE FROM dim_payer")
    cursor.execute("DELETE FROM dim_facility")
    cursor.execute("DELETE FROM dim_date")


def main() -> None:
    random.seed(42)

    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON;")
        cursor = connection.cursor()
        reset_tables(cursor)

        start_date = dt.date(2023, 1, 1)
        end_date = dt.date(2024, 12, 31)
        build_dim_date(cursor, start_date, end_date)
        facility_ids = build_dim_facility(cursor)
        build_dim_provider(cursor, facility_ids)
        build_dim_patient(cursor)
        build_dim_diagnosis(cursor)
        build_dim_payer(cursor)
        build_fact_encounter(cursor, start_date, end_date)

        connection.commit()


if __name__ == "__main__":
    main()
