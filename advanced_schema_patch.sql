-- advanced_schema_patch.sql

-- 1. Create System Admin Role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('patient', 'hospital', 'driver', 'sysadmin'));

INSERT INTO users (name, email, role, phone, password_hash)
VALUES ('System Admin', 'admin@ambucluster.com', 'sysadmin', '01711000001', 'hashed_pw')
ON CONFLICT DO NOTHING;

-- 2. Audit Logging Table
CREATE TABLE IF NOT EXISTS emergency_audit_log (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PL/pgSQL Trigger Function for Audit Logging
CREATE OR REPLACE FUNCTION log_emergency_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO emergency_audit_log(request_id, old_status, new_status)
        VALUES (OLD.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach Trigger to emergency_requests
DROP TRIGGER IF EXISTS emergency_status_trigger ON emergency_requests;
CREATE TRIGGER emergency_status_trigger
AFTER UPDATE ON emergency_requests
FOR EACH ROW
EXECUTE FUNCTION log_emergency_status_change();


-- 4. Native Haversine Distance Function (PL/pgSQL)
CREATE OR REPLACE FUNCTION calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
    x numeric = 69.1 * (lat2 - lat1);
    y numeric = 69.1 * (lon2 - lon1) * cos(lat1 / 57.3);
BEGIN
    -- Returns distance in miles approximately, multiplying by 1.60934 to get KM
    RETURN sqrt(x * x + y * y) * 1.60934;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- 5. Complex View utilizing Window Functions and Aggregations
-- Ranks hospitals based on how many emergencies they have handled
CREATE OR REPLACE VIEW hospital_analytics AS
SELECT
    h.id,
    h.name,
    h.type,
    h.total_beds,
    h.available_beds,
    COUNT(er.id) as total_emergencies_handled,
    RANK() OVER (ORDER BY COUNT(er.id) DESC) as demand_rank,
    CASE
        WHEN h.total_beds = 0 THEN 0
        ELSE ROUND((CAST((h.total_beds - h.available_beds) AS numeric) / h.total_beds) * 100, 2)
    END as occupancy_rate_percent
FROM hospitals h
LEFT JOIN emergency_requests er ON h.id = er.hospital_id AND er.status IN ('en_route_hospital', 'completed')
GROUP BY h.id, h.name, h.type, h.total_beds, h.available_beds;
