const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'jules',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ambucluster',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Helper for generic queries
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};


// --- API Routes ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


// 1. Patient Dashboard APIs
app.get('/api/patient/:id/activity', async (req, res) => {
  try {
    // We fetch emergency requests for a specific patient.
    // For the demo, we will use the first patient if no ID or an invalid UUID is provided
    let patientId = req.params.id;
    if (patientId === 'demo') {
        const patient = await query('SELECT patient_id FROM patient LIMIT 1');
        patientId = patient[0]?.patient_id;
    }

    if (!patientId) return res.status(404).json({ error: 'Patient not found' });

    const sql = `
      SELECT
        request_id as id,
        TO_CHAR(request_time, 'YYYY-MM-DD') as date,
        'Emergency Ambulance' as service,
        CASE WHEN status IN ('COMPLETED', 'ADMITTED') THEN 'Completed' ELSE 'Pending' END as status
      FROM emergency_request
      WHERE patient_id = $1
      ORDER BY request_time DESC
      LIMIT 10
    `;
    const data = await query(sql, [patientId]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 2. Admin Dashboard APIs
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const activeAmbulancesResult = await query("SELECT COUNT(*) FROM ambulance WHERE status IN ('AVAILABLE', 'DISPATCHED')");
    const standbyAmbulancesResult = await query("SELECT COUNT(*) FROM ambulance WHERE status = 'AVAILABLE'");

    // Total ER Patients (currently ADMITTED)
    const erPatientsResult = await query("SELECT COUNT(*) FROM emergency_request WHERE status = 'ADMITTED'");

    // Bed occupancy
    const bedsResult = await query("SELECT SUM(total_er_beds) as total, SUM(available_er_beds) as available FROM hospital");
    const totalBeds = bedsResult[0].total || 1; // prevent division by zero
    const availableBeds = bedsResult[0].available || 0;
    const occupancyPercent = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);

    const alertsResult = await query("SELECT COUNT(*) FROM maintenance_alert WHERE is_resolved = false");

    res.json({
      activeAmbulances: activeAmbulancesResult[0].count,
      standbyAmbulances: standbyAmbulancesResult[0].count,
      totalERPatients: erPatientsResult[0].count,
      bedOccupancyPercent: occupancyPercent,
      activeAlerts: alertsResult[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/hourly-requests', async (req, res) => {
  // Using mock data for the chart, but we could aggregate emergency_request by hour
  const mockHourlyData = [
    { time: '00:00', requests: 45 }, { time: '04:00', requests: 30 },
    { time: '08:00', requests: 120 }, { time: '12:00', requests: 150 },
    { time: '16:00', requests: 180 }, { time: '20:00', requests: 110 },
    { time: '24:00', requests: 60 },
  ];
  res.json(mockHourlyData);
});

app.get('/api/admin/hospital-efficiency', async (req, res) => {
  try {
    // Ensure the view is fresh before querying (in a real app, refresh this via chron, not every request)
    await pool.query('REFRESH MATERIALIZED VIEW MV_Hospital_Efficiency');

    const data = await query("SELECT hospital_name as name, avg_response_mins as time FROM MV_Hospital_Efficiency ORDER BY avg_response_mins ASC");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/maintenance-alerts', async (req, res) => {
  try {
    await pool.query('REFRESH MATERIALIZED VIEW MV_Predictive_Maintenance');

    const sql = `
      SELECT
        v.vehicle_number as id,
        h.hospital_name as hospital,
        v.item_name as machine,
        v.current_hours as hours,
        CASE
          WHEN v.current_hours >= 5000 THEN 'High'
          WHEN v.current_hours >= 4900 THEN 'Medium'
          ELSE 'Low'
        END as risk
      FROM MV_Predictive_Maintenance v
      JOIN ambulance a ON a.vehicle_number = v.vehicle_number
      LEFT JOIN hospital h ON a.base_hospital_id = h.hospital_id
    `;
    const data = await query(sql);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 3. Hospital Dashboard APIs
app.get('/api/hospital/:id/incoming', async (req, res) => {
  try {
    // If no hospital ID provided, just get the first one for the demo
    let hospitalId = req.params.id;
    if (hospitalId === 'demo') {
        const hospital = await query('SELECT hospital_id FROM hospital LIMIT 1');
        hospitalId = hospital[0]?.hospital_id;
    }

    if (!hospitalId) return res.status(404).json({ error: 'Hospital not found' });

    const sql = `
      SELECT
        a.vehicle_number as id,
        '10 mins' as eta, -- Simplified for demo
        ROUND(ST_Distance(
            ST_MakePoint(a.current_longitude::FLOAT, a.current_latitude::FLOAT)::GEOGRAPHY,
            ST_MakePoint(e.pickup_longitude::FLOAT, e.pickup_latitude::FLOAT)::GEOGRAPHY
        )::NUMERIC / 1000, 1) || ' km' as distance,
        'Stable' as status, -- Simplified
        'Unknown' as patient, -- Simplified
        'text-emerald-600 bg-emerald-50 border-emerald-200' as color
      FROM emergency_request e
      JOIN ambulance a ON e.ambulance_id = a.ambulance_id
      WHERE e.destination_hospital_id = $1
        AND e.status IN ('EN_ROUTE_TO_HOSPITAL')
    `;
    const data = await query(sql, [hospitalId]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/hospital/:id/stats', async (req, res) => {
  try {
    let hospitalId = req.params.id;
    if (hospitalId === 'demo') {
        const hospital = await query('SELECT hospital_id FROM hospital LIMIT 1');
        hospitalId = hospital[0]?.hospital_id;
    }

    if (!hospitalId) return res.status(404).json({ error: 'Hospital not found' });

    const hospitalStats = await query("SELECT available_er_beds FROM hospital WHERE hospital_id = $1", [hospitalId]);
    const activeER = await query("SELECT COUNT(*) FROM emergency_request WHERE destination_hospital_id = $1 AND status = 'ADMITTED'", [hospitalId]);

    res.json({
        availableBeds: hospitalStats[0]?.available_er_beds || 0,
        activeERPatients: activeER[0]?.count || 0
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(port, () => {
  console.log(`Backend server running on http://localhost:5000`);
});
