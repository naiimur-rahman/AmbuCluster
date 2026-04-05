-- Create demo users for each role
-- Password '1234' hash using a dummy hash for now, assuming plain text comparison or basic hashing in backend. We'll use just the string '1234' for simplicity.

INSERT INTO Users (user_id, name, phone, email, password_hash, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Test Patient', '1234567890', 'patient@ambucluster.com', '1234', 'Patient'),
('22222222-2222-2222-2222-222222222222', 'Test Driver', '0987654321', 'driver1@ambulance.bd', '1234', 'Driver'),
('33333333-3333-3333-3333-333333333333', 'Test Hospital', '1122334455', 'admin0@hospital.bd', '1234', 'Hospital'),
('44444444-4444-4444-4444-444444444444', 'Test Admin', '5544332211', 'admin@ambucluster.com', '1234', 'Admin');

INSERT INTO Hospitals (hospital_id, name, address, latitude, longitude, available_icu_beds, available_general_beds) VALUES
('33333333-3333-3333-3333-333333333333', 'City General Hospital', '123 Health St', 23.8103, 90.4125, 5, 20);

INSERT INTO Ambulances (ambulance_id, driver_id, vehicle_number, type, status, current_lat, current_lng) VALUES
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'DHAKA-METRO-123', 'Basic', 'Available', 23.8150, 90.4150);
