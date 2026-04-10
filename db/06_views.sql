-- ==========================================
-- VIEWS & MATERIALIZED VIEWS
-- ==========================================

-- MV: Hospital Efficiency
DROP MATERIALIZED VIEW IF EXISTS MV_Hospital_Efficiency CASCADE;
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hosp_eff_id ON MV_Hospital_Efficiency(hospital_name);

-- MV: Predictive Maintenance
DROP MATERIALIZED VIEW IF EXISTS MV_Predictive_Maintenance CASCADE;
CREATE MATERIALIZED VIEW MV_Predictive_Maintenance AS
WITH EquipmentUsageRate AS (
    SELECT
        e.equipment_id,
        a.vehicle_number,
        e.item_name,
        e.usage_hours,
        e.last_inspected,
        e.usage_hours / GREATEST(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.last_inspected)), 1) AS avg_daily_burn_rate
    FROM equipment e
    JOIN ambulance a ON e.ambulance_id = a.ambulance_id
)
SELECT
    vehicle_number,
    item_name,
    usage_hours AS current_hours,
    ROUND((usage_hours + (avg_daily_burn_rate * 7))::NUMERIC, 2) AS projected_hours_in_7_days,
    CASE
        WHEN (usage_hours + (avg_daily_burn_rate * 7)) >= 5000 THEN 'CRITICAL: 5000h Limit Imminent'
        ELSE 'HEALTHY'
    END AS maintenance_forecast
FROM EquipmentUsageRate
WHERE (usage_hours + (avg_daily_burn_rate * 7)) >= 4800
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pred_maint ON MV_Predictive_Maintenance(vehicle_number, item_name);

-- Regular View: Ghost Trips
CREATE OR REPLACE VIEW V_Ghost_Trips AS
WITH LogState AS (
    SELECT
        er.request_id,
        a.vehicle_number,
        iot.recorded_at,
        iot.speed_kmh,
        LAG(iot.speed_kmh) OVER (PARTITION BY er.request_id ORDER BY iot.recorded_at) AS prev_speed
    FROM emergency_request er
    JOIN ambulance a ON er.ambulance_id = a.ambulance_id
    JOIN iot_location_log iot ON a.ambulance_id = iot.ambulance_id
    WHERE er.dispatch_time IS NOT NULL AND iot.recorded_at >= er.dispatch_time
      AND (er.arrival_time IS NULL OR iot.recorded_at <= er.arrival_time)
),
StationaryIslands AS (
    SELECT
        request_id, vehicle_number, recorded_at,
        SUM(CASE WHEN speed_kmh = 0 AND COALESCE(prev_speed, 1) > 0 THEN 1 ELSE 0 END) OVER (PARTITION BY request_id ORDER BY recorded_at) AS stop_island_id
    FROM LogState WHERE speed_kmh = 0
)
SELECT
    request_id, vehicle_number,
    MIN(recorded_at) AS stationary_start_time,
    MAX(recorded_at) AS stationary_end_time,
    ROUND((EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60.0)::NUMERIC, 2) AS stationary_duration_minutes,
    'WARNING: Ghost Trip / Unauthorized Stop Detected' AS fraud_flag
FROM StationaryIslands
GROUP BY request_id, vehicle_number, stop_island_id
HAVING (EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60.0) >= 15;

-- Scheduling (CRON) - Disabled as pg_cron is not available
-- SELECT cron.schedule('refresh-hospital-efficiency', '0 * * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY MV_Hospital_Efficiency;$$);
-- SELECT cron.schedule('refresh-predictive-maintenance', '0 2 * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY MV_Predictive_Maintenance;$$);