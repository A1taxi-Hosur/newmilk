# Database Setup Guide for Milk Supply Chain Management

## Current Status

The application requires a Supabase database to store all data for:
- **Suppliers** (milk suppliers/dairies)
- **Customers** (people receiving milk deliveries)
- **Delivery Partners** (delivery personnel)
- **Farmers** (milk producers)
- **Admins** (system administrators)
- Related data like orders, invoices, deliveries, products, etc.

## Problem

The current `.env` file contains credentials for a Supabase project that doesn't exist:
```
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

This project is either deleted or was never created.

## Solution: Create a New Supabase Project

### Step 1: Create Supabase Account & Project

1. Go to https://supabase.com/dashboard
2. Sign in or create an account
3. Click **"New Project"** button
4. Fill in the details:
   - **Name**: `milk-supply-chain` (or any name you prefer)
   - **Database Password**: Choose a strong password (SAVE THIS!)
   - **Region**: Select the closest region to your location
   - **Pricing Plan**: Start with Free tier
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. Find and copy these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`, very long string)

###Step 3: Update the .env File

Replace the values in `/tmp/cc-agent/58169354/project/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### Step 4: Apply Database Migrations

Once you've updated the `.env` file with valid credentials, run:

```bash
node setup-database.js
```

This script will:
1. Test the database connection
2. Apply all migration files from `supabase/migrations/`
3. Verify that all tables were created successfully

**Note**: The anon key has limited permissions. To apply migrations, you'll need to either:

**Option A**: Use the Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Copy and paste each migration file from `supabase/migrations/` directory
4. Execute them one by one in order (by filename)

**Option B**: Use the service role key (Use with caution!)
1. Get the `service_role` key from Settings → API
2. Create a temporary script with service role access
3. Run migrations (never expose service role key in frontend!)

## Database Schema Overview

After setup, your database will have these tables:

### Core User Tables
- `admins` - System administrators
- `suppliers` - Milk suppliers/dairies
- `customers` - End customers receiving deliveries
- `delivery_partners` - Delivery personnel
- `farmers` - Milk producers

### Transaction Tables
- `deliveries` - Customer milk deliveries
- `pickup_logs` - Farmer milk pickups
- `daily_allocations` - Daily milk allocations to delivery partners
- `customer_assignments` - Customer-to-delivery-partner mappings

### E-commerce Tables
- `products` - Products offered by suppliers
- `customer_orders` - Customer orders
- `order_items` - Line items in orders

### Billing Tables
- `monthly_invoices` - Customer invoices
- `invoice_line_items` - Detailed invoice items
- `pricing_tiers` - Supplier pricing configuration

### Additional Tables
- `supplier_updates` - News/announcements from suppliers
- `routes` - Delivery route management
- `temporary_deliveries` - One-time delivery requests

## Security

All tables have:
- ✅ **Row Level Security (RLS)** enabled
- ✅ **Authentication-based access control**
- ✅ **Restrictive policies** (users can only access their own data)
- ✅ **Foreign key constraints** for data integrity
- ✅ **Indexes** for optimal query performance

## Test the Connection

After setting up, test the connection:

```bash
node scripts/test-connection.js
```

Or start the application:

```bash
npm run dev
```

## Troubleshooting

### "fetch failed" error
- The Supabase project URL is wrong or the project doesn't exist
- Check your internet connection
- Verify the URL in `.env` matches your Supabase dashboard

### "relation does not exist" error
- Tables haven't been created yet
- Run migrations using Supabase SQL Editor

### "permission denied" error
- RLS policies are working correctly
- You need to authenticate first before accessing data

## Need Help?

If you encounter issues:
1. Check the Supabase project is active in your dashboard
2. Verify the URL and API key are correct
3. Make sure you've run all migrations
4. Check the browser console for detailed error messages

## Prepared Migrations

All migrations are ready in the `supabase/migrations/` folder:
1. `20250812100216_restless_moon.sql` - Base schema (suppliers, customers, delivery partners, deliveries)
2. `20250812103751_shiny_cherry.sql` - Additional fields
3. `20250812171152_peaceful_unit.sql` - More enhancements
4. `20250812171753_shrill_island.sql` - Additional features
5. `20250812172213_dark_garden.sql` - Extended functionality
6. `20250812180000_add_farmers_pickup_logs.sql` - Farmers and pickup system
7. `20251011100000_add_customer_authentication_and_invoicing.sql` - Customer auth and billing
8. `20251011120000_add_products_orders_updates_tables.sql` - E-commerce features
9. `20251011150000_complete_database_schema.sql` - Complete schema with all tables

These migrations are idempotent (safe to run multiple times) and include comprehensive security policies.
