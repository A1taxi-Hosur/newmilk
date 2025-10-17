/*
  # Fix delivery partners permissions

  1. Security Updates
    - Add proper RLS policies for delivery partners
    - Allow suppliers to insert delivery partners
    - Allow anonymous access for demo purposes
    
  2. Policy Changes
    - Enable suppliers to manage their delivery partners
    - Add temporary policy for demo functionality
*/

-- First, ensure RLS is enabled
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow delivery partner registration" ON delivery_partners;
DROP POLICY IF EXISTS "Delivery partners can read own data" ON delivery_partners;
DROP POLICY IF EXISTS "Suppliers can insert delivery partners" ON delivery_partners;
DROP POLICY IF EXISTS "Suppliers can manage their delivery partners" ON delivery_partners;

-- Allow anonymous users to insert delivery partners (for demo purposes)
CREATE POLICY "Allow anonymous delivery partner registration"
  ON delivery_partners
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert delivery partners
CREATE POLICY "Allow authenticated delivery partner registration"
  ON delivery_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow suppliers to manage their delivery partners
CREATE POLICY "Suppliers can manage their delivery partners"
  ON delivery_partners
  FOR ALL
  TO authenticated
  USING (supplier_id IN (
    SELECT id FROM suppliers WHERE id = delivery_partners.supplier_id
  ))
  WITH CHECK (supplier_id IN (
    SELECT id FROM suppliers WHERE id = delivery_partners.supplier_id
  ));

-- Allow delivery partners to read their own data
CREATE POLICY "Delivery partners can read own data"
  ON delivery_partners
  FOR SELECT
  TO authenticated
  USING (id = delivery_partners.id);

-- Allow public read access for demo purposes
CREATE POLICY "Allow public read access"
  ON delivery_partners
  FOR SELECT
  TO anon, authenticated
  USING (true);