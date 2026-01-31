# 🚀 OutreachPro - AI Cold Email Platform

OutreachPro is an intelligent cold email automation platform that uses **Gemini 2.5 Flash** to generate hyper-personalized emails at scale. It features a modern high-contrast UI, Gmail OAuth2 integration, and a credit-based payment system suitable for SaaS deployment.

![Dashboard Preview](https://placehold.co/1200x630/18181b/fafafa?text=OutreachPro+Dashboard)

## ✨ Features

- **AI Personalization**: Uses Google's Gemini to craft unique emails based on recipient role and company.
- **Bulk Sending**: Queue and send hundreds of emails via Gmail API.
- **Smart Context**: Parses uploaded resumes/context to maintain relevance.
- **Credit System**: Pay-as-you-go credit packs integrated with Stripe.
- **Modern UI**: Dark-mode first, accessible, and responsive design.
- **Analytics**: Track sent, drafted, and failed emails in real-time.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (Custom Design System)
- **Icons**: Lucide React
- **Payments**: Stripe Elements

### Backend
- **API**: FastAPI (Python)
- **Database**: SQLite (Dev) / PostgreSQL (Prod)
- **Auth**: Google OAuth2 + JWT
- **AI**: Google Generative AI (Gemini)
- **Email**: Gmail API

---

## ⚡ Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google Cloud Console Project (with Gmail API enabled)
- Stripe Account (for payments)

### 1. Clone & Setup Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run database migrations (auto-created on start)
python app.py
```

### 2. Setup Frontend

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Environment Variables (.env)

```env
# App
SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:3000

# Google Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI
GEMINI_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

---

## 🚀 Deployment

### Frontend (Vercel)

The `web/` directory is ready for Vercel deployment.

1. **Connect to Vercel**: Link your repository and select the `web/` directory
2. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. **Environment Variables**:
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Your backend URL (e.g., `https://api.outreachpro.io`) |

### Backend (Railway — Recommended)

1. **Create a new Railway project** and connect your GitHub repository
2. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
3. **Copy `DATABASE_URL`** from the PostgreSQL service to your app's environment
4. **Set all required environment variables**:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `PORT` | ✅ Auto-set | Railway sets this automatically |
   | `DATABASE_URL` | ✅ | PostgreSQL connection string |
   | `SECRET_KEY` | ✅ | Session encryption (run `openssl rand -hex 32`) |
   | `JWT_SECRET` | ✅ | JWT signing key (run `openssl rand -hex 32`) |
   | `SESSION_SECRET` | ✅ | OAuth session key (run `openssl rand -hex 32`) |
   | `FRONTEND_URL` | ✅ | Your frontend URL (e.g., `https://outreachpro.io`) |
   | `GOOGLE_CLIENT_ID` | ✅ | OAuth Client ID from Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | ✅ | OAuth Client Secret |
   | `GEMINI_API_KEY` | ✅ | API key from [AI Studio](https://aistudio.google.com/apikey) |
   | `STRIPE_SECRET_KEY` | ✅ | Stripe Secret Key (use `sk_live_` for production) |
   | `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe Webhook signing secret |

5. **Deploy**: Railway auto-deploys on push. Verify with:
   ```bash
   curl https://your-railway-app.up.railway.app/health
   ```

### Backend (Render — Alternative)

1. Create a new **Web Service** on Render
2. Connect your repository and set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
3. Add a **PostgreSQL** database and link it
4. Set all environment variables (same as Railway table above)

### Stripe Webhook Setup (Production)

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Set **Endpoint URL**: `https://api.yourdomain.com/api/stripe/webhook`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`

### Google OAuth Setup (Production)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URI**: `https://api.yourdomain.com/api/auth/callback`
4. Update **OAuth consent screen**:
   - Add Privacy Policy URL: `https://yourdomain.com/privacy`
   - Add Terms of Service URL: `https://yourdomain.com/terms`
5. If using "External" user type, submit for verification or add test users

### Rate Limiting

Per-IP rate limits are enabled on sensitive endpoints:
- `/api/draft`: 20 requests/minute
- `/api/send/{id}`: 20 requests/minute
- `/api/send-all`: 20 requests/minute

### Health Check

Verify your backend is running:
```bash
curl https://api.yourdomain.com/health
# Expected: {"status":"ok","database":"connected","timestamp":"..."}
```

---

## 📄 Documentation

Full documentation available at `/docs` when running the application.

- **Getting Started**: Setup and first campaign.
- **CSV Format**: Required columns for contact import.
- **API Reference**: Backend endpoints.

---

## 📜 License

MIT License. Built for the Cold Outreach community.
