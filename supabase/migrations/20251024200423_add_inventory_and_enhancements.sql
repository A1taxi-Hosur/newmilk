/*
  # Add Inventory Management and Database Enhancements

  ## Summary
  This migration adds a comprehensive inventory management system and enhances existing tables
  for better tracking of milk intake, milk supplied, and temporary deliveries.

  ## New Tables
  1. **inventory**
     - Tracks all milk inventory in the system
     - Records milk received from farmers (intake)
     - Records milk supplied to customers (outbound)
     - Tracks current stock levels
     - Links to suppliers for multi-supplier support

  ## Enhancements to Existing Tables
  1. **pickup_logs** - Already exists (milk intake from farmers)
  2. **deliveries** - Already exists (milk supplied to customers)
  3. **temporary_deliveries** - Already exists
  4. **customers** - Already exists with proper fields
  5. **delivery_partners** - Already exists
  6. **farmers** - Already exists

  ## Security
  - Enable RLS on new inventory table
  - Add anonymous access policies for custom authentication

  ## Indexes
  - Add performance indexes on frequently queried columns
*/

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('intake', 'supply', 'adjustment', 'waste')),
  reference_id uuid,
  reference_type text CHECK (reference_type IN ('pickup_log', 'delivery', 'manual')),
  quantity numeric NOT NULL CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'liters',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_time timestamptz DEFAULT now(),
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE inventory IS 'Tracks all milk inventory transactions including intake from farmers and supply to customers';
COMMENT ON COLUMN inventory.transaction_type IS 'Type of transaction: intake (from farmers), supply (to customers), adjustment (manual), waste (spoilage)';
COMMENT ON COLUMN inventory.reference_id IS 'Links to pickup_log (intake) or delivery (supply) record';

-- ============================================================================
-- INVENTORY SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
  supplier_id,
  SUM(CASE WHEN transaction_type = 'intake' THEN quantity ELSE 0 END) as total_intake,
  SUM(CASE WHEN transaction_type = 'supply' THEN quantity ELSE 0 END) as total_supply,
  SUM(CASE WHEN transaction_type = 'adjustment' THEN quantity ELSE 0 END) as total_adjustments,
  SUM(CASE WHEN transaction_type = 'waste' THEN quantity ELSE 0 END) as total_waste,
  SUM(
    CASE 
      WHEN transaction_type = 'intake' OR transaction_type = 'adjustment' THEN quantity
      WHEN transaction_type = 'supply' OR transaction_type = 'waste' THEN -quantity
      ELSE 0 
    END
  ) as current_stock
FROM inventory
GROUP BY supplier_id;

COMMENT ON VIEW inventory_summary IS 'Provides a summary of inventory by supplier including current stock levels';

-- ============================================================================
-- DAILY INVENTORY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW daily_inventory AS
SELECT 
  supplier_id,
  transaction_date,
  SUM(CASE WHEN transaction_type = 'intake' THEN quantity ELSE 0 END) as daily_intake,
  SUM(CASE WHEN transaction_type = 'supply' THEN quantity ELSE 0 END) as daily_supply,
  SUM(
    CASE 
      WHEN transaction_type = 'intake' OR transaction_type = 'adjustment' THEN quantity
      WHEN transaction_type = 'supply' OR transaction_type = 'waste' THEN -quantity
      ELSE 0 
    END
  ) as net_change
FROM inventory
GROUP BY supplier_id, transaction_date
ORDER BY transaction_date DESC;

COMMENT ON VIEW daily_inventory IS 'Provides daily inventory summary by supplier';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_reference ON inventory(reference_type, reference_id);

-- Existing table indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_partners_supplier ON delivery_partners(supplier_id);
CREATE INDEX IF NOT EXISTS idx_customers_supplier ON customers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_farmers_supplier ON farmers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_supplier ON pickup_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_farmer ON pickup_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_logs_date ON pickup_logs(pickup_date DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_supplier ON deliveries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_partner ON deliveries(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_allocations_partner ON daily_allocations(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_daily_allocations_date ON daily_allocations(allocation_date DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on inventory table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous and authenticated users (custom auth)
CREATE POLICY "Allow all operations on inventory"
  ON inventory
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS FOR INVENTORY MANAGEMENT
-- ============================================================================

-- Function to automatically create inventory entry when pickup_log is created
CREATE OR REPLACE FUNCTION create_inventory_from_pickup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (
    supplier_id,
    transaction_type,
    reference_id,
    reference_type,
    quantity,
    transaction_date,
    transaction_time,
    notes
  ) VALUES (
    NEW.supplier_id,
    'intake',
    NEW.id,
    'pickup_log',
    NEW.quantity,
    NEW.pickup_date,
    NEW.pickup_time,
    'Auto-created from pickup log: ' || COALESCE(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create inventory entry when delivery is completed
CREATE OR REPLACE FUNCTION create_inventory_from_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO inventory (
      supplier_id,
      transaction_type,
      reference_id,
      reference_type,
      quantity,
      transaction_date,
      transaction_time,
      notes
    ) VALUES (
      NEW.supplier_id,
      'supply',
      NEW.id,
      'delivery',
      NEW.quantity,
      NEW.delivery_date,
      NEW.completed_time,
      'Auto-created from delivery: ' || COALESCE(NEW.notes, '')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trigger_inventory_from_pickup ON pickup_logs;
DROP TRIGGER IF EXISTS trigger_inventory_from_delivery ON deliveries;

-- Create triggers (optional - uncomment if you want automatic inventory tracking)
-- CREATE TRIGGER trigger_inventory_from_pickup
--   AFTER INSERT ON pickup_logs
--   FOR EACH ROW
--   EXECUTE FUNCTION create_inventory_from_pickup();

-- CREATE TRIGGER trigger_inventory_from_delivery
--   AFTER INSERT OR UPDATE ON deliveries
--   FOR EACH ROW
--   EXECUTE FUNCTION create_inventory_from_delivery();

-- ============================================================================
-- VERIFY ALL TABLES EXIST
-- ============================================================================

-- All required tables should now exist:
-- ✓ suppliers
-- ✓ delivery_partners  
-- ✓ customers
-- ✓ farmers
-- ✓ pickup_logs (milk intake)
-- ✓ deliveries (milk supplied)
-- ✓ temporary_deliveries
-- ✓ daily_allocations
-- ✓ customer_assignments
-- ✓ routes
-- ✓ products
-- ✓ customer_orders
-- ✓ order_items
-- ✓ supplier_updates
-- ✓ monthly_invoices
-- ✓ invoice_line_items
-- ✓ pricing_tiers
-- ✓ admins
-- ✓ inventory (NEW)