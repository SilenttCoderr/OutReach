# 🚀 OutreachPro Launch Checklist

This checklist ensures a smooth production deployment of OutreachPro.

---

## 📋 Pre-Launch Checklist

### 1. Domain & DNS Configuration

- [ ] **Register domain** (e.g., `outreachpro.io`)
- [ ] **Configure DNS records:**
  - Frontend: Point root domain or `app.` subdomain to Vercel
  - Backend: Point `api.` subdomain to Railway/Render
- [ ] **Enable HTTPS** (automatic on Vercel and Railway)
- [ ] **Verify DNS propagation** (use `dig` or `nslookup`)

### 2. Backend Deployment (Railway/Render)

- [ ] **Create PostgreSQL database**
  - Railway: Add PostgreSQL service, copy `DATABASE_URL`
  - Render: Create PostgreSQL instance, get connection string
- [ ] **Set all required environment variables:**

  | Variable | Description | Example |
  |----------|-------------|---------|
  | `PORT` | Server port (set automatically) | `8080` |
  | `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
  | `SECRET_KEY` | Session encryption key | `openssl rand -hex 32` |
  | `JWT_SECRET` | JWT signing secret | `openssl rand -hex 32` |
  | `SESSION_SECRET` | OAuth session secret | `openssl rand -hex 32` |
  | `FRONTEND_URL` | Your frontend URL | `https://outreachpro.io` |
  | `GOOGLE_CLIENT_ID` | OAuth client ID | `xxx.apps.googleusercontent.com` |
  | `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-xxx` |
  | `GEMINI_API_KEY` | Gemini API key | `AIzaSy...` |
  | `STRIPE_SECRET_KEY` | Stripe secret key (LIVE) | `sk_live_xxx` |
  | `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_xxx` |

- [ ] **Deploy backend and verify health check**
  ```bash
  curl https://api.yourdomain.com/health
  # Expected: {"status": "ok", ...}
  ```

### 3. Frontend Deployment (Vercel)

- [ ] **Connect `web/` directory to Vercel**
- [ ] **Set environment variables:**

  | Variable | Value |
  |----------|-------|
  | `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |

- [ ] **Configure build settings:**
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] **Deploy and verify frontend loads**

### 4. Google OAuth Production Setup

- [ ] **Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)**
- [ ] **Add production OAuth redirect URI:**
  ```
  https://api.yourdomain.com/api/auth/callback
  ```
- [ ] **Verify OAuth consent screen:**
  - [ ] App name and logo configured
  - [ ] Privacy policy URL added (`https://yourdomain.com/privacy`)
  - [ ] Terms of service URL added (`https://yourdomain.com/terms`)
- [ ] **If using "External" user type:**
  - [ ] Submit for verification OR
  - [ ] Add test users for initial launch
- [ ] **Enable required APIs:**
  - [ ] Gmail API
  - [ ] Google OAuth2

### 5. Stripe Production Setup

- [ ] **Switch to Live mode in [Stripe Dashboard](https://dashboard.stripe.com)**
- [ ] **Create production webhook:**
  - Endpoint URL: `https://api.yourdomain.com/api/stripe/webhook`
  - Events to listen: `checkout.session.completed`
- [ ] **Copy live keys to backend env vars:**
  - `STRIPE_SECRET_KEY` (starts with `sk_live_`)
  - `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)
- [ ] **Test a real purchase** (use a real card with small amount)
- [ ] **Verify webhook receives events** (check Stripe Dashboard → Webhooks → Logs)

### 6. CORS Configuration

- [ ] **Verify `FRONTEND_URL` matches your frontend domain exactly**
- [ ] **Test API calls from frontend** (check browser console for CORS errors)
- [ ] **If using www and non-www, ensure both are allowed**

### 7. Final Verification

- [ ] **Test complete user flow:**
  1. [ ] Visit landing page
  2. [ ] Click "Get Started" / Sign up
  3. [ ] Complete Google OAuth
  4. [ ] Land on dashboard
  5. [ ] Upload a CSV file
  6. [ ] View contacts
  7. [ ] Create email drafts
  8. [ ] Purchase credits (live Stripe)
  9. [ ] Send emails
  10. [ ] Check sent emails in Gmail

- [ ] **Verify legal pages accessible:**
  - [ ] `/privacy` - Privacy Policy
  - [ ] `/terms` - Terms of Service
  - [ ] `/docs` - Documentation

---

## 🎯 Go-to-Market Strategy

### Launch Channels

#### 1. Product Hunt Launch
- [ ] **Prepare assets:**
  - [ ] Catchy tagline (e.g., "AI-powered cold emails that actually get responses")
  - [ ] Product description (400 chars)
  - [ ] 5 high-quality screenshots/GIFs
  - [ ] Demo video (optional but recommended)
  - [ ] Maker comment prepared
- [ ] **Schedule launch** (Tuesday-Thursday, 12:01 AM PST)
- [ ] **Engage with comments** throughout launch day

#### 2. Indie Hackers
- [ ] **Create "Show IH" post:**
  - Share your journey building OutreachPro
  - Include revenue numbers if applicable
  - Ask for feedback
- [ ] **Engage in relevant discussions:**
  - Cold email threads
  - SaaS marketing threads
  - AI/automation threads

#### 3. Reddit Communities
Post in relevant subreddits (follow community rules!):
- [ ] r/SideProject
- [ ] r/startups
- [ ] r/Entrepreneur
- [ ] r/SaaS
- [ ] r/coldoutreach (if exists)
- [ ] r/sales
- [ ] r/jobsearch (for job seekers using cold email)

#### 4. X (Twitter) Launch
- [ ] **Thread announcing launch:**
  1. Hook tweet with problem statement
  2. Your solution
  3. Key features (with screenshots)
  4. Building journey (optional)
  5. CTA + link
- [ ] **Engage with AI/SaaS/productivity communities**
- [ ] **Tag relevant creators for potential retweets**

#### 5. LinkedIn
- [ ] **Post launch announcement**
- [ ] **Target:** Recruiters, Sales professionals, Job seekers
- [ ] **Join and post in relevant groups**

### SEO & Content Strategy

#### Quick Wins
- [ ] **Add meta tags** to all pages (title, description, OG image)
- [ ] **Create sitemap.xml** and submit to Google Search Console
- [ ] **Add structured data** (Organization, WebApplication schemas)

#### Content Ideas
- [ ] **Blog posts:**
  - "How to Write Cold Emails That Get Responses"
  - "AI vs. Templates: The Future of Cold Outreach"
  - "Cold Email Best Practices for 2025"
- [ ] **Landing page variations** for different use cases:
  - Job seekers
  - Sales professionals
  - Recruiters
  - Founders/Entrepreneurs

#### Keyword Targeting
- "AI cold email"
- "cold email automation"
- "personalized cold email tool"
- "Gemini email generator"
- "cold outreach platform"

### Post-Launch

- [ ] **Set up feedback mechanism:**
  - [ ] In-app feedback widget
  - [ ] Email: feedback@yourdomain.com
  - [ ] Discord/Slack community (optional)
- [ ] **Monitor:**
  - [ ] Stripe dashboard for revenue
  - [ ] Error tracking (add Sentry if not done)
  - [ ] User feedback and feature requests
- [ ] **Iterate based on feedback**

---

## 🔒 Security Checklist

- [ ] All secrets are in environment variables, not in code
- [ ] HTTPS enforced everywhere
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] CORS properly configured
- [ ] OAuth tokens stored securely (encrypted in DB)
- [ ] Stripe webhook signature verified
- [ ] No sensitive data in logs
- [ ] `.env` is in `.gitignore`

---

## 📊 Monitoring Setup (Optional but Recommended)

- [ ] **Error Tracking:** Add Sentry for backend and frontend
- [ ] **Analytics:** Add Plausible/PostHog/Google Analytics
- [ ] **Uptime Monitoring:** Better Uptime, UptimeRobot, or similar
- [ ] **Log aggregation:** Railway/Render have built-in logs

---

**🎉 Launch day! Good luck!**
