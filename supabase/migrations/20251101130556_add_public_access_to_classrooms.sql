/*
  # Add public access to classrooms table

  1. Changes
    - Add policy to allow anonymous users to view all classrooms
    - This enables the classroom finder to work without requiring login
  
  2. Security
    - Read-only access for anonymous users
    - Existing authenticated user policies remain unchanged
*/

CREATE POLICY "Anyone can view classrooms"
  ON classrooms
  FOR SELECT
  TO anon
  USING (true);
