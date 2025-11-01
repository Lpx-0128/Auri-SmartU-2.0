/*
  # Add comprehensive POIs for all universities

  1. Changes
    - Clear existing traffic data
    - Add extensive POI destinations for each university
    - Include shopping malls, transportation hubs, food places, hospitals, entertainment
  
  2. POI Categories
    - Shopping Centers
    - Public Transportation (LRT, MRT, BRT, KTM)
    - Food & Dining
    - Healthcare
    - Entertainment & Leisure
    - Business Districts
*/

DELETE FROM traffic_status;
DELETE FROM traffic_routes;

-- Taylor's University POIs
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
    -- Shopping Centers
    ('Sunway Pyramid', 3.0732, 101.6074, 3.5),
    ('Subang Parade', 3.0507, 101.5822, 1.2),
    ('Empire Shopping Gallery', 3.0765, 101.5845, 2.8),
    ('Summit Subang USJ', 3.0425, 101.5838, 2.0),
    ('Da Men Mall USJ', 3.0475, 101.5802, 2.3),
    ('One City Mall', 3.0789, 101.5821, 3.2),
    ('Citta Mall', 3.0119, 101.5345, 6.5),
    ('Paradigm Mall PJ', 3.1105, 101.6289, 8.0),
    ('3 Damansara', 3.1388, 101.6358, 10.5),
    ('The Starling Mall', 3.1489, 101.6587, 12.0),
    -- Transportation
    ('Subang Jaya LRT Station', 3.0495, 101.5813, 1.5),
    ('USJ 7 LRT Station', 3.0391, 101.5827, 2.5),
    ('Asia Jaya LRT Station', 3.0792, 101.5821, 3.0),
    ('Taman Jaya LRT Station', 3.0859, 101.5894, 3.5),
    ('Kelana Jaya LRT Station', 3.1129, 101.6013, 5.0),
    ('Sunway BRT Station', 3.0682, 101.6066, 3.0),
    ('KTM Subang Jaya Station', 3.0514, 101.5789, 1.8),
    -- Food & Dining
    ('SS15 Food Court', 3.0761, 101.5881, 2.8),
    ('Taipan USJ', 3.0423, 101.5812, 2.2),
    ('SS15 Courtyard', 3.0756, 101.5889, 2.7),
    ('Restoran Nasi Kandar Subang', 3.0492, 101.5831, 1.4),
    -- Healthcare
    ('Sunway Medical Centre', 3.0719, 101.6046, 3.2),
    ('Columbia Asia Subang Jaya', 3.0516, 101.5863, 1.5),
    ('Assunta Hospital', 3.0691, 101.5751, 2.5),
    -- Entertainment
    ('Sunway Lagoon Theme Park', 3.0715, 101.6067, 3.3),
    ('Lost World of Tambun', 4.5882, 101.1273, 180.0),
    ('Kinokuniya Sunway Pyramid', 3.0732, 101.6074, 3.5),
    -- Business Districts
    ('SS15 Business District', 3.0761, 101.5881, 2.8),
    ('Subang Jaya Industrial Area', 3.0456, 101.5705, 2.8),
    ('Glenmarie', 3.0735, 101.5532, 3.5)
) AS destinations(destination, lat, lng, dist)
WHERE u.code = 'TAYLORS';

-- Sunway University POIs
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
    -- Shopping Centers
    ('Sunway Pyramid', 3.0732, 101.6074, 0.8),
    ('Sunway Giza Mall', 3.0658, 101.6015, 1.2),
    ('Subang Parade', 3.0507, 101.5822, 2.5),
    ('Empire Shopping Gallery', 3.0765, 101.5845, 1.8),
    ('Summit Subang USJ', 3.0425, 101.5838, 3.5),
    ('Da Men Mall USJ', 3.0475, 101.5802, 3.8),
    ('One City Mall', 3.0789, 101.5821, 2.2),
    ('Paradigm Mall PJ', 3.1105, 101.6289, 6.5),
    ('The Curve', 3.1572, 101.6421, 10.0),
    ('IKEA Damansara', 3.1518, 101.6358, 9.5),
    -- Transportation
    ('BRT Sunway Lagoon Station', 3.0682, 101.6066, 0.3),
    ('BRT SunMed Station', 3.0719, 101.6046, 0.6),
    ('Sunway South Quay MRT', 3.0654, 101.5995, 1.0),
    ('Subang Jaya LRT Station', 3.0495, 101.5813, 2.8),
    ('USJ 7 LRT Station', 3.0391, 101.5827, 4.0),
    ('Kelana Jaya LRT Station', 3.1129, 101.6013, 4.5),
    ('KTM Subang Jaya Station', 3.0514, 101.5789, 3.0),
    -- Food & Dining
    ('Sunway Pyramid Food Court', 3.0732, 101.6074, 0.8),
    ('SS15 Food Court', 3.0761, 101.5881, 1.5),
    ('Taipan USJ', 3.0423, 101.5812, 3.7),
    ('The Waterfront Sunway', 3.0715, 101.6075, 0.7),
    ('Mamak Sunway', 3.0695, 101.6055, 0.5),
    -- Healthcare
    ('Sunway Medical Centre', 3.0719, 101.6046, 0.6),
    ('Columbia Asia Subang Jaya', 3.0516, 101.5863, 2.8),
    ('Assunta Hospital', 3.0691, 101.5751, 3.5),
    -- Entertainment
    ('Sunway Lagoon Theme Park', 3.0715, 101.6067, 0.5),
    ('Lost World of Tambun', 4.5882, 101.1273, 180.0),
    ('Kinokuniya Sunway Pyramid', 3.0732, 101.6074, 0.8),
    ('Sunway X-Park', 3.0708, 101.6082, 0.6),
    -- Business Districts
    ('Sunway Geo Avenue', 3.0697, 101.6012, 0.8),
    ('Menara Sunway', 3.0728, 101.6063, 0.7),
    ('Subang Jaya Industrial Area', 3.0456, 101.5705, 4.0)
) AS destinations(destination, lat, lng, dist)
WHERE u.code = 'SUNWAY';

-- Monash University POIs
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
    -- Shopping Centers
    ('Sunway Pyramid', 3.0732, 101.6074, 1.2),
    ('Sunway Velocity Mall', 3.0691, 101.6089, 1.5),
    ('Sunway Giza Mall', 3.0658, 101.6015, 0.8),
    ('Subang Parade', 3.0507, 101.5822, 3.0),
    ('Empire Shopping Gallery', 3.0765, 101.5845, 2.2),
    ('Summit Subang USJ', 3.0425, 101.5838, 4.5),
    ('One City Mall', 3.0789, 101.5821, 2.5),
    ('Paradigm Mall PJ', 3.1105, 101.6289, 7.0),
    ('Citta Mall', 3.0119, 101.5345, 8.0),
    ('IOI City Mall Putrajaya', 2.9869, 101.7241, 15.0),
    -- Transportation
    ('Sunway South Quay MRT', 3.0654, 101.5995, 0.5),
    ('BRT Sunway Lagoon Station', 3.0682, 101.6066, 0.8),
    ('BRT SunMed Station', 3.0719, 101.6046, 1.0),
    ('Subang Jaya LRT Station', 3.0495, 101.5813, 3.2),
    ('USJ 7 LRT Station', 3.0391, 101.5827, 4.5),
    ('Kelana Jaya LRT Station', 3.1129, 101.6013, 5.0),
    ('KTM Subang Jaya Station', 3.0514, 101.5789, 3.5),
    -- Food & Dining
    ('Sunway Pyramid Food Court', 3.0732, 101.6074, 1.2),
    ('SS15 Food Court', 3.0761, 101.5881, 2.0),
    ('The Waterfront Sunway', 3.0715, 101.6075, 1.1),
    ('Taipan USJ', 3.0423, 101.5812, 4.2),
    ('Bandar Sunway Mamak', 3.0695, 101.6055, 1.0),
    -- Healthcare
    ('Sunway Medical Centre', 3.0719, 101.6046, 1.0),
    ('Columbia Asia Subang Jaya', 3.0516, 101.5863, 3.2),
    ('Assunta Hospital', 3.0691, 101.5751, 4.0),
    ('Prince Court Medical Centre', 3.1441, 101.6693, 12.0),
    -- Entertainment
    ('Sunway Lagoon Theme Park', 3.0715, 101.6067, 1.0),
    ('Lost World of Tambun', 4.5882, 101.1273, 180.0),
    ('Kinokuniya Sunway Pyramid', 3.0732, 101.6074, 1.2),
    ('Sunway X-Park', 3.0708, 101.6082, 1.0),
    -- Business Districts
    ('Sunway Geo Avenue', 3.0697, 101.6012, 0.6),
    ('Menara Sunway', 3.0728, 101.6063, 0.9),
    ('Subang Jaya Industrial Area', 3.0456, 101.5705, 4.5),
    ('Cyberjaya', 2.9202, 101.6543, 20.0)
) AS destinations(destination, lat, lng, dist)
WHERE u.code = 'MONASH';

-- Insert initial placeholder traffic status
INSERT INTO traffic_status (route_id, status, estimated_time_minutes)
SELECT 
  tr.id,
  'Light',
  (tr.distance_km * 3)::int
FROM traffic_routes tr;
