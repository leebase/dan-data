import sqlite3
from pathlib import Path

DB_PATH = Path("../workspace/mental_health_demo.sqlite")

def verify():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check Audit Logic
    print("\n--- Audit View ---")
    cursor.execute("SELECT * FROM vw_wait_time_audit")
    columns = [description[0] for description in cursor.description]
    row = cursor.fetchone()
    print(f"Columns: {columns}")
    print(f"Row: {row}")
    
    # mismatch_count is the 2nd column (index 1) based on view def
    if row and row[1] > 0:
        print(f"SUCCESS: {row[1]} Mismatches found!")
    else:
        print("FAILURE: No mismatches found.")
        
    # Check Outliers
    # Normal max is 30. We injected 35-90.
    print("\n--- Outliers (>35 days) ---")
    cursor.execute("SELECT count(*) as count FROM fact_encounter WHERE wait_days > 35")
    row = cursor.fetchone()
    count = row[0]
    
    if count > 0:
        print(f"SUCCESS: {count} outliers found!")
    else:
        print("FAILURE: No outliers found.")

if __name__ == "__main__":
    verify()
