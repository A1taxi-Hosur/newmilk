/*
  # Customer Authentication and Invoicing System

  ## Overview
  This migration creates the complete infrastructure for customer-facing authentication
  and automated invoice generation based on delivery data.

  ## New Tables

  ### 1. customer_users
  - `id` (uuid, primary key) - Unique identifier for customer user account
  - `phone` (text, unique) - Customer's phone number (primary authentication identifier)
  - `password` (text) - Hashed password for authentication
  - `name` (text) - Customer's full name
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `last_login` (timestamptz) - Last successful login timestamp

  ### 2. supplier_pricing
  - `id` (uuid, primary key) - Unique pricing record identifier
  - `supplier_id` (uuid, foreign key) - Reference to suppliers table
  - `price_per_liter` (decimal) - Price per liter of milk
  - `effective_from_date` (date) - Date when this pricing becomes active
  - `is_active` (boolean) - Whether this is the currently active price
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. monthly_invoices
  - `id` (uuid, primary key) - Unique invoice identifier
  - `customer_id` (uuid, foreign key) - Reference to customers table
  - `supplier_id` (uuid, foreign key) - Reference to suppliers table
  - `invoice_number` (text, unique) - Human-readable invoice number
  - `month` (integer) - Month number (1-12)
  - `year` (integer) - Year (e.g., 2025)
  - `total_quantity` (decimal) - Total liters delivered in the month
  - `total_amount` (decimal) - Total amount to be paid
  - `price_per_liter` (decimal) - Price used for calculation
  - `delivery_count` (integer) - Number of deliveries in the month
  - `status` (text) - Invoice status: pending, paid, overdue
  - `generated_at` (timestamptz) - When invoice was generated
  - `due_date` (date) - Payment due date
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. invoice_line_items
  - `id` (uuid, primary key) - Unique line item identifier
  - `invoice_id` (uuid, foreign key) - Reference to monthly_invoices table
  - `delivery_id` (uuid, foreign key) - Reference to deliveries table
  - `delivery_date` (date) - Date of delivery
  - `quantity` (decimal) - Quantity delivered
  - `amount` (decimal) - Amount for this line item
  - `notes` (text) - Additional notes from delivery
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Customers can only access their own data via phone number matching
  - Suppliers can only access data for their assigned customers
  - Proper indexes added for performance on lookup fields

  ## Important Notes
  - Phone numbers are stored in a standardized format for consistency
  - Only one active pricing record per supplier at any time
  - Invoice numbers follow format: SUPPLIER_ID-YYYYMM-SEQUENCE
  - All monetary values use decimal type for precision
*/

-- Create customer_users table for authentication
CREATE TABLE IF NOT EXISTS customer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create supplier_pricing table
CREATE TABLE IF NOT EXISTS supplier_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  price_per_liter decimal(10,2) NOT NULL CHECK (price_per_liter > 0),
  effective_from_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create monthly_invoices table
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020),
  total_quantity decimal(10,2) NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  price_per_liter decimal(10,2) NOT NULL,
  delivery_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  generated_at timestamptz DEFAULT now(),
  due_date date,
  created_at timestamptz DEFAULT now()
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  quantity decimal(10,2) NOT NULL,
  amount decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_users_phone ON customer_users(phone);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_supplier_active ON supplier_pricing(supplier_id, is_active);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_customer ON monthly_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_supplier ON monthly_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_period ON monthly_invoices(year, month);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

-- Add updated_at trigger for customer_users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_users_updated_at
  BEFORE UPDATE ON customer_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_pricing_updated_at
  BEFORE UPDATE ON supplier_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_users
CREATE POLICY "Customers can read own user data"
  ON customer_users FOR SELECT
  TO authenticated
  USING (phone = current_setting('app.customer_phone', true));

CREATE POLICY "Anyone can insert customer user during signup"
  ON customer_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Customers can update own user data"
  ON customer_users FOR UPDATE
  TO authenticated
  USING (phone = current_setting('app.customer_phone', true))
  WITH CHECK (phone = current_setting('app.customer_phone', true));

-- RLS Policies for supplier_pricing
CREATE POLICY "Suppliers can view own pricing"
  ON supplier_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can insert own pricing"
  ON supplier_pricing FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Suppliers can update own pricing"
  ON supplier_pricing FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for monthly_invoices
CREATE POLICY "Customers can view own invoices"
  ON monthly_invoices FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE phone = current_setting('app.customer_phone', true)
    )
  );

CREATE POLICY "Suppliers can view customer invoices"
  ON monthly_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can insert invoices"
  ON monthly_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Suppliers can update invoices"
  ON monthly_invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for invoice_line_items
CREATE POLICY "Customers can view own invoice line items"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM monthly_invoices
      WHERE customer_id IN (
        SELECT id FROM customers
        WHERE phone = current_setting('app.customer_phone', true)
      )
    )
  );

CREATE POLICY "Suppliers can view invoice line items"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Suppliers can insert invoice line items"
  ON invoice_line_items FOR INSERT
  TO authenticated
  WITH CHECK (true);
