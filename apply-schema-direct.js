import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n=== Applying Database Schema ===\n');
console.log('URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the complete schema
const schema = fs.readFileSync('./complete_schema.sql', 'utf-8');

console.log('Schema file loaded:', schema.length, 'characters');
console.log('\nIMPORTANT: The anon key cannot execute DDL statements.');
console.log('You need to run this SQL in the Supabase SQL Editor.\n');
console.log('Instructions:');
console.log('1. Go to: ' + supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql'));
console.log('2. Click "New Query"');
console.log('3. Copy the contents of complete_schema.sql');
console.log('4. Paste and click "Run"');
console.log('\nAlternatively, copy this command to open the SQL Editor:');
console.log('open "' + supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '/sql') + '"');
console.log('\n');

// Test basic connection
console.log('Testing connection...');
const { data, error } = await supabase.from('suppliers').select('count').limit(0);

if (error) {
  if (error.message.includes('does not exist')) {
    console.log('✓ Connection successful!');
    console.log('✗ Tables not created yet - please run SQL in Supabase SQL Editor\n');
  } else {
    console.error('Connection error:', error.message);
  }
} else {
  console.log('✓ Connection successful!');
  console.log('✓ Tables already exist!\n');
}
