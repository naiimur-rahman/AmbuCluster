-- ==========================================
-- TABLE DEFINITIONS
-- ==========================================

-- 1. Staff Table
CREATE TABLE IF NOT EXISTS staff (
    staff_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone_number  VARCHAR(20)  UNIQUE NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patient Table
CREATE TABLE IF NOT EXISTS patient (
    patient_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name         VARCHAR(200) NOT NULL,
    phone_number      VARCHAR(20)  UNIQUE NOT NULL,
    date_of_birth     DATE,
    blood_group       VARCHAR(5),
    emergency_contact VARCHAR(20),
    clinical_notes    JSONB,
    created_at        TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,

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
CREATE TABLE IF NOT EXISTS hospital (
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

    CONSTRAINT chk_er_beds_non_negative  CHECK (available_er_beds >= 0),
    CONSTRAINT chk_er_beds_within_total  CHECK (available_er_beds <= total_er_beds)
);

-- 4. Ambulance Table
CREATE TABLE IF NOT EXISTS ambulance (
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
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id    UUID NOT NULL REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    item_name       VARCHAR(100) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    expiration_date DATE,
    last_inspected  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    usage_hours     INT DEFAULT 0
);

-- 6. Emergency_Request Table
CREATE TABLE IF NOT EXISTS emergency_request (
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

-- Staff Shift Table
CREATE TABLE IF NOT EXISTS staff_shift (
    shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(staff_id),
    ambulance_id UUID REFERENCES ambulance(ambulance_id),
    shift_start TIMESTAMPTZ NOT NULL,
    shift_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED'
);

-- IoT_Location_Log Table (Partitioned)
CREATE TABLE IF NOT EXISTS iot_location_log (
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

-- Partitions (Re-runnable)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'iot_location_log_past') THEN
        CREATE TABLE iot_location_log_past PARTITION OF iot_location_log FOR VALUES FROM ('2020-01-01 00:00:00+06') TO ('2026-04-01 00:00:00+06');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'iot_location_log_2026_04') THEN
        CREATE TABLE iot_location_log_2026_04 PARTITION OF iot_location_log FOR VALUES FROM ('2026-04-01 00:00:00+06') TO ('2026-05-01 00:00:00+06');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'iot_location_log_2026_05') THEN
        CREATE TABLE iot_location_log_2026_05 PARTITION OF iot_location_log FOR VALUES FROM ('2026-05-01 00:00:00+06') TO ('2026-06-01 00:00:00+06');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'iot_location_log_future') THEN
        CREATE TABLE iot_location_log_future PARTITION OF iot_location_log FOR VALUES FROM ('2026-06-01 00:00:00+06') TO ('2100-01-01 00:00:00+06');
    END IF;
END
$$;

-- Maintenance Alert Table
CREATE TABLE IF NOT EXISTS maintenance_alert (
    alert_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipment(equipment_id) ON DELETE CASCADE,
    alert_reason TEXT NOT NULL,
    alert_time   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_resolved  BOOLEAN DEFAULT FALSE,
    resolved_by  UUID REFERENCES staff(staff_id) ON DELETE SET NULL
);

-- Vehicle Maintenance Log Table
CREATE TABLE IF NOT EXISTS vehicle_maintenance_log (
    log_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id      UUID REFERENCES ambulance(ambulance_id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    service_date      DATE NOT NULL,
    cost              DECIMAL(10, 2) NOT NULL
);

-- Clusters Table
CREATE TABLE IF NOT EXISTS clusters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    lat NUMERIC(10, 8) NOT NULL,
    lng NUMERIC(11, 8) NOT NULL,
    radius NUMERIC(10, 2) NOT NULL,
    "ambulanceIds" JSONB NOT NULL,
    "coverageScore" INT NOT NULL
);