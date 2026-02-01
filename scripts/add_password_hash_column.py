"""
One-off migration: add password_hash column to users table.

Run once against production PostgreSQL (Render) after T13 added User.password_hash
to the model. create_all() does not add columns to existing tables.

Usage (from project root):
  # With .env containing DATABASE_URL:
  python scripts/add_password_hash_column.py

  # Or pass DATABASE_URL explicitly (e.g. production):
  DATABASE_URL="postgresql://user:pass@host:5432/dbname" python scripts/add_password_hash_column.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cold_outreach.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def main():
    from sqlalchemy import create_engine, text

    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    )

    # PostgreSQL: ADD COLUMN IF NOT EXISTS. SQLite 3.35+: same.
    sql = "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)"

    try:
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
        print("Done. Column users.password_hash added (or already existed).")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("Column users.password_hash already exists. Nothing to do.")
            return
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
