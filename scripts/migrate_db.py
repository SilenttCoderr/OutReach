import sqlite3
import os

DB_FILE = "cold_outreach.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found. Skipping migration.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    
    new_columns = {
        "access_token": "TEXT",
        "refresh_token": "TEXT",
        "token_expiry": "TIMESTAMP"
    }
    
    for col, dtype in new_columns.items():
        if col not in columns:
            print(f"Adding column {col} to users...")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {dtype}")
                print(f"Added {col}.")
            except Exception as e:
                print(f"Error adding {col}: {e}")
        else:
            print(f"Column {col} already exists in users.")

    # Check email_logs table
    cursor.execute("PRAGMA table_info(email_logs)")
    log_columns = [info[1] for info in cursor.fetchall()]
    
    if "gmail_draft_id" not in log_columns:
        print("Adding column gmail_draft_id to email_logs...")
        try:
            cursor.execute("ALTER TABLE email_logs ADD COLUMN gmail_draft_id VARCHAR(255)")
            print("Added gmail_draft_id.")
        except Exception as e:
            print(f"Error adding gmail_draft_id: {e}")
    else:
        print("Column gmail_draft_id already exists in email_logs.")
            
    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
