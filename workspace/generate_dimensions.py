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

        build_dim_date(cursor, dt.date(2023, 1, 1), dt.date(2024, 12, 31))
        facility_ids = build_dim_facility(cursor)
        build_dim_provider(cursor, facility_ids)
        build_dim_patient(cursor)
        build_dim_diagnosis(cursor)
        build_dim_payer(cursor)

        connection.commit()


if __name__ == "__main__":
    main()
