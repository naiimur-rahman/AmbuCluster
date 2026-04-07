-- Enable UUID generation and PostGIS for geographical operations
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enums for highly constrained, indexed status values
CREATE TYPE ambulance_status AS ENUM ('AVAILABLE', 'DISPATCHED', 'MAINTENANCE', 'OFF_DUTY');
CREATE TYPE emergency_status AS ENUM ('PENDING', 'EN_ROUTE_TO_PATIENT', 'EN_ROUTE_TO_HOSPITAL', 'ADMITTED', 'COMPLETED', 'CANCELLED');

-- 1. Admin_Staff Table
CREATE TABLE admin_staff (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patient Table
CREATE TABLE patient (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE,
    blood_group VARCHAR(5),
    emergency_contact VARCHAR(20),
    clinical_notes JSONB, -- Allows flexible storage of unstructured medical history
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Hospital Table
CREATE TABLE hospital (
    hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL, -- NUMERIC(11,8) safely accommodates longitudes up to +/- 180.00000000
    total_er_beds INT NOT NULL DEFAULT 0,
    available_er_beds INT NOT NULL DEFAULT 0
);

-- 4. Ambulance Table
CREATE TABLE ambulance (
    ambulance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    status ambulance_status DEFAULT 'AVAILABLE',
    base_hospital_id UUID REFERENCES hospital(hospital_id) ON DELETE SET NULL,
    current_latitude NUMERIC(10, 8),
    current_longitude NUMERIC(11, 8),
    last_maintenance_date DATE
);

-- 5. Equipment Table
CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id UUID NOT NULL REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    expiration_date DATE,
    last_inspected TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usage_hours INT DEFAULT 0
);

-- 6. Emergency_Request Table
CREATE TABLE emergency_request (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
    ambulance_id UUID REFERENCES ambulance(ambulance_id) ON DELETE SET NULL,
    destination_hospital_id UUID REFERENCES hospital(hospital_id) ON DELETE RESTRICT,
    status emergency_status DEFAULT 'PENDING',
    pickup_latitude NUMERIC(10, 8) NOT NULL,
    pickup_longitude NUMERIC(11, 8) NOT NULL,
    request_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    dispatch_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ
);

-- 7. IoT_Location_Log Table (Partitioned)
-- Designed to handle thousands of inserts per minute.
CREATE TABLE iot_location_log (
    log_id BIGSERIAL,
    ambulance_id UUID NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    speed_kmh NUMERIC(5, 2),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- In PostgreSQL partitioned tables, the partition key must be part of the Primary Key
    PRIMARY KEY (log_id, recorded_at),
    CONSTRAINT fk_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulance(ambulance_id) ON DELETE CASCADE
) PARTITION BY RANGE (recorded_at);

-- Create Partitions (Example for April and May 2026, and past for seeds)
CREATE TABLE iot_location_log_past PARTITION OF iot_location_log
    FOR VALUES FROM ('2020-01-01 00:00:00+06') TO ('2026-04-01 00:00:00+06');

CREATE TABLE iot_location_log_2026_04 PARTITION OF iot_location_log
    FOR VALUES FROM ('2026-04-01 00:00:00+06') TO ('2026-05-01 00:00:00+06');

CREATE TABLE iot_location_log_2026_05 PARTITION OF iot_location_log
    FOR VALUES FROM ('2026-05-01 00:00:00+06') TO ('2026-06-01 00:00:00+06');

CREATE TABLE iot_location_log_future PARTITION OF iot_location_log
    FOR VALUES FROM ('2026-06-01 00:00:00+06') TO ('2100-01-01 00:00:00+06');


-- Create the Maintenance Alert Table
CREATE TABLE maintenance_alert (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    alert_reason TEXT NOT NULL,
    alert_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_resolved BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- INDEXES FOR READ OPTIMIZATION
-- ==========================================

-- Standard B-Tree Indexes for Foreign Keys and Status Filtering
CREATE INDEX idx_ambulance_status ON ambulance(status);
CREATE INDEX idx_emergency_status ON emergency_request(status);
CREATE INDEX idx_emergency_hospital ON emergency_request(destination_hospital_id);
CREATE INDEX idx_equipment_ambulance ON equipment(ambulance_id);

-- Time-Series Index for the IoT Table
-- Drastically speeds up "Where was this ambulance between time X and Y?" queries
CREATE INDEX idx_iot_log_time ON iot_location_log(recorded_at DESC);
CREATE INDEX idx_iot_log_ambulance_time ON iot_location_log(ambulance_id, recorded_at DESC);


-- ==========================================
-- STORED PROCEDURES & TRIGGERS
-- ==========================================

CREATE OR REPLACE PROCEDURE SP_Assign_Nearest_Ambulance(
    IN p_Patient_ID UUID,
    IN p_Patient_Lat NUMERIC,
    IN p_Patient_Long NUMERIC,
    IN p_Destination_Hospital_ID UUID, -- Can be NULL; will default to Ambulance's base
    OUT p_Assigned_Ambulance_ID UUID,
    OUT p_ETA_Minutes INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_distance_meters FLOAT;
    v_base_hospital_id UUID;
BEGIN
    -- 1. Find the nearest available ambulance and LOCK it to prevent double-dispatching
    -- We cast the NUMERIC coordinates to PostGIS GEOGRAPHY types for accurate Earth-curvature math
    SELECT
        ambulance_id,
        base_hospital_id,
        ST_Distance(
            ST_MakePoint(current_longitude::FLOAT, current_latitude::FLOAT)::GEOGRAPHY,
            ST_MakePoint(p_Patient_Long::FLOAT, p_Patient_Lat::FLOAT)::GEOGRAPHY
        ) AS distance_m
    INTO
        p_Assigned_Ambulance_ID,
        v_base_hospital_id,
        v_distance_meters
    FROM ambulance
    WHERE status = 'AVAILABLE'
    ORDER BY
        ST_MakePoint(current_longitude::FLOAT, current_latitude::FLOAT)::GEOGRAPHY
        <->
        ST_MakePoint(p_Patient_Long::FLOAT, p_Patient_Lat::FLOAT)::GEOGRAPHY
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- 2. Handle Edge Case: No ambulances available in the city
    IF p_Assigned_Ambulance_ID IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: No available ambulances at this moment.';
    END IF;

    -- 3. Calculate ETA
    -- Assuming an average urban emergency speed of 40 km/h (~666 meters per minute)
    p_ETA_Minutes := CEIL(v_distance_meters / 666.0);

    -- 4. Update the Ambulance State
    UPDATE ambulance
    SET status = 'DISPATCHED'
    WHERE ambulance_id = p_Assigned_Ambulance_ID;

    -- 5. Insert the Emergency Request
    -- If a destination hospital isn't explicitly provided, route to the ambulance's base hospital
    INSERT INTO emergency_request (
        patient_id,
        ambulance_id,
        destination_hospital_id,
        status,
        pickup_latitude,
        pickup_longitude
    )
    VALUES (
        p_Patient_ID,
        p_Assigned_Ambulance_ID,
        COALESCE(p_Destination_Hospital_ID, v_base_hospital_id),
        'EN_ROUTE_TO_PATIENT',
        p_Patient_Lat,
        p_Patient_Long
    );

    -- Note: In PostgreSQL 11+, stored procedures automatically commit the transaction
    -- unless explicitly rolled back or wrapped in an external transaction block.
END;
$$;


-- 1. Define the Function
CREATE OR REPLACE FUNCTION update_hospital_beds()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the status literally *just* changed to ADMITTED to prevent double-counting
    IF NEW.status = 'ADMITTED' AND OLD.status IS DISTINCT FROM 'ADMITTED' THEN
        UPDATE hospital
        SET available_er_beds = available_er_beds - 1
        WHERE hospital_id = NEW.destination_hospital_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the Trigger
CREATE TRIGGER trigger_after_ambulance_arrival
AFTER UPDATE OF status ON emergency_request
FOR EACH ROW
EXECUTE FUNCTION update_hospital_beds();


-- 1. Define the Function
CREATE OR REPLACE FUNCTION check_hospital_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_available_beds INT;
BEGIN
    -- Only check if a destination hospital is actually assigned
    IF NEW.destination_hospital_id IS NOT NULL THEN
        -- Fetch current bed count
        SELECT available_er_beds INTO v_available_beds
        FROM hospital
        WHERE hospital_id = NEW.destination_hospital_id;

        -- Hard rejection if full
        IF v_available_beds <= 0 THEN
            RAISE EXCEPTION 'Admission Denied: Hospital ID % has 0 available ER beds.', NEW.destination_hospital_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the Trigger
CREATE TRIGGER trigger_prevent_overbooking
BEFORE INSERT OR UPDATE OF destination_hospital_id ON emergency_request
FOR EACH ROW
EXECUTE FUNCTION check_hospital_capacity();

-- 1. Define the Function
CREATE OR REPLACE FUNCTION flag_equipment_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger exactly when it crosses the threshold (prevents spamming the alert table on subsequent updates)
    IF NEW.usage_hours >= 5000 AND OLD.usage_hours < 5000 THEN
        INSERT INTO maintenance_alert (equipment_id, alert_reason)
        VALUES (
            NEW.equipment_id,
            'Critical: Equipment usage reached ' || NEW.usage_hours || ' hours. Exceeded safe threshold of 5000.'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the Trigger
CREATE TRIGGER trigger_log_equipment_usage
AFTER UPDATE OF usage_hours ON equipment
FOR EACH ROW
EXECUTE FUNCTION flag_equipment_maintenance();


-- ==========================================
-- VIEWS
-- ==========================================

CREATE MATERIALIZED VIEW MV_Hospital_Efficiency AS
WITH HospitalStats AS (
    SELECT
        h.hospital_id,
        h.hospital_name,
        COUNT(e.request_id) AS total_emergencies_handled,
        -- Calculate time difference in minutes
        AVG(EXTRACT(EPOCH FROM (e.arrival_time - e.request_time)) / 60.0) AS avg_response_time_mins
    FROM hospital h
    JOIN emergency_request e ON h.hospital_id = e.destination_hospital_id
    WHERE e.status = 'ADMITTED'
      AND e.arrival_time IS NOT NULL
    GROUP BY h.hospital_id, h.hospital_name
)
SELECT
    hospital_name,
    total_emergencies_handled,
    ROUND(avg_response_time_mins::NUMERIC, 2) AS avg_response_mins,
    -- Window Function: Rank hospitals by fastest response time
    RANK() OVER (ORDER BY avg_response_time_mins ASC) AS efficiency_rank
FROM HospitalStats
WITH DATA;

-- Index the view so the Admin UI dashboard loads instantly
CREATE UNIQUE INDEX idx_mv_hosp_eff_id ON MV_Hospital_Efficiency(hospital_name);


CREATE MATERIALIZED VIEW MV_Predictive_Maintenance AS
WITH EquipmentUsageRate AS (
    SELECT
        e.equipment_id,
        a.vehicle_number,
        e.item_name,
        e.usage_hours,
        e.last_inspected,
        -- Determine daily usage rate (prevent division by zero using GREATEST)
        e.usage_hours / GREATEST(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.last_inspected)), 1) AS avg_daily_burn_rate
    FROM equipment e
    JOIN ambulance a ON e.ambulance_id = a.ambulance_id
)
SELECT
    vehicle_number,
    item_name,
    usage_hours AS current_hours,
    ROUND((usage_hours + (avg_daily_burn_rate * 7))::NUMERIC, 2) AS projected_hours_in_7_days,
    -- Flag items that will cross the 5000-hour threshold within the next week
    CASE
        WHEN (usage_hours + (avg_daily_burn_rate * 7)) >= 5000 THEN 'CRITICAL: 5000h Limit Imminent'
        ELSE 'HEALTHY'
    END AS maintenance_forecast
FROM EquipmentUsageRate
WHERE (usage_hours + (avg_daily_burn_rate * 7)) >= 4800 -- Only pull data requiring admin attention
WITH DATA;

CREATE UNIQUE INDEX idx_mv_pred_maint ON MV_Predictive_Maintenance(vehicle_number, item_name);


-- Ghost Trip View
CREATE OR REPLACE VIEW V_Ghost_Trips AS
WITH LogState AS (
    -- Step 1: Attach previous speed to current row using LAG()
    SELECT
        er.request_id,
        a.vehicle_number,
        iot.recorded_at,
        iot.speed_kmh,
        LAG(iot.speed_kmh) OVER (PARTITION BY er.request_id ORDER BY iot.recorded_at) as prev_speed
    FROM emergency_request er
    JOIN ambulance a ON er.ambulance_id = a.ambulance_id
    JOIN iot_location_log iot ON a.ambulance_id = iot.ambulance_id
    WHERE er.dispatch_time IS NOT NULL
      AND iot.recorded_at >= er.dispatch_time
      AND (er.arrival_time IS NULL OR iot.recorded_at <= er.arrival_time)
),
StationaryIslands AS (
    -- Step 2: Create a unique "Island ID" for consecutive stopped logs
    SELECT
        request_id,
        vehicle_number,
        recorded_at,
        -- Every time speed is 0 but the PREVIOUS speed was > 0, we start a new "Island" of stopped time
        SUM(CASE WHEN speed_kmh = 0 AND COALESCE(prev_speed, 1) > 0 THEN 1 ELSE 0 END)
            OVER (PARTITION BY request_id ORDER BY recorded_at) AS stop_island_id
    FROM LogState
    WHERE speed_kmh = 0
)
-- Step 3: Aggregate the islands and filter for those lasting >= 15 minutes
SELECT
    request_id,
    vehicle_number,
    MIN(recorded_at) AS stationary_start_time,
    MAX(recorded_at) AS stationary_end_time,
    ROUND((EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60.0)::NUMERIC, 2) AS stationary_duration_minutes,
    'WARNING: Ghost Trip / Unauthorized Stop Detected' AS fraud_flag
FROM StationaryIslands
GROUP BY request_id, vehicle_number, stop_island_id
HAVING (EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60.0) >= 15;
