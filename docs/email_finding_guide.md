# Finding Recruiter Emails - Guide

This guide covers how to find recruiter and HR email addresses using **Apollo.io** and **Hunter.io**.

## Tool Comparison

| Feature | Apollo.io | Hunter.io |
|---------|-----------|-----------|
| **Free Credits** | Unlimited emails, 60 mobile/year | 50/month |
| **Chrome Extension** | ✅ LinkedIn integration | ✅ Domain search |
| **Email Accuracy** | ~90% | ~95% (verified) |
| **Best For** | LinkedIn prospecting | Company domain search |

---

## Apollo.io Setup

### Step 1: Create Account
1. Go to [apollo.io](https://www.apollo.io/)
2. Sign up with email (use work/university email for better limits)
3. Verify your email

### Step 2: Install Chrome Extension
1. Go to Chrome Web Store
2. Search "Apollo.io" extension
3. Click "Add to Chrome"
4. Pin the extension for easy access

### Step 3: Find Recruiters on LinkedIn

1. **Search for recruiters** on LinkedIn:
   - Use search: `"Talent Acquisition" OR "Technical Recruiter" AI ML startup`
   - Filter by: People, Location (if needed)

2. **Open a recruiter's profile**

3. **Click Apollo extension** icon
   - It will show the recruiter's email (if available)
   - Shows confidence score

4. **Save to list** or copy email

### Step 4: Bulk Search (Database)

1. Go to [app.apollo.io](https://app.apollo.io/)
2. Click **Search** → **People**
3. Apply filters:
   - **Job Titles**: Technical Recruiter, Talent Acquisition, HR Manager
   - **Company Size**: 11-50, 51-200 (startups)
   - **Industry**: Technology, Software
   - **Keywords**: AI, Machine Learning, GenAI

4. **Export to CSV** (10 exports/month free)

### Step 5: Export Format

Rename columns to match our tool:
```csv
recruiter_name,recruiter_email,company,role,company_type,notes
```

---

## Hunter.io Setup

### Step 1: Create Account
1. Go to [hunter.io](https://hunter.io/)
2. Sign up (50 free credits/month)
3. Verify email

### Step 2: Domain Search

If you know target companies:

1. Go to **Domain Search**
2. Enter company domain (e.g., `openai.com`)
3. View all available emails
4. Filter by department: **Human Resources**

### Step 3: Email Finder

If you have a name:

1. Go to **Email Finder**
2. Enter: First name, Last name, Company domain
3. Get verified email

### Step 4: Email Verification

Before sending, verify emails:
1. Go to **Email Verifier**
2. Paste email addresses
3. Uses 0.5 credits per verification
4. Remove invalid emails from your list

### Step 5: Bulk Operations

1. Create a CSV with names and companies
2. Go to **Bulk Finder**
3. Upload CSV
4. Download results

---

## Workflow: LinkedIn → CSV

### Recommended Process

1. **Day 1-2: Research**
   - List 50 target startups
   - Find them on LinkedIn

2. **Day 3-4: Collect**
   - Use Apollo extension on LinkedIn
   - Save emails to spreadsheet

3. **Day 5: Verify**
   - Run emails through Hunter.io verifier
   - Remove invalid ones

4. **Day 6+: Outreach**
   - Import CSV to this tool
   - Start with `preview` → `draft` → `send`

### Sample Target Companies (AI/ML Startups)

Search for recruiters at:
- OpenAI, Anthropic, Cohere
- Hugging Face, Stability AI
- Scale AI, Weights & Biases
- Indian startups: Mad Street Den, Haptik, Observe.AI

---

## Tips for Maximizing Free Tiers

### Apollo.io
- Use the Chrome extension (unlimited views)
- Export only verified, high-priority contacts
- Create multiple searches before exporting

### Hunter.io
- Batch your domain searches
- Verify emails in bulk (uses less credits)
- Use domain patterns to guess emails

### Email Patterns

Most companies follow patterns:
- `firstname@company.com`
- `firstname.lastname@company.com`
- `first.last@company.com`
- `flast@company.com`

Hunter.io shows the pattern for each domain!

---

## CSV Template

Save your data as:

```csv
recruiter_name,recruiter_email,company,role,company_type,notes
Sarah Johnson,sarah.j@startup.io,AI Startup Inc,AI/ML Engineer,startup,YC W24 company building LLM tools
Michael Chen,m.chen@techcorp.com,TechCorp,ML Engineer,enterprise,Fortune 500 with new AI division
```

### Required Fields
- `recruiter_name` - Full name
- `recruiter_email` - Verified email
- `company` - Company name
- `role` - Position you're applying for

### Optional Fields
- `company_type` - startup/enterprise/mid-size
- `notes` - Custom notes for personalization

---

## Alternative Free Tools

| Tool | Free Tier | Notes |
|------|-----------|-------|
| **Snov.io** | 50 credits/month | Good LinkedIn extension |
| **Lusha** | 5 credits/month | High accuracy |
| **RocketReach** | 5 lookups/month | Good for executives |
| **SignalHire** | 10 credits/month | Real-time verification |

---

## Next Steps

Once you have your CSV ready:

```bash
# Preview emails
python cli.py preview --input data/my_recruiters.csv

# Create drafts for review
python cli.py draft --input data/my_recruiters.csv
```

Good luck with your job search! 🚀
