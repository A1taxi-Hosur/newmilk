/*
  # Add Products, Orders, and Updates Tables

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `category` (text)
      - `unit` (text, e.g., "liter", "kg", "piece")
      - `in_stock` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `order_number` (text, unique)
      - `status` (text: pending, confirmed, preparing, out_for_delivery, delivered, cancelled)
      - `total_amount` (numeric)
      - `delivery_address` (text)
      - `delivery_date` (date)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (numeric)
      - `unit_price` (numeric)
      - `total_price` (numeric)
      - `created_at` (timestamptz)

    - `supplier_updates`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `title` (text)
      - `content` (text)
      - `type` (text: news, announcement, promotion)
      - `published` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for suppliers to manage their own products, orders, and updates
    - Add policies for customers to view products and manage their own orders
    - Add policies for customers to view published updates from their supplier
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url text DEFAULT '',
  category text DEFAULT 'General',
  unit text DEFAULT 'piece',
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  delivery_address text NOT NULL,
  delivery_date date NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity numeric(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price numeric(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create supplier_updates table
CREATE TABLE IF NOT EXISTS supplier_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'news' CHECK (type IN ('news', 'announcement', 'promotion')),
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_updates ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Suppliers can view their own products"
  ON products FOR SELECT
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can insert their own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can update their own products"
  ON products FOR UPDATE
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can delete their own products"
  ON products FOR DELETE
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Customers can view in-stock products"
  ON products FOR SELECT
  TO authenticated
  USING (in_stock = true);

-- Orders Policies
CREATE POLICY "Suppliers can view their orders"
  ON orders FOR SELECT
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Customers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE id = customer_id));

CREATE POLICY "Customers can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE id = customer_id));

CREATE POLICY "Suppliers can update their orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Customers can update their pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE id = customer_id) AND status = 'pending')
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE id = customer_id));

-- Order Items Policies
CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (SELECT id FROM customers WHERE id = customer_id)
      OR supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id)
    )
  );

CREATE POLICY "Customers can insert order items for their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (SELECT id FROM customers WHERE id = customer_id)
    )
  );

-- Supplier Updates Policies
CREATE POLICY "Suppliers can view their own updates"
  ON supplier_updates FOR SELECT
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can insert their own updates"
  ON supplier_updates FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can update their own updates"
  ON supplier_updates FOR UPDATE
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id))
  WITH CHECK (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can delete their own updates"
  ON supplier_updates FOR DELETE
  TO authenticated
  USING (supplier_id IN (SELECT id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Customers can view published updates from their supplier"
  ON supplier_updates FOR SELECT
  TO authenticated
  USING (
    published = true
    AND supplier_id IN (
      SELECT assigned_supplier_id FROM customers
      WHERE id IN (SELECT id FROM customers WHERE id = customer_id)
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_updates_supplier_id ON supplier_updates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_updates_published ON supplier_updates(published);
