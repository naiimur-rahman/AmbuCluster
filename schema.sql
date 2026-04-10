-- Enable UUID generation and PostGIS for geographical operations
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";  -- Required for scheduled MV refresh


-- ==========================================
-- TABLE DEFINITIONS
-- ==========================================

-- 1. Staff Table
CREATE TABLE staff (
    staff_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone_number  VARCHAR(20)  UNIQUE NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patient Table
-- clinical_notes must be a JSON object (not array/scalar) and must
-- contain at least an "allergies" key (array) and a "conditions" key (array).
-- This prevents completely free-form blobs from landing in the table.
CREATE TABLE patient (
    patient_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         VARCHAR(200) NOT NULL,
    phone_number      VARCHAR(20)  UNIQUE NOT NULL,
    date_of_birth     DATE,
    blood_group       VARCHAR(5),
    emergency_contact VARCHAR(20),
    clinical_notes    JSONB,
    created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,

    -- JSONB schema validation:
    --   - Must be a JSON object (jsonb_typeof = 'object')
    --   - Must contain 'allergies' key whose value is an array
    --   - Must contain 'conditions' key whose value is an array
    --   - NULL is allowed (field is optional)
    CONSTRAINT chk_clinical_notes_structure CHECK (
        clinical_notes IS NULL
        OR (
            jsonb_typeof(clinical_notes) = 'object'
            AND jsonb_typeof(clinical_notes -> 'allergies')  = 'array'
            AND jsonb_typeof(clinical_notes -> 'conditions') = 'array'
        )
    )
);

-- 3. Hospital Table
CREATE TABLE hospital (
    hospital_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_name     VARCHAR(255) NOT NULL,
    contact_number    VARCHAR(20)  NOT NULL,
    latitude          NUMERIC(10, 8) NOT NULL,
    longitude         NUMERIC(11, 8) NOT NULL,
    total_er_beds     INT NOT NULL DEFAULT 0,
    available_er_beds INT NOT NULL DEFAULT 0,
    available_icu_beds INT NOT NULL DEFAULT 0,
    available_maternity_beds INT NOT NULL DEFAULT 0,
    specialties       JSONB,

    -- Hard floor: available beds can never go below zero.
    -- The trigger_prevent_overbooking trigger is the first line of defense,
    -- but this constraint is the guaranteed last line — it fires even if
    -- someone bypasses the trigger with a direct UPDATE.
    CONSTRAINT chk_er_beds_non_negative  CHECK (available_er_beds >= 0),
    CONSTRAINT chk_er_beds_within_total  CHECK (available_er_beds <= total_er_beds)
);

-- 4. Ambulance Table
CREATE TABLE ambulance (
    ambulance_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number        VARCHAR(50) UNIQUE NOT NULL,
    ambulance_type        VARCHAR(20) DEFAULT 'BLS',
    status                VARCHAR(50) DEFAULT 'AVAILABLE',
    driver_id             UUID REFERENCES staff(staff_id)    ON DELETE SET NULL,
    paramedic_id          UUID REFERENCES staff(staff_id)    ON DELETE SET NULL,
    base_hospital_id      UUID REFERENCES hospital(hospital_id) ON DELETE SET NULL,
    current_latitude      NUMERIC(10, 8),
    current_longitude     NUMERIC(11, 8),
    last_maintenance_date DATE
);

-- 5. Equipment Table
CREATE TABLE equipment (
    equipment_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id    UUID NOT NULL REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    item_name       VARCHAR(100) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    expiration_date DATE,
    last_inspected  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usage_hours     INT DEFAULT 0
);

-- 6. Emergency_Request Table
CREATE TABLE emergency_request (
    request_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patient(patient_id)   ON DELETE RESTRICT,
    ambulance_id            UUID REFERENCES ambulance(ambulance_id)        ON DELETE SET NULL,
    destination_hospital_id UUID REFERENCES hospital(hospital_id)         ON DELETE RESTRICT,
    dispatched_by           UUID REFERENCES staff(staff_id)               ON DELETE SET NULL,
    status                  VARCHAR(50) DEFAULT 'PENDING',
    pickup_latitude         NUMERIC(10, 8) NOT NULL,
    pickup_longitude        NUMERIC(11, 8) NOT NULL,
    request_time            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    dispatch_time           TIMESTAMPTZ,
    on_scene_time           TIMESTAMPTZ,
    depart_scene_time       TIMESTAMPTZ,
    hospital_arrival_time   TIMESTAMPTZ,
    completion_time         TIMESTAMPTZ,
    arrival_time            TIMESTAMPTZ,
    estimated_fare          DECIMAL(10, 2),
    actual_fare             DECIMAL(10, 2),
    payment_status          VARCHAR(20) DEFAULT 'PENDING',
    actual_route            GEOMETRY(LineString, 4326)
);

-- 6.5 Staff Shift Table
CREATE TABLE staff_shift (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(staff_id),
    ambulance_id UUID REFERENCES ambulance(ambulance_id),
    shift_start TIMESTAMPTZ NOT NULL,
    shift_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED'
);

-- 7. IoT_Location_Log Table (Partitioned)
CREATE TABLE iot_location_log (
    log_id       BIGSERIAL,
    ambulance_id UUID NOT NULL,
    latitude     NUMERIC(10, 8) NOT NULL,
    longitude    NUMERIC(11, 8) NOT NULL,
    speed_kmh    NUMERIC(5, 2),
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id, recorded_at),
    CONSTRAINT fk_ambulance FOREIGN KEY (ambulance_id)
        REFERENCES ambulance(ambulance_id) ON DELETE CASCADE
) PARTITION BY RANGE (recorded_at);

CREATE TABLE iot_location_log_past      PARTITION OF iot_location_log
    FOR VALUES FROM ('2020-01-01 00:00:00+06') TO ('2026-04-01 00:00:00+06');
CREATE TABLE iot_location_log_2026_04   PARTITION OF iot_location_log
    FOR VALUES FROM ('2026-04-01 00:00:00+06') TO ('2026-05-01 00:00:00+06');
CREATE TABLE iot_location_log_2026_05   PARTITION OF iot_location_log
    FOR VALUES FROM ('2026-05-01 00:00:00+06') TO ('2026-06-01 00:00:00+06');
CREATE TABLE iot_location_log_future    PARTITION OF iot_location_log
    FOR VALUES FROM ('2026-06-01 00:00:00+06') TO ('2100-01-01 00:00:00+06');

-- 8. Maintenance Alert Table
CREATE TABLE maintenance_alert (
    alert_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    alert_reason TEXT NOT NULL,
    alert_time   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_resolved  BOOLEAN DEFAULT FALSE,
    resolved_by  UUID REFERENCES staff(staff_id) ON DELETE SET NULL
);

-- 9. Vehicle Maintenance Log Table
CREATE TABLE vehicle_maintenance_log (
    log_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id      UUID REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    service_date      DATE NOT NULL,
    cost              DECIMAL(10, 2) NOT NULL
);

-- ==========================================
-- INDEXES FOR READ OPTIMIZATION
-- ==========================================

CREATE INDEX idx_ambulance_status        ON ambulance(status);
CREATE INDEX idx_emergency_status        ON emergency_request(status);
CREATE INDEX idx_emergency_hospital      ON emergency_request(destination_hospital_id);
CREATE INDEX idx_equipment_ambulance     ON equipment(ambulance_id);
CREATE INDEX idx_iot_log_time            ON iot_location_log(recorded_at DESC);
CREATE INDEX idx_iot_log_ambulance_time  ON iot_location_log(ambulance_id, recorded_at DESC);

-- GIN index for JSONB containment queries on clinical_notes.
-- Enables fast @> operator lookups, e.g.:
--   SELECT * FROM patient WHERE clinical_notes -> 'allergies' @> '"Penicillin"';
-- Without this, that query does a sequential scan across the entire patient table.
CREATE INDEX idx_patient_clinical_notes ON patient USING GIN (clinical_notes);


-- ==========================================
-- STORED PROCEDURES & TRIGGERS
-- ==========================================

-- Added p_Dispatched_By parameter so the dispatcher's identity
-- is recorded in emergency_request.dispatched_by (was always NULL before).
CREATE OR REPLACE PROCEDURE SP_Assign_Nearest_Ambulance(
    IN  p_Patient_ID              UUID,
    IN  p_Patient_Lat             NUMERIC,
    IN  p_Patient_Long            NUMERIC,
    IN  p_Destination_Hospital_ID UUID,   -- Can be NULL; falls back to ambulance's base hospital
    IN  p_Dispatched_By           UUID,   -- Staff member initiating the dispatch
    IN  p_Emergency_Type          VARCHAR(50), -- New parameter to filter by type
    IN  p_Estimated_Fare          DECIMAL(10, 2), -- New parameter for fare
    OUT p_Assigned_Ambulance_ID   UUID,
    OUT p_ETA_Minutes             INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_distance_meters FLOAT;
    v_base_hospital_id UUID;
    v_required_type VARCHAR(20);
BEGIN
    -- Determine required ambulance type
    IF p_Emergency_Type = 'Cardiac' OR p_Emergency_Type = 'Trauma' THEN
        v_required_type := 'ALS';
    ELSE
        v_required_type := 'BLS';
    END IF;

    -- 1. Find the nearest available ambulance and LOCK it to prevent double-dispatching.
    --    PostGIS <-> operator returns distance in metres on the GEOGRAPHY (spheroid) model,
    --    so results are accurate even across large distances.
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
      AND (ambulance_type = v_required_type OR ambulance_type = 'ALS') -- ALS can handle BLS calls
    ORDER BY
        ST_MakePoint(current_longitude::FLOAT, current_latitude::FLOAT)::GEOGRAPHY
        <->
        ST_MakePoint(p_Patient_Long::FLOAT, p_Patient_Lat::FLOAT)::GEOGRAPHY
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- 2. Edge case: no ambulances available
    IF p_Assigned_Ambulance_ID IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: No available % ambulances at this moment.', v_required_type;
    END IF;

    -- 3. ETA calculation
    p_ETA_Minutes := CEIL(v_distance_meters / 666.0);

    -- 4. Mark ambulance as dispatched
    UPDATE ambulance
    SET status = 'DISPATCHED'
    WHERE ambulance_id = p_Assigned_Ambulance_ID;

    -- 5. Create the emergency request record
    INSERT INTO emergency_request (
        patient_id,
        ambulance_id,
        destination_hospital_id,
        dispatched_by,
        status,
        pickup_latitude,
        pickup_longitude,
        dispatch_time,
        estimated_fare
    )
    VALUES (
        p_Patient_ID,
        p_Assigned_Ambulance_ID,
        COALESCE(p_Destination_Hospital_ID, v_base_hospital_id),
        p_Dispatched_By,
        'EN_ROUTE_TO_PATIENT',
        p_Patient_Lat,
        p_Patient_Long,
        CURRENT_TIMESTAMP,
        p_Estimated_Fare
    );
END;
$$;


-- Trigger: decrement available_er_beds when a patient is admitted
CREATE OR REPLACE FUNCTION update_hospital_beds()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ADMITTED' AND OLD.status IS DISTINCT FROM 'ADMITTED' THEN
        UPDATE hospital
        SET available_er_beds = available_er_beds - 1
        WHERE hospital_id = NEW.destination_hospital_id;
        -- Note: the CHECK (available_er_beds >= 0) constraint on hospital
        -- will raise an error here if the decrement would go below zero,
        -- providing a hard safety net beyond trigger_prevent_overbooking.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_ambulance_arrival
AFTER UPDATE OF status ON emergency_request
FOR EACH ROW
EXECUTE FUNCTION update_hospital_beds();


-- Trigger: reject requests to full hospitals
CREATE OR REPLACE FUNCTION check_hospital_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_available_beds INT;
BEGIN
    IF NEW.destination_hospital_id IS NOT NULL THEN
        SELECT available_er_beds INTO v_available_beds
        FROM hospital
        WHERE hospital_id = NEW.destination_hospital_id;

        IF v_available_beds <= 0 THEN
            RAISE EXCEPTION 'Admission Denied: Hospital ID % has 0 available ER beds.',
                NEW.destination_hospital_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_overbooking
BEFORE INSERT OR UPDATE OF destination_hospital_id ON emergency_request
FOR EACH ROW
EXECUTE FUNCTION check_hospital_capacity();


-- Trigger: raise a maintenance alert when equipment crosses 5000 usage hours
CREATE OR REPLACE FUNCTION flag_equipment_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usage_hours >= 5000 AND OLD.usage_hours < 5000 THEN
        INSERT INTO maintenance_alert (equipment_id, alert_reason)
        VALUES (
            NEW.equipment_id,
            'Critical: Equipment usage reached ' || NEW.usage_hours ||
            ' hours. Exceeded safe threshold of 5000.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    RANK() OVER (ORDER BY avg_response_time_mins ASC) AS efficiency_rank
FROM HospitalStats
WITH DATA;

CREATE UNIQUE INDEX idx_mv_hosp_eff_id ON MV_Hospital_Efficiency(hospital_name);


CREATE MATERIALIZED VIEW MV_Predictive_Maintenance AS
WITH EquipmentUsageRate AS (
    SELECT
        e.equipment_id,
        a.vehicle_number,
        e.item_name,
        e.usage_hours,
        e.last_inspected,
        e.usage_hours / GREATEST(
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.last_inspected)), 1
        ) AS avg_daily_burn_rate
    FROM equipment e
    JOIN ambulance a ON e.ambulance_id = a.ambulance_id
)
SELECT
    vehicle_number,
    item_name,
    usage_hours AS current_hours,
    ROUND((usage_hours + (avg_daily_burn_rate * 7))::NUMERIC, 2) AS projected_hours_in_7_days,
    CASE
        WHEN (usage_hours + (avg_daily_burn_rate * 7)) >= 5000
            THEN 'CRITICAL: 5000h Limit Imminent'
        ELSE 'HEALTHY'
    END AS maintenance_forecast
FROM EquipmentUsageRate
WHERE (usage_hours + (avg_daily_burn_rate * 7)) >= 4800
WITH DATA;

CREATE UNIQUE INDEX idx_mv_pred_maint ON MV_Predictive_Maintenance(vehicle_number, item_name);


-- MATERIALIZED VIEW REFRESH STRATEGY via pg_cron
-- Both MVs are refreshed on a fixed schedule so they never silently go stale.
--
-- MV_Hospital_Efficiency  — refreshed every hour.
--   Rationale: hospital response-time rankings change with each completed trip,
--   but sub-hour staleness is acceptable for an admin dashboard.
--
-- MV_Predictive_Maintenance — refreshed once per day at 02:00 local time.
--   Rationale: burn-rate projections are based on day-level averages; refreshing
--   more often adds no analytical value and wastes I/O on a potentially large
--   equipment table.
--
-- CONCURRENTLY means active readers are never blocked during the refresh.
-- Requires the unique indexes defined above (idx_mv_hosp_eff_id, idx_mv_pred_maint).

SELECT cron.schedule(
    'refresh-hospital-efficiency',          -- job name (must be unique)
    '0 * * * *',                            -- every hour, on the hour
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY MV_Hospital_Efficiency;$$
);

SELECT cron.schedule(
    'refresh-predictive-maintenance',
    '0 2 * * *',                            -- daily at 02:00
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY MV_Predictive_Maintenance;$$
);


-- Ghost Trip View
CREATE OR REPLACE VIEW V_Ghost_Trips AS
WITH LogState AS (
    SELECT
        er.request_id,
        a.vehicle_number,
        iot.recorded_at,
        iot.speed_kmh,
        LAG(iot.speed_kmh) OVER (
            PARTITION BY er.request_id ORDER BY iot.recorded_at
        ) AS prev_speed
    FROM emergency_request er
    JOIN ambulance a ON er.ambulance_id = a.ambulance_id
    JOIN iot_location_log iot ON a.ambulance_id = iot.ambulance_id
    WHERE er.dispatch_time IS NOT NULL
      AND iot.recorded_at >= er.dispatch_time
      AND (er.arrival_time IS NULL OR iot.recorded_at <= er.arrival_time)
),
StationaryIslands AS (
    SELECT
        request_id,
        vehicle_number,
        recorded_at,
        SUM(
            CASE WHEN speed_kmh = 0 AND COALESCE(prev_speed, 1) > 0 THEN 1 ELSE 0 END
        ) OVER (PARTITION BY request_id ORDER BY recorded_at) AS stop_island_id
    FROM LogState
    WHERE speed_kmh = 0
)
SELECT
    request_id,
    vehicle_number,
    MIN(recorded_at)  AS stationary_start_time,
    MAX(recorded_at)  AS stationary_end_time,
    ROUND(
        (EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60.0)::NUMERIC, 2
    ) AS stationary_duration_minutes,
    'WARNING: Ghost Trip / Unauthorized Stop Detected' AS fraud_flag
FROM StationaryIslands
GROUP BY request_id, vehicle_number, stop_island_id
HAVING (EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60.0) >= 15;


-- ==========================================
-- ROLE-BASED ACCESS CONTROL
-- ==========================================
--
-- Three roles with strictly least-privilege permissions:
--
--   dispatcher  — call-centre staff who create requests and read patient/ambulance data.
--                 Can NOT directly modify hospital bed counts or read audit logs.
--
--   paramedic   — field staff who update request status and log IoT locations.
--                 Read-only on patients and hospitals; no access to financial tables.
--
--   admin       — operations managers who can read everything and manage maintenance.
--                 Cannot DROP tables or ALTER schema (that stays with the DBA login).
--
-- In production, create a dedicated application DB user per role and connect with
-- that user from the relevant service (e.g. the dispatcher API, the ambulance IoT agent).

-- Create roles (IF NOT EXISTS guard makes this re-runnable)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dispatcher') THEN
        CREATE ROLE dispatcher NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'paramedic') THEN
        CREATE ROLE paramedic NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_ops') THEN
        CREATE ROLE admin_ops NOLOGIN;
    END IF;
END
$$;

-- dispatcher: create & read requests, read patients/ambulances/hospitals
GRANT SELECT, INSERT                        ON emergency_request          TO dispatcher;
GRANT SELECT                                ON patient                     TO dispatcher;
GRANT SELECT                                ON ambulance                   TO dispatcher;
GRANT SELECT                                ON hospital                    TO dispatcher;
GRANT SELECT                                ON staff                       TO dispatcher;
GRANT EXECUTE ON PROCEDURE SP_Assign_Nearest_Ambulance(
    UUID, NUMERIC, NUMERIC, UUID, UUID
)                                           TO dispatcher;

-- paramedic: update request status, append IoT logs, read their own equipment
GRANT SELECT, UPDATE                        ON emergency_request           TO paramedic;
GRANT SELECT, INSERT                        ON iot_location_log            TO paramedic;
GRANT SELECT                                ON equipment                   TO paramedic;
GRANT SELECT                                ON patient                     TO paramedic;
GRANT SELECT                                ON hospital                    TO paramedic;

-- admin_ops: full read across all tables + manage maintenance records
GRANT SELECT                                ON ALL TABLES IN SCHEMA public TO admin_ops;
GRANT INSERT, UPDATE, DELETE                ON maintenance_alert           TO admin_ops;
GRANT INSERT, UPDATE, DELETE                ON vehicle_maintenance_log     TO admin_ops;
GRANT UPDATE (available_er_beds,
              total_er_beds)                ON hospital                    TO admin_ops;

-- Allow roles to use sequences (needed for BIGSERIAL inserts on iot_location_log)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO paramedic;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dispatcher;

-- 10. Clusters Table (for frontend compatibility)
CREATE TABLE IF NOT EXISTS clusters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lat NUMERIC(10, 8) NOT NULL,
    lng NUMERIC(11, 8) NOT NULL,
    radius NUMERIC(10, 2) NOT NULL,
    "ambulanceIds" JSONB NOT NULL,
    "coverageScore" INT NOT NULL
);