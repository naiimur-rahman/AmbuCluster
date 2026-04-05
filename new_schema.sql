DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable UUID extension if needed (gen_random_uuid is built-in for PG 13+)

CREATE TYPE user_role AS ENUM ('Patient', 'Driver', 'Hospital', 'Admin');
CREATE TYPE ambulance_type AS ENUM ('Basic', 'ICU', 'Freezing');
CREATE TYPE ambulance_status AS ENUM ('Available', 'On_Trip', 'Maintenance', 'Offline');
CREATE TYPE trip_status AS ENUM ('Pending', 'Accepted', 'En_Route', 'Completed', 'Cancelled');

-- 1. Users Table (Centralized Auth for all roles)
CREATE TABLE Users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hospitals Table
CREATE TABLE Hospitals (
    hospital_id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    available_icu_beds INT DEFAULT 0,
    available_general_beds INT DEFAULT 0,
    FOREIGN KEY (hospital_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. Ambulances Table
CREATE TABLE Ambulances (
    ambulance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    type ambulance_type NOT NULL,
    status ambulance_status DEFAULT 'Offline',
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    FOREIGN KEY (driver_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 4. Trips (Rides) Table
CREATE TABLE Trips (
    trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    ambulance_id UUID,  -- Nullable initially until accepted
    destination_hospital_id UUID,
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(11, 8) NOT NULL,
    status trip_status DEFAULT 'Pending',
    fare_estimated DECIMAL(10, 2),
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_time TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES Users(user_id),
    FOREIGN KEY (ambulance_id) REFERENCES Ambulances(ambulance_id),
    FOREIGN KEY (destination_hospital_id) REFERENCES Hospitals(hospital_id)
);

-- 5. Trigger: Auto-update Ambulance Status when a Trip is Completed/Accepted
CREATE OR REPLACE FUNCTION update_ambulance_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' OR NEW.status = 'Cancelled' THEN
        UPDATE Ambulances SET status = 'Available' WHERE ambulance_id = NEW.ambulance_id;
    ELSIF NEW.status = 'Accepted' THEN
        UPDATE Ambulances SET status = 'On_Trip' WHERE ambulance_id = NEW.ambulance_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_status_trigger
AFTER UPDATE OF status ON Trips
FOR EACH ROW
EXECUTE FUNCTION update_ambulance_status();
