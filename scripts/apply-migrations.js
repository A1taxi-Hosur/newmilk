import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  try {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      console.log(`\nApplying migration: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

      if (error) {
        console.error(`Error applying ${file}:`, error);
      } else {
        console.log(`Successfully applied ${file}`);
      }
    }

    console.log('\nAll migrations applied!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

applyMigrations();
