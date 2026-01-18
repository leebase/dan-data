import sqlite3
from pathlib import Path

db_path = Path('workspace/mental_health_demo.sqlite')

if not db_path.exists():
    print(f"Database not found at {db_path}")
    exit(0)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # List Views
    print("\nViews:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='view';")
    views = cursor.fetchall()
    if not views:
        print("  (No views found)")
    else:
        for view in views:
            print(f"- {view[0]}")

    # Check Meta
    print("\nMeta Table Content:")
    try:
        cursor.execute("SELECT * FROM meta")
        columns = [description[0] for description in cursor.description]
        row = cursor.fetchone()
        if row:
            for col, val in zip(columns, row):
                print(f"  {col}: {val}")
        else:
            print("  (Empty)")
    except sqlite3.OperationalError:
        print("  (meta table likely missing or empty)")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
