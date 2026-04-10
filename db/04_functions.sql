-- ==========================================
-- STORED PROCEDURES & TRIGGERS FUNCTIONS
-- ==========================================

-- Procedure: Assign the nearest available ambulance
CREATE OR REPLACE PROCEDURE SP_Assign_Nearest_Ambulance(
    IN  p_Patient_ID              UUID,
    IN  p_Patient_Lat             NUMERIC,
    IN  p_Patient_Long            NUMERIC,
    IN  p_Destination_Hospital_ID UUID,
    IN  p_Dispatched_By           UUID,
    IN  p_Emergency_Type          VARCHAR(50),
    IN  p_Estimated_Fare          DECIMAL(10, 2),
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
    IF p_Emergency_Type = 'Cardiac' OR p_Emergency_Type = 'Trauma' THEN
        v_required_type := 'ALS';
    ELSE
        v_required_type := 'BLS';
    END IF;

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
      AND (ambulance_type = v_required_type OR ambulance_type = 'ALS')
    ORDER BY
        ST_MakePoint(current_longitude::FLOAT, current_latitude::FLOAT)::GEOGRAPHY
        <->
        ST_MakePoint(p_Patient_Long::FLOAT, p_Patient_Lat::FLOAT)::GEOGRAPHY
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF p_Assigned_Ambulance_ID IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: No available % ambulances at this moment.', v_required_type;
    END IF;

    p_ETA_Minutes := CEIL(v_distance_meters / 666.0);

    UPDATE ambulance SET status = 'DISPATCHED' WHERE ambulance_id = p_Assigned_Ambulance_ID;

    INSERT INTO emergency_request (
        patient_id, ambulance_id, destination_hospital_id, dispatched_by, status,
        pickup_latitude, pickup_longitude, dispatch_time, estimated_fare
    )
    VALUES (
        p_Patient_ID, p_Assigned_Ambulance_ID, COALESCE(p_Destination_Hospital_ID, v_base_hospital_id),
        p_Dispatched_By, 'EN_ROUTE_TO_PATIENT', p_Patient_Lat, p_Patient_Long, CURRENT_TIMESTAMP, p_Estimated_Fare
    );
END;
$$;

-- Function: update_hospital_beds
CREATE OR REPLACE FUNCTION update_hospital_beds()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ADMITTED' AND OLD.status IS DISTINCT FROM 'ADMITTED' THEN
        UPDATE hospital SET available_er_beds = available_er_beds - 1 WHERE hospital_id = NEW.destination_hospital_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: check_hospital_capacity
CREATE OR REPLACE FUNCTION check_hospital_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_available_beds INT;
BEGIN
    IF NEW.destination_hospital_id IS NOT NULL THEN
        SELECT available_er_beds INTO v_available_beds FROM hospital WHERE hospital_id = NEW.destination_hospital_id;
        IF v_available_beds <= 0 THEN
            RAISE EXCEPTION 'Admission Denied: Hospital ID % has 0 available ER beds.', NEW.destination_hospital_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: flag_equipment_maintenance
CREATE OR REPLACE FUNCTION flag_equipment_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usage_hours >= 5000 AND OLD.usage_hours < 5000 THEN
        INSERT INTO maintenance_alert (equipment_id, alert_reason)
        VALUES (NEW.equipment_id, 'Critical: Equipment usage reached ' || NEW.usage_hours || ' hours. Exceeded safe threshold of 5000.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;