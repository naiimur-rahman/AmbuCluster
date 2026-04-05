-- updated_schema.sql
DROP TABLE IF EXISTS emergency_requests CASCADE;
DROP TABLE IF EXISTS ambulances CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'hospital', 'driver')),
    password_hash VARCHAR(255)
);

CREATE TABLE patient_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    nid VARCHAR(50),
    dob DATE,
    gender VARCHAR(10),
    blood_group VARCHAR(10),
    allergies TEXT,
    chronic_diseases TEXT,
    past_surgeries TEXT,
    emergency_contact VARCHAR(50)
);

CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'Private', -- Government or Private
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    total_beds INTEGER,
    available_beds INTEGER,
    icu_beds INTEGER DEFAULT 0
);

CREATE TABLE ambulances (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'Basic Life Support', -- ALS, BLS, Freezing
    base_hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'en_route', 'busy')),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8)
);

CREATE TABLE emergency_requests (
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
