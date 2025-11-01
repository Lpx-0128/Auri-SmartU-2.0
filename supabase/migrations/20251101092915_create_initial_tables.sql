/*
  # Initial Database Schema Setup

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, required)
      - `email` (text, required)
      - `phone_number` (text, required)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `universities`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `code` (text, unique, required)
      - `created_at` (timestamptz)

    - `classrooms`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `building` (text, required)
      - `capacity` (integer)
      - `is_available` (boolean)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

    - `lifts`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `building` (text, required)
      - `current_floor` (integer)
      - `queue_count` (integer)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

    - `parking_lots`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `total_spaces` (integer)
      - `available_spaces` (integer)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

    - `library_seats`
      - `id` (uuid, primary key)
      - `floor` (text, required)
      - `section` (text, required)
      - `seat_number` (text, required)
      - `is_available` (boolean)
      - `has_charging_port` (boolean)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

    - `food_stalls`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `available_seats` (integer)
      - `total_seats` (integer)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

    - `traffic_routes`
      - `id` (uuid, primary key)
      - `route_name` (text, required)
      - `from_location` (text, required)
      - `to_location` (text, required)
      - `distance_km` (decimal)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

    - `traffic_status`
      - `id` (uuid, primary key)
      - `route_id` (uuid, references traffic_routes)
      - `status` (text, required)
      - `estimated_time_minutes` (integer)
      - `updated_at` (timestamptz)

    - `emergency_contacts`
      - `id` (uuid, primary key)
      - `category` (text, required)
      - `name` (text, required)
      - `phone` (text, required)
      - `description` (text)
      - `university_id` (uuid, references universities)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their university data
*/

-- Create universities table first
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view universities"
  ON universities FOR SELECT
  TO authenticated
  USING (true);

-- Insert universities
INSERT INTO universities (name, code) VALUES
  ('Taylor University', 'TAYLORS'),
  ('Sunway University', 'SUNWAY'),
  ('Monash University', 'MONASH')
ON CONFLICT (code) DO NOTHING;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  building text NOT NULL,
  capacity integer DEFAULT 0,
  is_available boolean DEFAULT true,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view classrooms from their university"
  ON classrooms FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create lifts table
CREATE TABLE IF NOT EXISTS lifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  building text NOT NULL,
  current_floor integer DEFAULT 0,
  queue_count integer DEFAULT 0,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lifts from their university"
  ON lifts FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create parking_lots table
CREATE TABLE IF NOT EXISTS parking_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  total_spaces integer DEFAULT 0,
  available_spaces integer DEFAULT 0,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parking_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view parking from their university"
  ON parking_lots FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create library_seats table
CREATE TABLE IF NOT EXISTS library_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor text NOT NULL,
  section text NOT NULL,
  seat_number text NOT NULL,
  is_available boolean DEFAULT true,
  has_charging_port boolean DEFAULT false,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE library_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view library seats from their university"
  ON library_seats FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create food_stalls table
CREATE TABLE IF NOT EXISTS food_stalls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  available_seats integer DEFAULT 0,
  total_seats integer DEFAULT 0,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_stalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view food stalls from their university"
  ON food_stalls FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create traffic_routes table
CREATE TABLE IF NOT EXISTS traffic_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  distance_km decimal,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE traffic_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view traffic routes from their university"
  ON traffic_routes FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Create traffic_status table
CREATE TABLE IF NOT EXISTS traffic_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES traffic_routes(id) ON DELETE CASCADE,
  status text NOT NULL,
  estimated_time_minutes integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE traffic_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view traffic status"
  ON traffic_status FOR SELECT
  TO authenticated
  USING (
    route_id IN (
      SELECT id FROM traffic_routes
      WHERE university_id = (
        SELECT university_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  description text,
  university_id uuid REFERENCES universities(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emergency contacts from their university"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );
