-- ==========================================
-- TRIGGER DEFINITIONS
-- ==========================================

-- Trigger: decrement beds after ambulance arrival (admission)
DROP TRIGGER IF EXISTS trigger_after_ambulance_arrival ON emergency_request;
CREATE TRIGGER trigger_after_ambulance_arrival
AFTER UPDATE OF status ON emergency_request
FOR EACH ROW
EXECUTE FUNCTION update_hospital_beds();

-- Trigger: prevent overbooking for hospitals with no beds
DROP TRIGGER IF EXISTS trigger_prevent_overbooking ON emergency_request;
CREATE TRIGGER trigger_prevent_overbooking
BEFORE INSERT OR UPDATE OF destination_hospital_id ON emergency_request
FOR EACH ROW
EXECUTE FUNCTION check_hospital_capacity();

-- Trigger: alert for equipment maintenance
DROP TRIGGER IF EXISTS trigger_log_equipment_usage ON equipment;
CREATE TRIGGER trigger_log_equipment_usage
AFTER UPDATE OF usage_hours ON equipment
FOR EACH ROW
EXECUTE FUNCTION flag_equipment_maintenance();