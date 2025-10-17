# Quick Start: Database Setup

## You Need to Complete These 3 Steps:

### 1️⃣  Create Supabase Project (5 minutes)

1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Set name: `milk-supply-chain`
4. Choose a strong database password
5. Select your region
6. Click **"Create new project"**
7. Wait for provisioning to complete

### 2️⃣  Get Your Credentials

In your new Supabase project:

1. Go to **Settings** → **API**
2. Copy **"Project URL"** (looks like: `https://abc123xyz.supabase.co`)
3. Copy **"anon/public key"** (long string starting with `eyJ...`)

### 3️⃣  Update & Apply Database

**Update `.env` file:**
```env
VITE_SUPABASE_URL=YOUR_PROJECT_URL_HERE
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**Apply Database Schema:**

Go to your Supabase project dashboard:
1. Click **"SQL Editor"** in the sidebar
2. Click **"New Query"**
3. Open the file: `complete_schema.sql`
4. Copy ALL its contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)

**That's it!** All 18 tables will be created with proper security policies.

## Verify Setup

Run this to test:
```bash
node setup-database.js
```

You should see all tables marked with ✓

## Tables Created:

✅ admins, suppliers, customers, delivery_partners, farmers
✅ deliveries, pickup_logs, daily_allocations
✅ products, customer_orders, order_items
✅ monthly_invoices, invoice_line_items, pricing_tiers
✅ supplier_updates, routes, temporary_deliveries
✅ customer_assignments

## Start Application

```bash
npm run dev
```

## Default Admin Login

After setup, you can log in as admin with:
- **Email**: admin@milksupply.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change this password immediately in production!

## Need More Details?

See `DATABASE_SETUP_GUIDE.md` for comprehensive documentation.

## Troubleshooting

**"fetch failed" error?**
→ Update `.env` with correct Supabase credentials

**"relation does not exist" error?**
→ Run the SQL in Supabase SQL Editor

**Tables not showing?**
→ Check you ran ALL of `complete_schema.sql`

---

🎉 Once setup is complete, your milk supply chain management system will be fully operational!
