# OutreachPro Onboarding Guide

This guide is the fastest path from fresh clone to a working local setup.

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- A Google Cloud OAuth app (for Google login and Gmail features)

Quick version checks:

PowerShell:
python --version
node --version
npm.cmd --version

## 2. Clone And Open Project

PowerShell:
git clone <your-repo-url>
cd OutReach

## 3. Backend Setup (FastAPI)

### 3.1 Create virtual environment

PowerShell:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

### 3.2 Install Python dependencies

PowerShell:
python -m pip install --upgrade pip
pip install -r requirements.txt

### 3.3 Create env file

PowerShell:
Copy-Item .env.example .env

Edit .env and set at least:

- FRONTEND_URL=http://localhost:3000
- SECRET_KEY=<random value>
- JWT_SECRET=<random value>
- SESSION_SECRET=<random value>
- GOOGLE_CLIENT_ID=<google oauth client id>
- GOOGLE_CLIENT_SECRET=<google oauth secret>
- GEMINI_API_KEY=<gemini key>
- STRIPE_SECRET_KEY=<stripe key for local testing>
- STRIPE_WEBHOOK_SECRET=<stripe webhook secret for local testing>

If you need quick random secrets:

PowerShell:
python -c "import secrets; print(secrets.token_hex(32))"

Run it three times and place values in SECRET_KEY, JWT_SECRET, and SESSION_SECRET.

### 3.4 Start backend

PowerShell:
python app.py

Backend should be available at:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs

## 4. Frontend Setup (Next.js)

Open a second terminal.

PowerShell:
cd web
npm.cmd install

Create web/.env.local with:

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

Start frontend:

PowerShell:
npm.cmd run dev

Frontend should be available at:

- http://localhost:3000

Note for Windows PowerShell policy:
If npm fails with execution policy errors, use npm.cmd as shown above.

## 5. First Login Test

1. Open http://localhost:3000/signup
2. Create account with email/password
3. After signup, you should be redirected to /dashboard
4. Log out and log in again from /login

Google login flow:

1. Set Google OAuth redirect URI to:
   http://127.0.0.1:8000/api/auth/callback
2. Click Continue with Google on login/signup pages
3. You should return to /auth/callback and then /dashboard

## 6. Daily Dev Commands

Backend terminal:

PowerShell:
.\.venv\Scripts\Activate.ps1
python app.py

Frontend terminal:

PowerShell:
cd web
npm.cmd run dev

## 7. Optional Useful Commands

Run API tests:

PowerShell:
pip install pytest
pytest tests/test_api.py -v

Run database migration helper scripts (legacy-safe):

PowerShell:
python migrate_db.py
python scripts/migrate_db.py

## 8. Common Issues

### Login fails or redirects back to login

- Confirm web/.env.local has NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
- Confirm backend is running on port 8000
- Clear browser local storage and retry

### Gmail draft creation returns auth error

- Google OAuth may not be connected for that user
- Re-login with Google to refresh tokens

### Frontend cannot call API

- Check backend /health endpoint
- Verify FRONTEND_URL in .env is http://localhost:3000
- Restart both backend and frontend after env changes

## 9. Recommended Startup Order

1. Start backend first (python app.py)
2. Start frontend second (npm.cmd run dev)
3. Open /signup and test auth
4. Upload CSV in dashboard contacts
5. Generate drafts in dashboard campaigns
