const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ambulance_db',
  password: 'postgres',
  port: 5432,
});

// Calculate distance function if dropped
pool.query(`
CREATE OR REPLACE FUNCTION calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
    x numeric = 69.1 * (lat2 - lat1);
    y numeric = 69.1 * (lon2 - lon1) * cos(lat1 / 57.3);
BEGIN
    RETURN sqrt(x * x + y * y);
END
$$ LANGUAGE plpgsql;
`).catch(console.error);

// --- API Endpoints ---

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT user_id, name, email, role FROM Users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT user_id, name, email, role FROM Users WHERE email = $1 AND password_hash = $2', [email, password]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    let extraData = {};

    if (user.role === 'Hospital') {
      const hospital = await pool.query('SELECT * FROM Hospitals WHERE hospital_id = $1', [user.user_id]);
      extraData.hospital = hospital.rows[0];
    } else if (user.role === 'Driver') {
      const ambulance = await pool.query('SELECT * FROM Ambulances WHERE driver_id = $1', [user.user_id]);
      extraData.ambulance = ambulance.rows[0];
    }

    res.json({ user, ...extraData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Hospitals
app.get('/api/hospitals', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Hospitals');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Ambulances
app.get('/api/ambulances', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Ambulances');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Emergency Requests (for hospital)
app.get('/api/requests/hospital/:hospitalId', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.name as patient_name
      FROM Trips t
      JOIN Users u ON t.patient_id = u.user_id
      WHERE t.destination_hospital_id = $1
      ORDER BY t.request_time DESC
    `, [req.params.hospitalId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Advanced Admin Analytics Endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const systemOverview = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM Ambulances) as total_ambulances,
        (SELECT COUNT(*) FROM Ambulances WHERE status = 'Available') as available_ambulances,
        (SELECT COUNT(*) FROM Trips) as total_requests,
        (SELECT COUNT(*) FROM Trips WHERE status = 'Pending') as pending_requests
    `);

    // In a real scenario, this would use a materialized view or complex CTE like the original.
    // Simplifying here to use the new Hospitals table.
    const hospitalStats = await pool.query(`
        SELECT
            h.hospital_id as id,
            h.name,
            'General' as type,
            (SELECT COUNT(*) FROM Trips t WHERE t.destination_hospital_id = h.hospital_id) as total_emergencies_handled,
            COALESCE(ROUND((h.available_general_beds::numeric / 50.0) * 100), 0) as occupancy_rate_percent,
            RANK() OVER (ORDER BY (SELECT COUNT(*) FROM Trips t WHERE t.destination_hospital_id = h.hospital_id) DESC) as demand_rank
        FROM Hospitals h
        LIMIT 10
    `);

    res.json({
      hospitals: hospitalStats.rows,
      audits: [], // Keeping audits empty for now since the new schema didn't include the audit trigger/table
      overview: systemOverview.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request Ambulance
app.post('/api/request-ambulance', async (req, res) => {
  const { patientId, type, lat, lng } = req.body;
  try {
    const assignmentQuery = await pool.query(`
      WITH nearest_amb AS (
          SELECT ambulance_id, calculate_distance($1, $2, current_lat, current_lng) as distance
          FROM Ambulances
          WHERE status = 'Available' AND type = $3
          ORDER BY distance ASC
          LIMIT 1
      ),
      nearest_hosp AS (
          SELECT hospital_id, calculate_distance($1, $2, latitude, longitude) as distance
          FROM Hospitals
          WHERE available_general_beds > 0 OR available_icu_beds > 0
          ORDER BY distance ASC
          LIMIT 1
      )
      SELECT
          (SELECT ambulance_id FROM nearest_amb) as ambulance_id,
          (SELECT hospital_id FROM nearest_hosp) as hospital_id
    `, [lat, lng, type || 'Basic']);

    const assignment = assignmentQuery.rows[0];

    if (!assignment.ambulance_id) {
      return res.status(400).json({ error: 'No ambulances currently available in the system for this type' });
    }

    if (!assignment.hospital_id) {
      return res.status(400).json({ error: 'No hospitals with available beds found' });
    }

    const insertResult = await pool.query(`
      INSERT INTO Trips (patient_id, ambulance_id, destination_hospital_id, status, pickup_lat, pickup_lng)
      VALUES ($1, $2, $3, 'Accepted', $4, $5)
      RETURNING *
    `, [patientId, assignment.ambulance_id, assignment.hospital_id, lat, lng]);

    const newTrip = insertResult.rows[0];

    io.emit('new_request', newTrip);
    io.emit('ambulance_assigned', { ambulanceId: assignment.ambulance_id, tripId: newTrip.trip_id });

    res.json(newTrip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// --- Socket.io Real-time Updates ---

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('update_location', async (data) => {
    const { ambulanceId, lat, lng } = data;
    try {
      await pool.query('UPDATE Ambulances SET current_lat = $1, current_lng = $2 WHERE ambulance_id = $3', [lat, lng, ambulanceId]);
      io.emit('location_updated', { ambulanceId, lat, lng });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  });

  socket.on('update_request_status', async (data) => {
    const { tripId, status, ambulanceId } = data;
    try {
      await pool.query('UPDATE Trips SET status = $1 WHERE trip_id = $2', [status, tripId]);
      // Note: Trigger handles updating the ambulance status
      io.emit('request_status_updated', { tripId, status, ambulanceId });
    } catch (err) {
      console.error('Error updating request status:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
