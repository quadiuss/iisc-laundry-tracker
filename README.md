# IISc Laundry Tracker

Real-time washing machine availability tracker. No login system, no OTP,
no email, no SMS cost — just name + phone, remembered on your device.
Anyone can tap **Call** to ring the last person who used a machine.

## Project Structure

```
iisc-laundry-tracker/
├── public/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── supabaseClient.js    # your Supabase URL + anon key go here
│       ├── auth.js              # saves name+phone to this device
│       └── app.js               # dashboard, realtime, toggle, call link
├── netlify/functions/toggle-machine.js   # the only thing allowed to write to the DB
├── supabase/schema.sql          # one table, RLS, realtime, seed data
├── netlify.toml
├── package.json
└── README.md
```

---

## Setup (4 steps)

### 1. Create a Supabase project
- Go to supabase.com → sign up (free) → **New Project** → wait ~2 min.
- Go to **SQL Editor → New query**, paste the entire contents of
  `supabase/schema.sql`, click **Run**.
  - This script is safe to run **as many times as you want** — it wipes
    and rebuilds cleanly each time, so if anything ever gets into a weird
    state, just re-run it.
  - It creates the `machines` table, locks down writes, turns on realtime,
    and seeds 4 starter machines.

### 2. Copy your project keys into the code
- Go to **Project Settings → API**. Copy the **Project URL** and **anon public key**.
- Open `public/js/supabaseClient.js` and paste them in:
  ```js
  const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";
  ```
- Also copy the **service_role key** from the same page — keep it aside, you'll paste it into Netlify in step 4 (never put it in this file or GitHub).

### 3. Push the code to GitHub
```bash
cd iisc-laundry-tracker
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/iisc-laundry-tracker.git
git push -u origin main
```

### 4. Deploy on Netlify
- Go to app.netlify.com → **Add new site → Import an existing project** → connect your GitHub repo.
- Build settings (already set in `netlify.toml`, just confirm):
  - Build command: *(leave empty)*
  - Publish directory: `public`
  - Functions directory: `netlify/functions`
- Before deploying, go to **Site settings → Environment variables** and add:
  | Key | Value |
  |---|---|
  | `SUPABASE_URL` | your project URL |
  | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key from step 2 |
- Click **Deploy site**.

## Test it
- Open your live Netlify URL on your phone.
- Enter name + phone → you land straight on the dashboard (no code, no wait).
- Tap "Mark as In Use" → status flips instantly, "Last used by" and a
  **📞 Call [name]** button appear.
- Open the same URL on a second device → confirm it updates there too, live.

---

## Adding more machines later
Run this in Supabase SQL Editor — no code changes needed:
```sql
insert into public.machines (name, status) values ('Washing Machine 5', 'available');
```

## How it stays hard to abuse
- The browser can never write to the `machines` table directly — there's
  no insert/update policy for it in `schema.sql`. Every toggle must go
  through `toggle-machine.js`, which is the only thing holding the secret
  key that can write.
- A 3-second cooldown blocks rapid double-toggling.

## Good to know (the one real tradeoff)
There's no verification that someone typed their *real* name and number —
it's an honor system, which is normal for a small internal hostel tool
where everyone knows each other and misuse is easy to notice/call out
socially. If you ever want real verification later, the most realistic
free option is Supabase's email OTP — but it comes with the email-per-hour
limit you already ran into, so it's a genuine tradeoff, not a free upgrade.
