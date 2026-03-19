# Check Measures — Curtains & Blinds Measurement App

A mobile-first web app for recording window measurements on-site. Built for iPad and phone use in the field.

## Quick Start

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once your project is ready, open the **SQL Editor** and run this:

```sql
CREATE TABLE check_measures (
  id UUID PRIMARY KEY,
  lead_name TEXT,
  address TEXT,
  phone TEXT,
  measure_date DATE,
  measure_time TEXT,
  windows JSONB,
  measurements_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE check_measures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON check_measures
  FOR ALL USING (true);
```

3. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**

### 2. GitHub + Vercel Deployment

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/curtain-measure-app.git
cd curtain-measure-app

# Install dependencies
npm install

# Copy env template and fill in your Supabase keys
cp .env.example .env

# Run locally
npm run dev
```

### 3. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
3. In the Vercel project settings, go to **Settings → Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy**

> **Important:** Add the env vars in Vercel's dashboard, NOT in your code. Never commit real keys to GitHub.

### 4. Add to iPad Home Screen

Once deployed, open the Vercel URL on your iPad in Safari, tap the **Share** button → **Add to Home Screen**. The app will run fullscreen like a native app.

## Features

- **Job management** — lead name, address, phone, date/time
- **Window recording** — photo capture, 10 measurement fields per window, comments
- **Camera integration** — opens device camera directly on mobile
- **Offline-first** — all data saved locally, sync to Supabase when ready
- **iPad optimised** — large touch targets, numeric keypads, PWA support
