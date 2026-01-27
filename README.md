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
The `web/` directory is ready for Vercel.
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Env**: Set `NEXT_PUBLIC_API_URL` to your backend URL.

### Backend (Render/Railway)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Database**: Switch `DATABASE_URL` to PostgreSQL.

---

## 📄 Documentation

Full documentation available at `/docs` when running the application.

- **Getting Started**: Setup and first campaign.
- **CSV Format**: Required columns for contact import.
- **API Reference**: Backend endpoints.

---

## 📜 License

MIT License. Built for the Cold Outreach community.
