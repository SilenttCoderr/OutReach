import sqlite3
import pprint

conn = sqlite3.connect('cold_outreach.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT user_id, count(*) FROM contacts GROUP BY user_id")
print("Contacts per user:", [dict(r) for r in c.fetchall()])

uid = 1
c.execute("SELECT user_id FROM contacts GROUP BY user_id LIMIT 1")
r = c.fetchone()
if r: uid = r['user_id']

c.execute("SELECT * FROM users WHERE id = ?", (uid,))
user = dict(c.fetchone() or {})
print("USER:")
pprint.pprint(user)
    
c.execute("SELECT * FROM user_profiles WHERE user_id = ?", (uid,))
profile = c.fetchone()
print("PROFILE:", dict(profile) if profile else None)

c.execute("SELECT * FROM contacts WHERE user_id = ? LIMIT 1", (uid,))
contact = c.fetchone()
print("SAMPLE CONTACT:", dict(contact) if contact else None)


conn.close()