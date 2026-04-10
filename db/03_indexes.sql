-- ==========================================
-- INDEXES FOR READ OPTIMIZATION
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_ambulance_status        ON ambulance(status);
CREATE INDEX IF NOT EXISTS idx_emergency_status        ON emergency_request(status);
CREATE INDEX IF NOT EXISTS idx_emergency_hospital      ON emergency_request(destination_hospital_id);
CREATE INDEX IF NOT EXISTS idx_equipment_ambulance     ON equipment(ambulance_id);
CREATE INDEX IF NOT EXISTS idx_iot_log_time            ON iot_location_log(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_iot_log_ambulance_time  ON iot_location_log(ambulance_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_clinical_notes ON patient USING GIN (clinical_notes);