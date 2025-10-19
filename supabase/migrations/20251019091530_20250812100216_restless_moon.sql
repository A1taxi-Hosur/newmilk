/*
  # Milk Supply Chain Management Database Schema

  1. New Tables
    - `suppliers` - Store supplier information and business details
    - `delivery_partners` - Store delivery partner profiles and credentials
    - `customers` - Store customer information and daily requirements
    - `daily_allocations` - Track daily milk allocations to delivery partners
    - `deliveries` - Record individual delivery transactions
    - `customer_assignments` - Many-to-many relationship between delivery partners and customers

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Suppliers can only access their own delivery partners and customers
    - Delivery partners can only see their assigned deliveries
    - Customers can only see their own delivery history

  3. Features
    - UUID primary keys for all tables
    - Timestamps for audit trails
    - Status tracking for suppliers, deliveries, and allocations
    - Foreign key relationships for data integrity
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  license_number text UNIQUE NOT NULL,
  total_capacity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  registration_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create delivery_partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  vehicle_number text NOT NULL,
  user_id text UNIQUE NOT NULL,
  password text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  daily_quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS customer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id uuid NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(delivery_partner_id, customer_id)
);

-- Create daily_allocations table
CREATE TABLE IF NOT EXISTS daily_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  delivery_partner_id uuid NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  allocation_date date NOT NULL,
  allocated_quantity integer NOT NULL DEFAULT 0,
  remaining_quantity integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(delivery_partner_id, allocation_date)
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  delivery_partner_id uuid NOT NULL REFERENCES delivery_partners(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  delivery_date date NOT NULL,
  scheduled_time text DEFAULT '08:00 AM',
  completed_time timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Suppliers can read own data"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Suppliers can update own data"
  ON suppliers
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert suppliers (for registration)"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for delivery_partners
CREATE POLICY "Suppliers can manage their delivery partners"
  ON delivery_partners
  FOR ALL
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE auth.uid()::text = id::text));

CREATE POLICY "Delivery partners can read own data"
  ON delivery_partners
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for customers
CREATE POLICY "Suppliers can manage their customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE auth.uid()::text = id::text));

CREATE POLICY "Customers can read own data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for customer_assignments
CREATE POLICY "Suppliers can manage customer assignments"
  ON customer_assignments
  FOR ALL
  TO authenticated
  USING (
    delivery_partner_id IN (
      SELECT dp.id FROM delivery_partners dp
      JOIN suppliers s ON dp.supplier_id = s.id
      WHERE auth.uid()::text = s.id::text
    )
  );

-- Create policies for daily_allocations
CREATE POLICY "Suppliers can manage their allocations"
  ON daily_allocations
  FOR ALL
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE auth.uid()::text = id::text));

CREATE POLICY "Delivery partners can read their allocations"
  ON daily_allocations
  FOR SELECT
  TO authenticated
  USING (delivery_partner_id IN (SELECT id FROM delivery_partners WHERE auth.uid()::text = id::text));

-- Create policies for deliveries
CREATE POLICY "Suppliers can manage their deliveries"
  ON deliveries
  FOR ALL
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE auth.uid()::text = id::text));

CREATE POLICY "Delivery partners can read and update their deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (delivery_partner_id IN (SELECT id FROM delivery_partners WHERE auth.uid()::text = id::text));

CREATE POLICY "Delivery partners can update delivery status"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (delivery_partner_id IN (SELECT id FROM delivery_partners WHERE auth.uid()::text = id::text));

CREATE POLICY "Customers can read their deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth.uid()::text = id::text));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_supplier_id ON delivery_partners(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_user_id ON delivery_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_supplier_id ON customers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_delivery_partner ON customer_assignments(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer ON customer_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_allocations_date ON daily_allocations(allocation_date);
CREATE INDEX IF NOT EXISTS idx_daily_allocations_partner_date ON daily_allocations(delivery_partner_id, allocation_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_partner_date ON deliveries(delivery_partner_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_partners_updated_at BEFORE UPDATE ON delivery_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_allocations_updated_at BEFORE UPDATE ON daily_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();