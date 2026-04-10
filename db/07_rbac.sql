-- ==========================================
-- ROLE-BASED ACCESS CONTROL
-- ==========================================

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
GRANT EXECUTE ON PROCEDURE SP_Assign_Nearest_Ambulance(UUID, NUMERIC, NUMERIC, UUID, UUID, VARCHAR, DECIMAL) TO dispatcher;

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
GRANT UPDATE (available_er_beds, total_er_beds) ON hospital                TO admin_ops;

-- Allow roles to use sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO paramedic;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dispatcher;