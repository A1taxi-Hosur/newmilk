/*
  # Fix suppliers RLS policy for demo data initialization

  1. Security Updates
    - Add policy to allow anonymous users to insert suppliers (for registration)
    - Maintain existing policies for authenticated users
    - Allow demo data initialization without authentication
*/

-- Drop existing restrictive insert policy if it exists
DROP POLICY IF EXISTS "Anyone can insert suppliers (for registration)" ON suppliers;

-- Create new policy that allows anonymous registration
CREATE POLICY "Allow supplier registration"
  ON suppliers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure existing policies remain for other operations
-- (The existing policies for SELECT and UPDATE should remain unchanged)