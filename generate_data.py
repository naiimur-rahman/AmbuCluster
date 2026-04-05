import random
import math

# Data sources for Bangladesh (Dhaka focused)
first_names = ["Rahim", "Karim", "Abdul", "Jamal", "Kamal", "Hasan", "Tariq", "Rafiq", "Arif", "Imran", "Mahmud", "Faisal", "Naimur", "Shafiq", "Mehedi", "Sakib", "Tamim", "Mushfiq", "Mahmudullah", "Liton", "Fatima", "Ayesha", "Khadija", "Sumaiya", "Nusrat", "Sadia", "Jannatul", "Farhana", "Mita", "Rina", "Shirin", "Tasnim"]
last_names = ["Rahman", "Islam", "Hossain", "Ahmed", "Ali", "Chowdhury", "Khan", "Sarker", "Uddin", "Mia", "Begum", "Akter", "Khatun"]

blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
allergies_list = ["None", "Peanuts", "Dust", "Pollen", "Seafood", "Penicillin", "Dairy", "None", "None", "None"]
diseases_list = ["None", "Asthma", "Diabetes", "Hypertension", "None", "None", "None"]
surgeries_list = ["None", "Appendectomy", "Gallbladder removal", "C-section", "None", "None", "None"]

# Dhaka coordinates roughly
dhaka_center_lat = 23.8103
dhaka_center_lng = 90.4125

def random_lat_lng(radius_km=10):
    # random point within radius_km
    r = radius_km / 111.3 # degrees
    u = random.random()
    v = random.random()
    w = r * math.sqrt(u)
    t = 2 * math.pi * v
    x = w * math.cos(t)
    y = w * math.sin(t)
    return dhaka_center_lat + x, dhaka_center_lng + y

hospital_names = [
    "Dhaka Medical College Hospital", "Square Hospitals", "United Hospital",
    "Evercare Hospital", "Labaid Hospital", "BIRDEM General Hospital",
    "Ibn Sina Hospital", "Popular Medical College Hospital", "Kurmitola General Hospital",
    "Holy Family Red Crescent Hospital", "Bangabandhu Sheikh Mujib Medical University",
    "Sir Salimullah Medical College Hospital", "Shaheed Suhrawardy Medical College Hospital",
    "Apollo Hospitals", "Green Life Hospital"
]

addresses = ["Dhanmondi", "Gulshan", "Banani", "Uttara", "Mirpur", "Mohammadpur", "Motijheel", "Badda", "Bashundhara", "Tejgaon", "Khilgaon", "Malibagh", "Rampura", "Mogbazar", "Farmgate"]

with open("seed.sql", "w") as f:
    f.write("BEGIN;\n")

    # 1. Clear existing data
    f.write("TRUNCATE TABLE emergency_requests, ambulances, hospitals, patient_profiles, users RESTART IDENTITY CASCADE;\n")

    # 2. Insert Users (Patients: 500, Drivers: 50, Hospitals: 15)
    f.write("INSERT INTO users (name, email, role, phone, password_hash) VALUES\n")

    user_values = []
    # Add one default patient for demo
    user_values.append(f"('Naimur Rahman', 'patient@ambucluster.com', 'patient', '01711000000', 'hashed_pw')")

    # Generate 500 patients
    for i in range(1, 501):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        email = f"patient{i}@example.com"
        phone = f"017{random.randint(10000000, 99999999)}"
        user_values.append(f"('{name}', '{email}', 'patient', '{phone}', 'hashed_pw')")

    # Generate 15 Hospitals
    # We will use indices 502 to 516
    for i, hname in enumerate(hospital_names):
        email = f"admin{i}@hospital.bd"
        phone = f"02{random.randint(1000000, 9999999)}"
        user_values.append(f"('{hname} Admin', '{email}', 'hospital', '{phone}', 'hashed_pw')")

    # Generate 50 Drivers
    # Indices 517 to 566
    for i in range(1, 51):
        name = f"Driver {random.choice(first_names)}"
        email = f"driver{i}@ambulance.bd"
        phone = f"019{random.randint(10000000, 99999999)}"
        user_values.append(f"('{name}', '{email}', 'driver', '{phone}', 'hashed_pw')")

    f.write(",\n".join(user_values) + ";\n")

    # 3. Insert Patient Profiles
    f.write("INSERT INTO patient_profiles (user_id, nid, dob, gender, blood_group, allergies, chronic_diseases, past_surgeries, emergency_contact) VALUES\n")
    profile_values = []

    # Default patient
    profile_values.append(f"(1, '1995{random.randint(100000, 999999)}', '1995-01-01', 'Male', 'O+', 'None', 'None', 'None', '01711223344')")

    for i in range(2, 502):
        nid = f"{random.randint(1950, 2005)}{random.randint(100000000, 999999999)}"
        dob = f"{random.randint(1950, 2005)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"
        gender = random.choice(['Male', 'Female'])
        bg = random.choice(blood_groups)
        alg = random.choice(allergies_list)
        chr_d = random.choice(diseases_list)
        surg = random.choice(surgeries_list)
        em_c = f"018{random.randint(10000000, 99999999)}"
        profile_values.append(f"({i}, '{nid}', '{dob}', '{gender}', '{bg}', '{alg}', '{chr_d}', '{surg}', '{em_c}')")

    f.write(",\n".join(profile_values) + ";\n")

    # 4. Insert Hospitals
    f.write("INSERT INTO hospitals (user_id, name, type, location_lat, location_lng, address, total_beds, available_beds, icu_beds) VALUES\n")
    hospital_values = []
    h_idx = 1
    for i, hname in enumerate(hospital_names):
        user_id = 502 + i
        lat, lng = random_lat_lng(5)
        addr = f"{random.randint(1, 100)} {random.choice(addresses)}, Dhaka"
        t_beds = random.randint(100, 1000)
        a_beds = random.randint(10, t_beds // 4)
        icu = random.randint(5, 50)
        h_type = random.choice(['Government', 'Private'])
        hospital_values.append(f"({user_id}, '{hname}', '{h_type}', {lat:.6f}, {lng:.6f}, '{addr}', {t_beds}, {a_beds}, {icu})")

    f.write(",\n".join(hospital_values) + ";\n")

    # 5. Insert Ambulances
    f.write("INSERT INTO ambulances (driver_id, vehicle_number, type, base_hospital_id, status, location_lat, location_lng) VALUES\n")
    amb_values = []
    amb_types = ['Basic Life Support', 'Advanced Life Support (ICU)', 'Freezing Ambulance']
    for i in range(1, 51):
        user_id = 516 + i
        v_num = f"DHA-METRO-CHA-{random.randint(10, 99)}-{random.randint(1000, 9999)}"
        a_type = random.choice(amb_types)
        b_hosp = random.randint(1, 15) if random.random() > 0.5 else "NULL"
        lat, lng = random_lat_lng(8)
        # Some are busy, most are available
        status = 'available' if random.random() > 0.2 else 'busy'
        amb_values.append(f"({user_id}, '{v_num}', '{a_type}', {b_hosp}, '{status}', {lat:.6f}, {lng:.6f})")

    f.write(",\n".join(amb_values) + ";\n")

    f.write("COMMIT;\n")

print("Generated seed.sql successfully!")
