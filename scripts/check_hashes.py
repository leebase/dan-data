import sqlite3
from pathlib import Path

db_path = Path('workspace/mental_health_demo.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT readme_sha256, architecture_sha256 FROM meta")
row = cursor.fetchone()
print(f"readme_sha256: {row[0]}")
print(f"architecture_sha256: {row[1]}")
conn.close()
