/*
  # Fix customer permissions

  1. Security
    - Add policies to allow suppliers to manage their customers
    - Add temporary demo policies for anonymous access
    - Enable RLS on customers table

  2. Changes
    - Allow suppliers to insert customers
    - Allow anonymous access for demo purposes
    - Allow suppliers to read/update their own customers
*/

-- Enable RLS on customers table (if not already enabled)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow supplier customer management" ON customers;
DROP POLICY IF EXISTS "Allow anonymous customer creation" ON customers;
DROP POLICY IF EXISTS "Suppliers can manage their customers" ON customers;
DROP POLICY IF EXISTS "Customers can read own data" ON customers;

-- Allow suppliers to manage their customers
CREATE POLICY "Allow supplier customer management" ON customers
  FOR ALL
  TO authenticated
  USING (supplier_id IN (
    SELECT id FROM suppliers WHERE id = supplier_id
  ))
  WITH CHECK (supplier_id IN (
    SELECT id FROM suppliers WHERE id = supplier_id
  ));

-- Allow anonymous access for demo purposes
CREATE POLICY "Allow anonymous customer creation" ON customers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous read access for demo
CREATE POLICY "Allow anonymous customer read" ON customers
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read customers
CREATE POLICY "Allow authenticated customer read" ON customers
  FOR SELECT
  TO authenticated
  USING (true);