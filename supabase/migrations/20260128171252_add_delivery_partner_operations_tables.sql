/*
  # Delivery Partner Operations Tables
  
  ## Overview
  Creates two new tables for delivery partner operations to track milk deliveries to customers 
  and milk intake from farmers with enhanced fields for real-time tracking.
  
  ## New Tables
  
  ### 1. `delivery_partner_customer_deliveries`
  Tracks all milk deliveries made by delivery partners to customers
  - `id` (uuid, primary key) - Unique identifier
  - `delivery_partner_id` (uuid, foreign key) - References delivery_partners table
  - `customer_id` (uuid, foreign key) - References customers table
  - `supplier_id` (uuid, foreign key) - References suppliers table
  - `quantity_delivered` (numeric) - Liters of milk delivered
  - `delivery_date` (date) - Date of delivery
  - `delivery_time` (timestamptz) - Exact time of delivery
  - `status` (text) - pending, completed, cancelled, failed
  - `customer_signature` (text) - Optional signature/confirmation
  - `payment_status` (text) - unpaid, paid, pending
  - `payment_amount` (numeric) - Amount charged for this delivery
  - `notes` (text) - Optional delivery notes
  - `location_latitude` (numeric) - GPS coordinates
  - `location_longitude` (numeric) - GPS coordinates
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. `delivery_partner_milk_intake`
  Tracks milk collected from farmers by delivery partners
  - `id` (uuid, primary key) - Unique identifier
  - `delivery_partner_id` (uuid, foreign key) - References delivery_partners table
  - `farmer_id` (uuid, foreign key) - References farmers table
  - `supplier_id` (uuid, foreign key) - References suppliers table
  - `quantity_collected` (numeric) - Liters of milk collected
  - `fat_content` (numeric) - Fat percentage (0-100)
  - `snf_content` (numeric) - Solids Not Fat percentage (0-100)
  - `temperature` (numeric) - Milk temperature in Celsius
  - `quality_grade` (text) - A, B, C grade
  - `price_per_liter` (numeric) - Rate paid to farmer
  - `total_amount` (numeric) - Total payment for this collection
  - `collection_date` (date) - Date of collection
  - `collection_time` (timestamptz) - Exact time of collection
  - `status` (text) - collected, verified, rejected
  - `rejection_reason` (text) - Reason if rejected
  - `notes` (text) - Optional notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on both tables
  - Add policies for delivery partners to view and create their own records
  - Add policies for suppliers to view records for their organization
  - Add policies for customers to view their own delivery records
  - Add policies for farmers to view their own intake records
  
  ## Important Notes
  - All monetary amounts use numeric type for precision
  - GPS coordinates are optional but recommended for route tracking
  - Status fields use CHECK constraints to ensure data integrity
  - Timestamps use timestamptz for timezone support
  - Foreign key constraints ensure referential integrity
*/

-- Create delivery_partner_customer_deliveries table
CREATE TABLE IF NOT EXISTS delivery_partner_customer_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id uuid NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  quantity_delivered numeric NOT NULL CHECK (quantity_delivered > 0),
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_time timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  customer_signature text,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending')),
  payment_amount numeric DEFAULT 0 CHECK (payment_amount >= 0),
  notes text,
  location_latitude numeric,
  location_longitude numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customer_deliveries_delivery_partner ON delivery_partner_customer_deliveries(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_customer_deliveries_customer ON delivery_partner_customer_deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_deliveries_date ON delivery_partner_customer_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_customer_deliveries_status ON delivery_partner_customer_deliveries(status);

-- Create delivery_partner_milk_intake table
CREATE TABLE IF NOT EXISTS delivery_partner_milk_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id uuid NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  quantity_collected numeric NOT NULL CHECK (quantity_collected > 0),
  fat_content numeric DEFAULT 0 CHECK (fat_content >= 0 AND fat_content <= 100),
  snf_content numeric DEFAULT 0 CHECK (snf_content >= 0 AND snf_content <= 100),
  temperature numeric CHECK (temperature >= -10 AND temperature <= 50),
  quality_grade text DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  collection_date date NOT NULL DEFAULT CURRENT_DATE,
  collection_time timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'collected' CHECK (status IN ('collected', 'verified', 'rejected')),
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_milk_intake_delivery_partner ON delivery_partner_milk_intake(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_milk_intake_farmer ON delivery_partner_milk_intake(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_intake_date ON delivery_partner_milk_intake(collection_date);
CREATE INDEX IF NOT EXISTS idx_milk_intake_status ON delivery_partner_milk_intake(status);

-- Enable Row Level Security
ALTER TABLE delivery_partner_customer_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partner_milk_intake ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_partner_customer_deliveries

-- Delivery partners can view their own deliveries
CREATE POLICY "Delivery partners can view own deliveries"
  ON delivery_partner_customer_deliveries
  FOR SELECT
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Delivery partners can create their own delivery records
CREATE POLICY "Delivery partners can create own deliveries"
  ON delivery_partner_customer_deliveries
  FOR INSERT
  WITH CHECK (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Delivery partners can update their own delivery records
CREATE POLICY "Delivery partners can update own deliveries"
  ON delivery_partner_customer_deliveries
  FOR UPDATE
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Suppliers can view all deliveries in their organization
CREATE POLICY "Suppliers can view organization deliveries"
  ON delivery_partner_customer_deliveries
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Customers can view their own deliveries
CREATE POLICY "Customers can view own deliveries"
  ON delivery_partner_customer_deliveries
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- RLS Policies for delivery_partner_milk_intake

-- Delivery partners can view their own milk intake records
CREATE POLICY "Delivery partners can view own milk intake"
  ON delivery_partner_milk_intake
  FOR SELECT
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Delivery partners can create their own milk intake records
CREATE POLICY "Delivery partners can create own milk intake"
  ON delivery_partner_milk_intake
  FOR INSERT
  WITH CHECK (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Delivery partners can update their own milk intake records
CREATE POLICY "Delivery partners can update own milk intake"
  ON delivery_partner_milk_intake
  FOR UPDATE
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Suppliers can view all milk intake in their organization
CREATE POLICY "Suppliers can view organization milk intake"
  ON delivery_partner_milk_intake
  FOR SELECT
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Farmers can view their own milk intake records
CREATE POLICY "Farmers can view own milk intake"
  ON delivery_partner_milk_intake
  FOR SELECT
  USING (
    farmer_id IN (
      SELECT id FROM farmers WHERE user_id = current_setting('app.current_user_id', true)
    )
  );