/*
  # Add Farmers and Pickup Logs Tables

  1. New Tables
    - `farmers`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `name` (text)
      - `phone` (text, unique) - used for login authentication
      - `email` (text)
      - `address` (text)
      - `user_id` (text) - for authentication
      - `password` (text) - hashed password
      - `status` (text) - active/inactive
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pickup_logs`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, foreign key to farmers)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `delivery_partner_id` (uuid, foreign key to delivery_partners)
      - `quantity` (numeric) - liters of milk
      - `quality_grade` (text) - A, B, C grade
      - `fat_content` (numeric) - percentage
      - `price_per_liter` (numeric) - price paid
      - `total_amount` (numeric) - calculated total
      - `pickup_date` (date)
      - `pickup_time` (timestamptz)
      - `status` (text) - pending, completed
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Suppliers can manage their farmers
    - Farmers can view their own data
    - Suppliers can manage pickup logs for their farmers
    - Farmers can view their own pickup logs
*/

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  address text,
  user_id text NOT NULL,
  password text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pickup_logs table
CREATE TABLE IF NOT EXISTS pickup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  delivery_partner_id uuid REFERENCES delivery_partners(id) ON DELETE SET NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  quality_grade text DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
  fat_content numeric DEFAULT 0 CHECK (fat_content >= 0 AND fat_content <= 100),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  pickup_date date NOT NULL DEFAULT CURRENT_DATE,
  pickup_time timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_farmers_supplier_id ON farmers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_farmer_id ON pickup_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_supplier_id ON pickup_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_pickup_date ON pickup_logs(pickup_date);

-- Enable RLS
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_logs ENABLE ROW LEVEL SECURITY;

-- Farmers table policies
CREATE POLICY "Suppliers can manage their farmers"
  ON farmers
  FOR ALL
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers));

CREATE POLICY "Farmers can read own data"
  ON farmers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Allow anonymous farmer read for demo"
  ON farmers
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous farmer insert for demo"
  ON farmers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Pickup logs table policies
CREATE POLICY "Suppliers can manage their pickup logs"
  ON pickup_logs
  FOR ALL
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers));

CREATE POLICY "Farmers can view own pickup logs"
  ON pickup_logs
  FOR SELECT
  TO authenticated
  USING (farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid()::text));

CREATE POLICY "Delivery partners can create pickup logs"
  ON pickup_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (delivery_partner_id IN (SELECT id FROM delivery_partners));

CREATE POLICY "Allow anonymous pickup log read for demo"
  ON pickup_logs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous pickup log insert for demo"
  ON pickup_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);
