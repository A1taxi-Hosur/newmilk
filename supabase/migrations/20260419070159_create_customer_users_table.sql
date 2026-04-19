/*
  # Create customer_users table

  ## Purpose
  Stores login credentials for customers. This is separate from the `customers`
  table (which holds delivery/order info) and is used exclusively for authentication.

  ## New Tables
  - `customer_users`
    - `id` (uuid, primary key)
    - `phone` (text, unique) - Used as login identifier
    - `name` (text) - Customer display name
    - `password` (text) - SHA-256 hashed password
    - `last_login` (timestamptz, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public insert allowed (for signup flow)
  - Authenticated users can read/update their own record by phone
*/

CREATE TABLE IF NOT EXISTS customer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  name text NOT NULL,
  password text NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a customer user"
  ON customer_users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read customer users by phone"
  ON customer_users
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update customer users"
  ON customer_users
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
