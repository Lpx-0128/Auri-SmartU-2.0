/*
  # Add coordinates to universities and traffic routes

  1. Changes
    - Add latitude and longitude columns to universities table
    - Add destination latitude and longitude to traffic_routes table
    - Update existing university data with real coordinates
  
  2. Data
    - Taylor's University: 3.0528° N, 101.5841° E (Subang Jaya)
    - Sunway University: 3.0686° N, 101.6054° E (Bandar Sunway)
    - Monash University: 3.0644° N, 101.6003° E (Sunway)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'universities' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE universities ADD COLUMN latitude numeric(10, 7);
    ALTER TABLE universities ADD COLUMN longitude numeric(10, 7);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'traffic_routes' AND column_name = 'destination_latitude'
  ) THEN
    ALTER TABLE traffic_routes ADD COLUMN destination_latitude numeric(10, 7);
    ALTER TABLE traffic_routes ADD COLUMN destination_longitude numeric(10, 7);
  END IF;
END $$;

UPDATE universities SET latitude = 3.0528, longitude = 101.5841 WHERE code = 'TAYLORS';
UPDATE universities SET latitude = 3.0686, longitude = 101.6054 WHERE code = 'SUNWAY';
UPDATE universities SET latitude = 3.0644, longitude = 101.6003 WHERE code = 'MONASH';
