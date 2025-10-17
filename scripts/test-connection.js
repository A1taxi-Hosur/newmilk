import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to query the database
    const { data, error } = await supabase
      .from('suppliers')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Connection error:', error.message);
      console.error('Details:', error);

      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\nThe database exists but tables are not created yet.');
        console.log('This is normal for a new database. Migrations need to be applied.');
      }
    } else {
      console.log('SUCCESS: Connected to Supabase database!');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
