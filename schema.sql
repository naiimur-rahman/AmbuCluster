-- schema.sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'hospital', 'driver')),
    password_hash VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS patient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(10),
    allergies TEXT,
    chronic_diseases TEXT,
    past_surgeries TEXT,
    emergency_contact VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    total_beds INTEGER,
    available_beds INTEGER
);

CREATE TABLE IF NOT EXISTS ambulances (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'en_route', 'busy')),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8)
);

CREATE TABLE IF NOT EXISTS emergency_requests (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'en_route_hospital', 'completed', 'cancelled')),
    is_sos BOOLEAN DEFAULT FALSE,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP
);

INSERT INTO users (name, email, role, password_hash) VALUES
('John Doe', 'john@example.com', 'patient', 'hashed_pw'),
('Jane Smith', 'jane@example.com', 'patient', 'hashed_pw'),
('City Hospital Admin', 'admin@cityhospital.com', 'hospital', 'hashed_pw'),
('General Hospital Admin', 'admin@generalhospital.com', 'hospital', 'hashed_pw'),
('Driver Mike', 'mike@ambulance.com', 'driver', 'hashed_pw'),
('Driver Sarah', 'sarah@ambulance.com', 'driver', 'hashed_pw') ON CONFLICT DO NOTHING;

INSERT INTO patient_profiles (user_id, blood_group, allergies, chronic_diseases, past_surgeries, emergency_contact) VALUES
(1, 'O+', 'Peanuts', 'Asthma', 'Appendectomy (2015)', '555-0101'),
(2, 'A-', 'None', 'None', 'None', '555-0102') ON CONFLICT DO NOTHING;

INSERT INTO hospitals (user_id, name, location_lat, location_lng, address, total_beds, available_beds) VALUES
(3, 'City Hospital', 40.7128, -74.0060, '123 Main St', 500, 150),
(4, 'General Hospital', 40.7306, -73.9352, '456 Broad St', 300, 45) ON CONFLICT DO NOTHING;

INSERT INTO ambulances (driver_id, vehicle_number, status, location_lat, location_lng) VALUES
(5, 'AMB-1001', 'available', 40.7200, -74.0000),
(6, 'AMB-1002', 'available', 40.7400, -73.9500) ON CONFLICT DO NOTHING;
