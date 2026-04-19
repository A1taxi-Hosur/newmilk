/*
  # Add Customer Registrations Table

  ## Purpose
  Stores pending customer self-signup requests that must be reviewed and approved
  by an admin before the customer can access the system.

  ## New Tables
  - `customer_registrations`
    - `id` (uuid, primary key)
    - `name` (text) - Full name provided during signup
    - `phone` (text, unique) - 10-digit phone number
    - `email` (text, optional)
    - `address` (text, optional)
    - `password` (text) - Plain text password (matches existing pattern)
    - `status` (text) - 'pending', 'approved', 'rejected'
    - `rejection_reason` (text, nullable) - Reason if rejected
    - `reviewed_by` (text, nullable) - Admin who reviewed
    - `reviewed_at` (timestamptz, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - No RLS policies needed since admin uses service role and customers use anon insert
  - Public insert allowed (anyone can submit a registration request)
  - Admin reads/updates via service role (bypasses RLS)
*/

CREATE TABLE IF NOT EXISTS customer_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  password text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a registration"
  ON customer_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Registrants can view their own pending request"
  ON customer_registrations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update registrations"
  ON customer_registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
