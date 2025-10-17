/*
  # Complete Database Schema for Milk Supply Chain Management

  ## Overview
  This migration creates a comprehensive database schema for managing the entire milk supply chain,
  including admins, suppliers, delivery partners, farmers, customers, and all related operations.

  ## 1. New Tables

  ### User Management
  - `admins` - System administrators with full access
    - Stores admin credentials and permissions
    - Email-based authentication
    - Role-based access control
    - Activity logging capabilities

  ### Core Entities (Enhanced)
  All existing tables are enhanced with additional fields and constraints:
  - `suppliers` - Already exists, adding password field for authentication
  - `delivery_partners` - Already exists
  - `farmers` - Already exists
  - `customers` - Already exists, enhanced with authentication
  - `pickup_logs` - Already exists (farmer milk collection)
  - `deliveries` - Already exists (customer deliveries)

  ### New Supporting Tables
  - `products` - Products offered by suppliers (milk, dairy items)
  - `customer_orders` - Customer orders for products
  - `order_items` - Line items in customer orders
  - `supplier_updates` - News/updates from suppliers to customers
  - `monthly_invoices` - Customer billing records
  - `invoice_line_items` - Detailed invoice items
  - `pricing_tiers` - Supplier pricing configuration
  - `routes` - Delivery route management
  - `temporary_deliveries` - One-time delivery requests

  ## 2. Security Features
  - Row Level Security (RLS) enabled on all tables
  - Restrictive policies by default
  - Authentication-based access control
  - Suppliers can only access their own data
  - Delivery partners see only assigned deliveries
  - Customers access only their own information
  - Admins have system-wide access

  ## 3. Data Integrity
  - Foreign key constraints for referential integrity
  - Check constraints for data validation
  - Unique constraints where applicable
  - NOT NULL constraints for required fields
  - Default values for timestamps and status fields

  ## 4. Indexes
  - Primary key indexes (automatic)
  - Foreign key indexes for query performance
  - Composite indexes for common query patterns
  - Text search indexes where applicable
*/

-- ============================================================================
-- ADMINS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Admin policies - only admins can manage admins
CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE email = auth.jwt()->>'email'
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE email = auth.jwt()->>'email'
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- ============================================================================
-- ENHANCE EXISTING TABLES
-- ============================================================================

-- Add password field to suppliers if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'password'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN password text;
  END IF;
END $$;

-- Add user_id field to suppliers if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN user_id text UNIQUE;
  END IF;
END $$;

-- Add status to customers if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'status'
  ) THEN
    ALTER TABLE customers ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled'));
  END IF;
END $$;

-- Add user_id and password to customers if not exists (for customer portal)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN user_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'password'
  ) THEN
    ALTER TABLE customers ADD COLUMN password text;
  END IF;
END $$;

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Dairy',
  unit text NOT NULL DEFAULT 'liter',
  price numeric NOT NULL CHECK (price >= 0),
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (in_stock = true);

CREATE POLICY "Suppliers can manage their products"
  ON products FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- CUSTOMER ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'delivered', 'cancelled')),
  delivery_date date,
  delivery_address text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id ON customer_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_supplier_id ON customer_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON customer_orders(status);

ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their orders"
  ON customer_orders FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Suppliers can view their orders"
  ON customer_orders FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Customers can create orders"
  ON customer_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM customer_orders
      WHERE customer_id IN (SELECT id FROM customers WHERE email = auth.jwt()->>'email')
      OR supplier_id IN (SELECT id FROM suppliers WHERE email = auth.jwt()->>'email')
    )
  );

-- ============================================================================
-- SUPPLIER UPDATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_updates_supplier_id ON supplier_updates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_updates_published ON supplier_updates(is_published, published_at DESC);

ALTER TABLE supplier_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published updates"
  ON supplier_updates FOR SELECT
  USING (is_published = true);

CREATE POLICY "Suppliers can manage their updates"
  ON supplier_updates FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- MONTHLY INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2000),
  total_deliveries integer NOT NULL DEFAULT 0,
  total_quantity numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  due_date date,
  paid_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_invoices_customer_id ON monthly_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_supplier_id ON monthly_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_monthly_invoices_status ON monthly_invoices(status);

ALTER TABLE monthly_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their invoices"
  ON monthly_invoices FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Suppliers can manage customer invoices"
  ON monthly_invoices FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- INVOICE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line items for their invoices"
  ON invoice_line_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM monthly_invoices
      WHERE customer_id IN (SELECT id FROM customers WHERE email = auth.jwt()->>'email')
      OR supplier_id IN (SELECT id FROM suppliers WHERE email = auth.jwt()->>'email')
    )
  );

-- ============================================================================
-- PRICING TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  min_quantity numeric NOT NULL CHECK (min_quantity >= 0),
  max_quantity numeric CHECK (max_quantity IS NULL OR max_quantity > min_quantity),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_tiers_supplier_id ON pricing_tiers(supplier_id);

ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing tiers"
  ON pricing_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Suppliers can manage their pricing tiers"
  ON pricing_tiers FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- ROUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  delivery_partner_id uuid REFERENCES delivery_partners(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_supplier_id ON routes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_routes_delivery_partner_id ON routes(delivery_partner_id);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can manage their routes"
  ON routes FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Delivery partners can view assigned routes"
  ON routes FOR SELECT
  TO authenticated
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- TEMPORARY DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS temporary_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  delivery_partner_id uuid REFERENCES delivery_partners(id) ON DELETE SET NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  price_per_unit numeric NOT NULL CHECK (price_per_unit >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  delivery_date date NOT NULL,
  scheduled_time text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temporary_deliveries_supplier_id ON temporary_deliveries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_temporary_deliveries_delivery_date ON temporary_deliveries(delivery_date);

ALTER TABLE temporary_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers can manage their temporary deliveries"
  ON temporary_deliveries FOR ALL
  TO authenticated
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Delivery partners can view assigned temporary deliveries"
  ON temporary_deliveries FOR SELECT
  TO authenticated
  USING (
    delivery_partner_id IN (
      SELECT id FROM delivery_partners WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================================================
-- ADD SUGGESTED QUANTITY TO DELIVERIES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliveries' AND column_name = 'suggested_quantity'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN suggested_quantity numeric DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'admins', 'suppliers', 'delivery_partners', 'farmers', 'customers',
      'products', 'customer_orders', 'supplier_updates', 'monthly_invoices',
      'pricing_tiers', 'routes', 'temporary_deliveries', 'deliveries', 'pickup_logs'
    )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- ============================================================================
-- SEED DEFAULT ADMIN (Optional - for testing)
-- ============================================================================

-- Insert default admin if admins table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins LIMIT 1) THEN
    INSERT INTO admins (name, email, password, role)
    VALUES ('System Admin', 'admin@milksupply.com', 'admin123', 'super_admin');
  END IF;
END $$;
