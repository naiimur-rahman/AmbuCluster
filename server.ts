import express from 'express';
import { createServer as createViteServer } from 'vite';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import fs from 'fs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ambucluster'
});

let dbConnected = false;

// In-memory fallback data for AI Studio Preview
let mockAmbulances = [
  { id: '33333333-3333-3333-3333-333333333331', plateNumber: 'Dhaka Metro Cha-11-2233', type: 'ALS', status: 'available', location: { lat: 23.7940, lng: 90.4125, address: 'Gulshan 2, Dhaka' }, driver: 'Rahim Uddin', lastMaintenance: '2024-03-15', batteryLevel: 95, fuelLevel: 80 },
  { id: '33333333-3333-3333-3333-333333333332', plateNumber: 'Dhaka Metro Cha-44-5566', type: 'BLS', status: 'dispatched', location: { lat: 23.7461, lng: 90.3742, address: 'Dhanmondi 27, Dhaka' }, driver: 'Fatima Begum', lastMaintenance: '2024-03-10', batteryLevel: 45, fuelLevel: 60 },
  { id: '33333333-3333-3333-3333-333333333333', plateNumber: 'Dhaka Metro Cha-22-1111', type: 'ALS', status: 'available', location: { lat: 23.7528, lng: 90.3815, address: 'Panthapath, Dhaka' }, driver: 'Abdul Karim', lastMaintenance: '2024-04-01', batteryLevel: 100, fuelLevel: 90 },
  { id: '33333333-3333-3333-3333-333333333334', plateNumber: 'Dhaka Metro Cha-33-2222', type: 'BLS', status: 'available', location: { lat: 23.8103, lng: 90.4313, address: 'Bashundhara, Dhaka' }, driver: 'Shorif Ahmed', lastMaintenance: '2024-02-20', batteryLevel: 80, fuelLevel: 75 },
  { id: '33333333-3333-3333-3333-333333333335', plateNumber: 'Dhaka Metro Cha-55-3333', type: 'ALS', status: 'available', location: { lat: 23.7260, lng: 90.3976, address: 'Shahbagh, Dhaka' }, driver: 'Mizanur Rahman', lastMaintenance: '2024-03-05', batteryLevel: 60, fuelLevel: 50 }
];

let mockEmergencies = [
  { id: '55555555-5555-5555-5555-555555555555', timestamp: new Date().toISOString(), severity: 'critical', location: { lat: 23.7936, lng: 90.4066, address: 'Banani, Road 11' }, callerName: 'Kamal Hossain', callerPhone: '01711223344', description: 'Severe chest pain.', assignedAmbulanceId: '33333333-3333-3333-3333-333333333332', status: 'dispatched', emergencyType: 'Cardiac', age: 55, bloodGroup: 'O+' }
];

let mockClusters = [
  { id: 'CL-1', name: 'Gulshan-Banani', center: { lat: 23.7940, lng: 90.4125 }, radius: 3.0, ambulanceIds: ['33333333-3333-3333-3333-333333333331'], coverageScore: 90 }
];

let mockHospitals = [
  { id: '22222222-2222-2222-2222-222222222222', name: 'Dhaka Medical College Hospital (DMCH)', totalBeds: 150, availableBeds: 12, availableIcuBeds: 5, availableMaternityBeds: 3, specialties: ['Trauma', 'Burn', 'Cardiac'], lat: 23.7260, lng: 90.3976 },
  { id: '22222222-2222-2222-2222-222222222223', name: 'Square Hospital', totalBeds: 80, availableBeds: 5, availableIcuBeds: 2, availableMaternityBeds: 4, specialties: ['Cardiac', 'Neurology'], lat: 23.7528, lng: 90.3815 },
  { id: '22222222-2222-2222-2222-222222222224', name: 'Evercare Hospital Dhaka', totalBeds: 100, availableBeds: 15, availableIcuBeds: 8, availableMaternityBeds: 5, specialties: ['Cardiac', 'Oncology', 'Trauma'], lat: 23.8103, lng: 90.4313 },
  { id: '22222222-2222-2222-2222-222222222225', name: 'United Hospital', totalBeds: 90, availableBeds: 8, availableIcuBeds: 4, availableMaternityBeds: 2, specialties: ['Cardiac', 'Neurology'], lat: 23.8048, lng: 90.4156 },
  { id: '22222222-2222-2222-2222-222222222226', name: 'Labaid Specialized Hospital', totalBeds: 60, availableBeds: 2, availableIcuBeds: 1, availableMaternityBeds: 1, specialties: ['Cardiac'], lat: 23.7417, lng: 90.3833 }
];

// Mock data additions for Admin
let mockEfficiency = [{ hospital_name: 'Dhaka Medical College Hospital (DMCH)', avg_turnaround_mins: 15.5, total_cases_handled: 120 }];
let mockMaintenance = [{ vehicle_number: 'Dhaka Metro Cha-11-2233', days_since_maintenance: 45, maintenance_status: 'Due Soon' }];
let mockGhostTrips = []; // Empty for now
let mockEquipment = [
  { equipment_id: 'eq-1', ambulance_id: '33333333-3333-3333-3333-333333333331', item_name: 'Defibrillator', quantity: 1, last_checked: '2024-03-15' },
  { equipment_id: 'eq-2', ambulance_id: '33333333-3333-3333-3333-333333333331', item_name: 'Oxygen Cylinder', quantity: 2, last_checked: '2024-03-15' }
];

async function initDB() {
  try {
    const dbDir = path.join(process.cwd(), 'db');
    if (!fs.existsSync(dbDir)) {
      throw new Error(`Directory ${dbDir} does not exist`);
    }

    const sqlFiles = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(path.join(dbDir, file), 'utf8');
      await pool.query(sql);
    }

    dbConnected = true;
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err);
    console.warn("Running in memory-mock mode for preview.");
    dbConnected = false;
  }
}

// Simulation Loop for Ambulance Movement
setInterval(async () => {
  if (!dbConnected) {
    mockEmergencies.forEach(emergency => {
      if (emergency.status === 'dispatched' && emergency.assignedAmbulanceId) {
        const ambulance = mockAmbulances.find(a => a.id === emergency.assignedAmbulanceId);
        if (ambulance) {
          // Move ambulance towards patient
          const targetLat = emergency.location.lat;
          const targetLng = emergency.location.lng;
          const currentLat = ambulance.location.lat;
          const currentLng = ambulance.location.lng;

          const latDiff = targetLat - currentLat;
          const lngDiff = targetLng - currentLng;

          // Move 5% of the way each tick
          ambulance.location.lat += latDiff * 0.05;
          ambulance.location.lng += lngDiff * 0.05;
        }
      }
    });
  } else {
    try {
      // Find all active emergencies with an assigned ambulance
      const result = await pool.query(`
        SELECT e.request_id, e.pickup_latitude, e.pickup_longitude, a.ambulance_id, a.current_latitude, a.current_longitude
        FROM emergency_request e
        JOIN ambulance a ON e.ambulance_id = a.ambulance_id
        WHERE e.status IN ('EN_ROUTE_TO_PATIENT', 'DISPATCHED')
      `);

      for (const row of result.rows) {
        const targetLat = parseFloat(row.pickup_latitude);
        const targetLng = parseFloat(row.pickup_longitude);
        const currentLat = parseFloat(row.current_latitude);
        const currentLng = parseFloat(row.current_longitude);

        const latDiff = targetLat - currentLat;
        const lngDiff = targetLng - currentLng;

        const newLat = currentLat + (latDiff * 0.05);
        const newLng = currentLng + (lngDiff * 0.05);

        await pool.query(
          'UPDATE ambulance SET current_latitude = $1, current_longitude = $2 WHERE ambulance_id = $3',
          [newLat, newLng, row.ambulance_id]
        );
      }
    } catch (err) {
      console.error("Simulation loop error:", err);
    }
  }
}, 2000);

async function startServer() {
  await initDB();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/estimate-trip', async (req, res) => {
    const { lat, lng } = req.body;

    if (!dbConnected) {
      // Find nearest available ambulance (mock logic)
      const availableAmbulances = mockAmbulances.filter(a => a.status === 'available');
      if (availableAmbulances.length === 0) {
        return res.json({ error: 'No ambulances available' });
      }

      let nearest = availableAmbulances[0];
      let minDistance = Infinity;

      availableAmbulances.forEach(amb => {
        const dist = Math.sqrt(Math.pow(amb.location.lat - lat, 2) + Math.pow(amb.location.lng - lng, 2));
        if (dist < minDistance) {
          minDistance = dist;
          nearest = amb;
        }
      });

      // Rough estimation: 1 degree ~ 111km. Assume speed 40km/h.
      const distanceKm = minDistance * 111;
      const timeMins = Math.ceil((distanceKm / 40) * 60) + 5; // +5 mins base time
      const fare = Math.ceil(500 + (distanceKm * 50)); // 500 BDT base + 50 BDT/km

      return res.json({
        estimatedTimeMins: timeMins,
        estimatedFareBDT: fare,
        nearestAmbulanceId: nearest.id
      });
    }

    try {
      // Use PostGIS to find the nearest available ambulance
      const result = await pool.query(`
        SELECT ambulance_id,
               ST_Distance(
                 ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326)::geography,
                 ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
               ) / 1000 AS distance_km
        FROM ambulance
        WHERE status = 'AVAILABLE'
        ORDER BY distance_km ASC
        LIMIT 1
      `, [lng, lat]);

      if (result.rows.length === 0) {
        return res.json({ error: 'No ambulances available' });
      }

      const nearest = result.rows[0];
      const distanceKm = parseFloat(nearest.distance_km);
      const timeMins = Math.ceil((distanceKm / 40) * 60) + 5;
      const fare = Math.ceil(500 + (distanceKm * 50));

      res.json({
        estimatedTimeMins: timeMins,
        estimatedFareBDT: fare,
        nearestAmbulanceId: nearest.ambulance_id
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/ambulances', async (req, res) => {
    if (!dbConnected) return res.json(mockAmbulances);
    try {
      const result = await pool.query(`
        SELECT a.ambulance_id, a.vehicle_number, a.status, a.current_latitude, a.current_longitude,
               s.first_name || ' ' || s.last_name AS driver_name,
               a.last_maintenance_date
        FROM ambulance a
        LEFT JOIN staff s ON a.driver_id = s.staff_id
      `);
      const ambulances = result.rows.map((r: any) => ({
        id: r.ambulance_id,
        plateNumber: r.vehicle_number,
        type: 'ALS',
        status: r.status.toLowerCase(),
        location: { lat: parseFloat(r.current_latitude), lng: parseFloat(r.current_longitude), address: 'Unknown' },
        driver: r.driver_name || 'Unassigned',
        lastMaintenance: r.last_maintenance_date,
        batteryLevel: 100,
        fuelLevel: 80
      }));
      res.json(ambulances);
    } catch (err) {
      console.error("GET /api/ambulances error:", err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/emergencies', async (req, res) => {
    if (!dbConnected) return res.json(mockEmergencies);
    try {
      const result = await pool.query(`
        SELECT e.request_id, e.request_time, e.status, e.pickup_latitude, e.pickup_longitude,
               p.full_name, p.phone_number, e.ambulance_id
        FROM emergency_request e
        JOIN patient p ON e.patient_id = p.patient_id
      `);
      const emergencies = result.rows.map((r: any) => ({
        id: r.request_id,
        timestamp: r.request_time,
        severity: 'high',
        location: { lat: parseFloat(r.pickup_latitude), lng: parseFloat(r.pickup_longitude), address: 'Unknown' },
        callerName: r.full_name,
        callerPhone: r.phone_number,
        description: 'Emergency reported',
        assignedAmbulanceId: r.ambulance_id,
        status: r.status.toLowerCase() === 'pending' ? 'pending' : 'dispatched'
      }));
      res.json(emergencies);
    } catch (err) {
      console.error("GET /api/emergencies error:", err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/clusters', async (req, res) => {
    if (!dbConnected) return res.json(mockClusters);
    try {
      const result = await pool.query('SELECT * FROM clusters');
      const clusters = result.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        center: { lat: r.lat, lng: r.lng },
        radius: r.radius,
        ambulanceIds: r.ambulanceIds,
        coverageScore: r.coverageScore
      }));
      res.json(clusters);
    } catch (err) {
      console.error("GET /api/clusters error:", err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/hospitals', async (req, res) => {
    if (!dbConnected) return res.json(mockHospitals);
    try {
      const result = await pool.query('SELECT hospital_id as id, hospital_name as name, latitude as lat, longitude as lng, total_er_beds as "totalBeds", available_er_beds as "availableBeds" FROM hospital');
      res.json(result.rows);
    } catch (err) {
      console.error("GET /api/hospitals error:", err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/hospital', async (req, res) => {
    if (!dbConnected) return res.json(mockHospitals[0]);
    try {
      const result = await pool.query('SELECT * FROM hospital LIMIT 1');
      if (result.rows.length > 0) {
        const h = result.rows[0];
        res.json({
          id: h.hospital_id,
          name: h.hospital_name,
          totalBeds: h.total_er_beds,
          availableBeds: h.available_er_beds,
          availableIcuBeds: h.available_icu_beds,
          availableMaternityBeds: h.available_maternity_beds,
          specialties: h.specialties,
          lat: h.latitude,
          lng: h.longitude
        });
      } else {
        res.json(mockHospitals[0]);
      }
    } catch (err) {
      console.error("GET /api/hospital error:", err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/incoming-emergencies', async (req, res) => {
    if (!dbConnected) {
      return res.json(mockEmergencies.filter(e => e.status !== 'completed'));
    }
    try {
      const result = await pool.query(`
        SELECT e.request_id, e.request_time, e.status, e.pickup_latitude, e.pickup_longitude,
               p.full_name, p.phone_number, p.blood_group, e.ambulance_id, a.vehicle_number
        FROM emergency_request e
        JOIN patient p ON e.patient_id = p.patient_id
        LEFT JOIN ambulance a ON e.ambulance_id = a.ambulance_id
        WHERE e.status != 'COMPLETED'
      `);
      const emergencies = result.rows.map((r: any) => ({
        id: r.request_id,
        timestamp: r.request_time,
        severity: 'high',
        location: { lat: parseFloat(r.pickup_latitude), lng: parseFloat(r.pickup_longitude), address: 'Unknown' },
        callerName: r.full_name,
        callerPhone: r.phone_number,
        bloodGroup: r.blood_group,
        assignedAmbulanceId: r.ambulance_id,
        ambulancePlate: r.vehicle_number,
        status: r.status.toLowerCase()
      }));
      res.json(emergencies);
    } catch (err) {
      console.error("GET /api/incoming-emergencies error:", err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // POST Endpoints for Portals
  app.post('/api/request-ambulance', async (req, res) => {
    const { name, phone, lat, lng, emergencyType, age, dob, bloodGroup, emergencyContact, estimatedFare } = req.body;
    const newId = 'req-' + Date.now();

    if (!dbConnected) {
      const newReq = {
        id: newId, timestamp: new Date().toISOString(), severity: 'high',
        location: { lat, lng, address: 'Unknown' },
        callerName: name, callerPhone: phone, description: `Patient requested. Type: ${emergencyType || 'General'}`,
        emergencyType, age, dob, bloodGroup, emergencyContact, estimatedFare,
        assignedAmbulanceId: null as string | null, status: 'pending'
      };

      // Auto-assign mock logic
      const requiredType = (emergencyType === 'Cardiac' || emergencyType === 'Trauma') ? 'ALS' : 'BLS';
      const availableAmb = mockAmbulances.find(a => a.status === 'available' && (a.type === requiredType || a.type === 'ALS'));
      if (availableAmb) {
        newReq.assignedAmbulanceId = availableAmb.id;
        newReq.status = 'dispatched';
        availableAmb.status = 'dispatched';
      }

      mockEmergencies.push(newReq as any);
      return res.json(newReq);
    }

    try {
      // Insert patient
      const patRes = await pool.query(
        'INSERT INTO patient (full_name, phone_number, date_of_birth, blood_group, emergency_contact) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE - ($4::int * INTERVAL \'1 year\')), $5, $6) RETURNING patient_id',
        [name, phone + Math.floor(Math.random() * 1000), dob || null, age || 30, bloodGroup || 'Unknown', emergencyContact || null] // random to avoid unique constraint in demo
      );
      const patId = patRes.rows[0].patient_id;

      // Call Stored Procedure for Auto-Dispatch
      let assignedAmbulanceId = null;
      let eta = null;
      try {
        const spRes = await pool.query('CALL SP_Assign_Nearest_Ambulance($1, $2, $3, $4, $5, $6, $7, null, null)',
          [patId, lat, lng, null, null, emergencyType || 'General', estimatedFare || 0]);
        if (spRes.rows && spRes.rows.length > 0) {
          assignedAmbulanceId = spRes.rows[0].p_assigned_ambulance_id;
          eta = spRes.rows[0].p_eta_minutes;
        }
      } catch (spErr: any) {
        console.error("SP_Assign_Nearest_Ambulance failed:", spErr);
        return res.status(400).json({ error: spErr.message || 'Failed to assign ambulance' });
      }

      // Get the request ID
      const reqRes = await pool.query('SELECT request_id FROM emergency_request WHERE patient_id = $1 ORDER BY request_time DESC LIMIT 1', [patId]);
      const reqId = reqRes.rows[0]?.request_id;

      res.json({ id: reqId, status: 'dispatched', assignedAmbulanceId, eta });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Admin Analytics APIs
  app.get('/api/admin/efficiency', async (req, res) => {
    if (!dbConnected) return res.json(mockEfficiency);
    try {
      const result = await pool.query('SELECT * FROM MV_Hospital_Efficiency');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
  });

  app.get('/api/admin/maintenance', async (req, res) => {
    if (!dbConnected) return res.json(mockMaintenance);
    try {
      const result = await pool.query('SELECT * FROM MV_Predictive_Maintenance');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
  });

  app.get('/api/admin/ghost-trips', async (req, res) => {
    if (!dbConnected) return res.json(mockGhostTrips);
    try {
      const result = await pool.query('SELECT * FROM V_Ghost_Trips');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
  });

  app.get('/api/admin/equipment', async (req, res) => {
    if (!dbConnected) return res.json(mockEquipment);
    try {
      const result = await pool.query(`
        SELECT e.equipment_id, e.item_name, e.quantity, e.last_checked, a.vehicle_number
        FROM equipment e
        JOIN ambulance a ON e.ambulance_id = a.ambulance_id
      `);
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
  });

  app.post('/api/update-ambulance-status', async (req, res) => {
    const { id, status } = req.body;
    if (!dbConnected) {
      const amb = mockAmbulances.find(a => a.id === id);
      if (amb) amb.status = status;
      return res.json({ success: true });
    }
    try {
      // Update ambulance status
      await pool.query('UPDATE ambulance SET status = $1 WHERE ambulance_id = $2', [status.toUpperCase(), id]);

      // Also update emergency_request timestamps based on status
      if (status.toUpperCase() === 'ON_SCENE') {
        await pool.query("UPDATE emergency_request SET on_scene_time = CURRENT_TIMESTAMP, status = 'ON_SCENE' WHERE ambulance_id = $1 AND status = 'EN_ROUTE_TO_PATIENT'", [id]);
      } else if (status.toUpperCase() === 'EN_ROUTE_HOSPITAL') {
        await pool.query("UPDATE emergency_request SET depart_scene_time = CURRENT_TIMESTAMP, status = 'EN_ROUTE_HOSPITAL' WHERE ambulance_id = $1 AND status = 'ON_SCENE'", [id]);
      } else if (status.toUpperCase() === 'AT_HOSPITAL') {
        await pool.query("UPDATE emergency_request SET hospital_arrival_time = CURRENT_TIMESTAMP, status = 'AT_HOSPITAL' WHERE ambulance_id = $1 AND status = 'EN_ROUTE_HOSPITAL'", [id]);
      } else if (status.toUpperCase() === 'AVAILABLE') {
        await pool.query("UPDATE emergency_request SET completion_time = CURRENT_TIMESTAMP, status = 'COMPLETED' WHERE ambulance_id = $1 AND status != 'COMPLETED'", [id]);
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/update-hospital-beds', async (req, res) => {
    const { id, availableBeds } = req.body;
    if (!dbConnected) {
      const hosp = mockHospitals.find(h => h.id === id);
      if (hosp) hosp.availableBeds = availableBeds;
      return res.json({ success: true });
    }
    try {
      await pool.query('UPDATE hospital SET available_er_beds = $1 WHERE hospital_id = $2', [availableBeds, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();