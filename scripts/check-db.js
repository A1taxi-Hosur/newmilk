import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Checking database...');
console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function checkDatabase() {
  try {
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');

    if (tablesError) {
      console.log('RPC not available, trying direct query...');

      // Try a simple health check query
      const { data, error } = await supabase
        .from('_realtime_schema_migrations')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Database error:', error.message);

        // The database exists but might not have our tables yet
        console.log('\nLet me try checking if any of our expected tables exist...');

        const tablesToCheck = ['suppliers', 'customers', 'delivery_partners', 'farmers'];

        for (const table of tablesToCheck) {
          const { error: checkError } = await supabase
            .from(table)
            .select('count')
            .limit(0);

          if (!checkError) {
            console.log(`✓ Table '${table}' exists`);
          } else if (checkError.message.includes('does not exist')) {
            console.log(`✗ Table '${table}' does not exist`);
          } else {
            console.log(`? Table '${table}' check error:`, checkError.message);
          }
        }
      } else {
        console.log('Database is accessible!');
      }
    } else {
      console.log('Tables:', tables);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
