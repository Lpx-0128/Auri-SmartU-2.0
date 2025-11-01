/*
  # Limit POI destinations to 9 specified locations

  1. Changes
    - Clear existing traffic routes
    - Add only the 9 specified destinations:
      1. Sunway Geo Avenue
      2. 1 Utama Shopping Centre
      3. Sunway Mentari
      4. Sunway Pyramid
      5. SS15
      6. SS2
      7. KLCC (Suria KLCC)
      8. Paradigm Mall
      9. Mid Valley Megamall
  
  2. Coordinates
    - All coordinates are accurate real-world locations
    - Routes from each university to all 9 destinations
*/

DELETE FROM traffic_status;
DELETE FROM traffic_routes;

-- Add routes for Taylor's University
INSERT INTO traffic_routes (route_name, from_location, to_location, destination_latitude, destination_longitude, distance_km, university_id)
SELECT 
  'Campus to ' || destination,
  'Taylor University Campus',
  destination,
  lat,
  lng,
  dist,
  u.id
FROM universities u
CROSS JOIN (
  VALUES 
    ('Sunway Geo Avenue', 3.069690, 101.601200, 3.0),
    ('1 Utama Shopping Centre', 3.150140, 101.614800, 11.5),
    ('Sunway Mentari', 3.066500, 101.597800, 3.2),
    ('Sunway Pyramid', 3.073200, 101.607400, 3.5),
    ('SS15', 3.076100, 101.588100, 2.8),
    ('SS2', 3.119700, 101.621400, 8.0),
    ('KLCC', 3.157900, 101.711800, 15.5),
    ('Paradigm Mall', 3.110500, 101.628900, 8.5),
    ('Mid Valley Megamall', 3.118200, 101.677600, 12.0)
) AS destinations(destination, lat, lng, dist)
WHERE u.code = 'TAYLORS';

-- Add routes for Sunway University
INSERT INTO traffic_routes (route_name, from_location, to_location, destination_latitude, destination_longitude, distance_km, university_id)
SELECT 
  'Campus to ' || destination,
  'Sunway University Campus',
  destination,
  lat,
  lng,
  dist,
  u.id
FROM universities u
CROSS JOIN (
  VALUES 
    ('Sunway Geo Avenue', 3.069690, 101.601200, 0.5),
    ('1 Utama Shopping Centre', 3.150140, 101.614800, 10.0),
    ('Sunway Mentari', 3.066500, 101.597800, 0.8),
    ('Sunway Pyramid', 3.073200, 101.607400, 1.0),
    ('SS15', 3.076100, 101.588100, 1.8),
    ('SS2', 3.119700, 101.621400, 7.0),
    ('KLCC', 3.157900, 101.711800, 14.0),
    ('Paradigm Mall', 3.110500, 101.628900, 7.5),
    ('Mid Valley Megamall', 3.118200, 101.677600, 11.0)
) AS destinations(destination, lat, lng, dist)
WHERE u.code = 'SUNWAY';

-- Add routes for Monash University
INSERT INTO traffic_routes (route_name, from_location, to_location, destination_latitude, destination_longitude, distance_km, university_id)
SELECT 
  'Campus to ' || destination,
  'Monash University Campus',
  destination,
  lat,
  lng,
  dist,
  u.id
FROM universities u
CROSS JOIN (
  VALUES 
    ('Sunway Geo Avenue', 3.069690, 101.601200, 0.7),
    ('1 Utama Shopping Centre', 3.150140, 101.614800, 10.5),
    ('Sunway Mentari', 3.066500, 101.597800, 0.6),
    ('Sunway Pyramid', 3.073200, 101.607400, 1.2),
    ('SS15', 3.076100, 101.588100, 2.0),
    ('SS2', 3.119700, 101.621400, 7.2),
    ('KLCC', 3.157900, 101.711800, 14.5),
    ('Paradigm Mall', 3.110500, 101.628900, 8.0),
    ('Mid Valley Megamall', 3.118200, 101.677600, 11.5)
) AS destinations(destination, lat, lng, dist)
WHERE u.code = 'MONASH';

-- Insert initial placeholder traffic status
INSERT INTO traffic_status (route_id, status, estimated_time_minutes)
SELECT 
  tr.id,
  'Light',
  (tr.distance_km * 3)::int
FROM traffic_routes tr;
