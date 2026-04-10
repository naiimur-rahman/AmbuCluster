-- ==========================================
-- INITIAL SEED DATA
-- ==========================================

-- 1. Seed Staff
INSERT INTO staff (staff_id, first_name, last_name, role, email, phone_number) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Rahim', 'Uddin', 'driver', 'rahim@example.com', '01711000001'),
    ('11111111-1111-1111-1111-111111111112', 'Fatima', 'Begum', 'paramedic', 'fatima@example.com', '01711000002'),
    ('11111111-1111-1111-1111-111111111113', 'Abdul', 'Karim', 'driver', 'abdul@example.com', '01711000003'),
    ('11111111-1111-1111-1111-111111111114', 'Shorif', 'Ahmed', 'driver', 'shorif@example.com', '01711000004'),
    ('11111111-1111-1111-1111-111111111115', 'Mizanur', 'Rahman', 'driver', 'mizanur@example.com', '01711000005')
ON CONFLICT DO NOTHING;

-- 2. Seed Hospitals
INSERT INTO hospital (hospital_id, hospital_name, contact_number, latitude, longitude, total_er_beds, available_er_beds, available_icu_beds, available_maternity_beds, specialties) VALUES 
    ('22222222-2222-2222-2222-222222222222', 'Dhaka Medical College Hospital (DMCH)', '02-555-HOSP', 23.7260, 90.3976, 150, 12, 5, 3, '["Trauma", "Burn", "Cardiac"]'),
    ('22222222-2222-2222-2222-222222222223', 'Square Hospital', '02-555-SQUR', 23.7528, 90.3815, 80, 5, 2, 4, '["Cardiac", "Neurology"]'),
    ('22222222-2222-2222-2222-222222222224', 'Evercare Hospital Dhaka', '02-555-EVER', 23.8103, 90.4313, 100, 15, 8, 5, '["Cardiac", "Oncology", "Trauma"]'),
    ('22222222-2222-2222-2222-222222222225', 'United Hospital', '02-555-UNIT', 23.8048, 90.4156, 90, 8, 4, 2, '["Cardiac", "Neurology"]'),
    ('22222222-2222-2222-2222-222222222226', 'Labaid Specialized Hospital', '02-555-LABA', 23.7417, 90.3833, 60, 2, 1, 1, '["Cardiac"]')
ON CONFLICT DO NOTHING;

-- 3. Seed Ambulances
INSERT INTO ambulance (ambulance_id, vehicle_number, ambulance_type, status, driver_id, paramedic_id, base_hospital_id, current_latitude, current_longitude, last_maintenance_date) VALUES 
    ('33333333-3333-3333-3333-333333333331', 'Dhaka Metro Cha-11-2233', 'ALS', 'AVAILABLE', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 23.7940, 90.4125, '2024-03-15'),
    ('33333333-3333-3333-3333-333333333332', 'Dhaka Metro Cha-44-5566', 'BLS', 'DISPATCHED', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 23.7461, 90.3742, '2024-03-10'),
    ('33333333-3333-3333-3333-333333333333', 'Dhaka Metro Cha-22-1111', 'ALS', 'AVAILABLE', '11111111-1111-1111-1111-111111111113', NULL, '22222222-2222-2222-2222-222222222223', 23.7528, 90.3815, '2024-04-01'),
    ('33333333-3333-3333-3333-333333333334', 'Dhaka Metro Cha-33-2222', 'BLS', 'AVAILABLE', '11111111-1111-1111-1111-111111111114', NULL, '22222222-2222-2222-2222-222222222224', 23.8103, 90.4313, '2024-02-20'),
    ('33333333-3333-3333-3333-333333333335', 'Dhaka Metro Cha-55-3333', 'ALS', 'AVAILABLE', '11111111-1111-1111-1111-111111111115', NULL, '22222222-2222-2222-2222-222222222226', 23.7260, 90.3976, '2024-03-05')
ON CONFLICT DO NOTHING;

-- 4. Seed Patient
INSERT INTO patient (patient_id, full_name, phone_number, clinical_notes) VALUES 
    ('44444444-4444-4444-4444-444444444444', 'Kamal Hossain', '01711223344', '{"allergies": ["Penicillin"], "conditions": ["Asthma"]}')
ON CONFLICT DO NOTHING;

-- 5. Seed Emergency Request
INSERT INTO emergency_request (request_id, patient_id, ambulance_id, destination_hospital_id, status, pickup_latitude, pickup_longitude) VALUES 
    ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'EN_ROUTE_TO_PATIENT', 23.7936, 90.4066)
ON CONFLICT DO NOTHING;

-- 6. Seed Clusters
INSERT INTO clusters (id, name, lat, lng, radius, "ambulanceIds", "coverageScore") VALUES 
    ('CL-1', 'Gulshan-Banani', 23.7940, 90.4125, 3.0, '["33333333-3333-3333-3333-333333333331"]', 90)
ON CONFLICT DO NOTHING;