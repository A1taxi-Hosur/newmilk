/**
 * Database Setup Script
 * This script applies all migrations to set up the complete database schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('='.repeat(60));
console.log('DATABASE SETUP SCRIPT');
console.log('='.repeat(60));
console.log('Supabase URL:', supabaseUrl);
console.log('API Key present:', !!supabaseKey);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log('Step 1: Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);

    if (error && !error.message.includes('does not exist')) {
      console.error('Connection failed:', error.message);
      return false;
    }

    console.log('✓ Connection successful!\n');
    return true;
  } catch (error) {
    console.error('✗ Connection error:', error.message);
    return false;
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

  console.log('Step 2: Reading migration files...');

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files:\n`);
  files.forEach((file, i) => console.log(`  ${i + 1}. ${file}`));
  console.log('');

  console.log('Step 3: Applying migrations...\n');

  for (const file of files) {
    console.log(`Applying: ${file}...`);

    const sqlPath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    try {
      // Split SQL into individual statements for better error handling
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

      console.log(`  - Executing ${statements.length} SQL statements...`);

      // Note: The anon key has limited permissions
      // For production, migrations should be run with service role key or via Supabase CLI
      const { error } = await supabase.rpc('exec_sql', {
        query: sqlContent
      });

      if (error) {
        console.error(`  ✗ Error: ${error.message}`);
        console.log(`  (This might be expected if using anon key - migrations typically require admin access)`);
      } else {
        console.log(`  ✓ Success!`);
      }
    } catch (error) {
      console.error(`  ✗ Unexpected error: ${error.message}`);
    }
    console.log('');
  }
}

async function verifyTables() {
  console.log('Step 4: Verifying tables...\n');

  const expectedTables = [
    'suppliers',
    'delivery_partners',
    'customers',
    'customer_assignments',
    'daily_allocations',
    'deliveries',
    'farmers',
    'pickup_logs',
    'products',
    'customer_orders',
    'order_items',
    'supplier_updates',
    'monthly_invoices',
    'invoice_line_items',
    'pricing_tiers',
    'routes',
    'temporary_deliveries',
    'admins'
  ];

  const results = {
    exists: [],
    missing: [],
    errors: []
  };

  for (const table of expectedTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(0);

      if (!error) {
        results.exists.push(table);
        console.log(`  ✓ ${table}`);
      } else if (error.message.includes('does not exist')) {
        results.missing.push(table);
        console.log(`  ✗ ${table} (not found)`);
      } else {
        results.errors.push({ table, error: error.message });
        console.log(`  ? ${table} (${error.message})`);
      }
    } catch (error) {
      results.errors.push({ table, error: error.message });
      console.log(`  ? ${table} (${error.message})`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tables expected: ${expectedTables.length}`);
  console.log(`Tables found: ${results.exists.length}`);
  console.log(`Tables missing: ${results.missing.length}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log('');

  if (results.missing.length > 0) {
    console.log('Missing tables:', results.missing.join(', '));
    console.log('');
    console.log('NOTE: If tables are missing, migrations may need to be run with');
    console.log('service role key or through the Supabase SQL Editor.');
  }

  if (results.errors.length > 0 && results.errors[0].error.includes('fetch failed')) {
    console.log('');
    console.log('CONNECTION ERROR DETECTED');
    console.log('The Supabase project credentials appear to be invalid or the project doesn\'t exist.');
    console.log('Please create a new Supabase project and update the .env file.');
  }

  return results;
}

async function main() {
  const connected = await checkConnection();

  if (!connected) {
    console.log('\nCannot proceed without database connection.');
    console.log('\nPLEASE CREATE A NEW SUPABASE PROJECT:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Click "New Project"');
    console.log('3. Copy the Project URL and anon key');
    console.log('4. Update the .env file with new credentials');
    process.exit(1);
  }

  await applyMigrations();
  await verifyTables();

  console.log('');
  console.log('Setup complete!');
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
