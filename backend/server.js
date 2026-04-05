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

// Calculate distance between two coordinates using Haversine formula
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

// --- API Endpoints ---

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (Simplified for lab demo)
app.post('/api/login', async (req, res) => {
  const { userId } = req.body;
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    let extraData = {};

    if (user.role === 'patient') {
      const profile = await pool.query('SELECT * FROM patient_profiles WHERE user_id = $1', [user.id]);
      extraData.profile = profile.rows[0];
    } else if (user.role === 'hospital') {
      const hospital = await pool.query('SELECT * FROM hospitals WHERE user_id = $1', [user.id]);
      extraData.hospital = hospital.rows[0];
    } else if (user.role === 'driver') {
      const ambulance = await pool.query('SELECT * FROM ambulances WHERE driver_id = $1', [user.id]);
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
    const { rows } = await pool.query('SELECT * FROM hospitals');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Ambulances
app.get('/api/ambulances', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ambulances');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Emergency Requests (for hospital)
app.get('/api/requests/hospital/:hospitalId', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT er.*, u.name as patient_name, pp.blood_group, pp.allergies, pp.chronic_diseases, pp.past_surgeries, pp.emergency_contact
      FROM emergency_requests er
      JOIN users u ON er.patient_id = u.id
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      WHERE er.hospital_id = $1
      ORDER BY er.request_time DESC
    `, [req.params.hospitalId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request Ambulance (Auto Assign)
app.post('/api/request-ambulance', async (req, res) => {
  const { patientId, isSos, lat, lng } = req.body;
  try {
    const ambulancesQuery = await pool.query("SELECT * FROM ambulances WHERE status = 'available'");
    const availableAmbulances = ambulancesQuery.rows;

    if (availableAmbulances.length === 0) {
      return res.status(400).json({ error: 'No ambulances currently available' });
    }

    let nearestAmbulance = null;
    let minDistance = Infinity;

    availableAmbulances.forEach(amb => {
      const dist = getDistanceInKm(lat, lng, amb.location_lat, amb.location_lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestAmbulance = amb;
      }
    });

    const hospitalsQuery = await pool.query("SELECT * FROM hospitals");
    const hospitals = hospitalsQuery.rows;

    let nearestHospital = null;
    minDistance = Infinity;

    hospitals.forEach(hosp => {
      const dist = getDistanceInKm(lat, lng, hosp.location_lat, hosp.location_lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestHospital = hosp;
      }
    });

    const insertResult = await pool.query(`
      INSERT INTO emergency_requests (patient_id, ambulance_id, hospital_id, status, is_sos, pickup_lat, pickup_lng)
      VALUES ($1, $2, $3, 'assigned', $4, $5, $6)
      RETURNING *
    `, [patientId, nearestAmbulance.id, nearestHospital.id, isSos, lat, lng]);

    const newRequest = insertResult.rows[0];

    await pool.query("UPDATE ambulances SET status = 'en_route' WHERE id = $1", [nearestAmbulance.id]);

    io.emit('new_request', newRequest);
    io.emit('ambulance_assigned', { ambulanceId: nearestAmbulance.id, requestId: newRequest.id });

    res.json(newRequest);
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
      await pool.query('UPDATE ambulances SET location_lat = $1, location_lng = $2 WHERE id = $3', [lat, lng, ambulanceId]);
      io.emit('location_updated', { ambulanceId, lat, lng });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  });

  socket.on('update_request_status', async (data) => {
    const { requestId, status, ambulanceId } = data;
    try {
      await pool.query('UPDATE emergency_requests SET status = $1 WHERE id = $2', [status, requestId]);

      if (status === 'completed' || status === 'cancelled') {
         await pool.query("UPDATE ambulances SET status = 'available' WHERE id = $1", [ambulanceId]);
      }
      io.emit('request_status_updated', { requestId, status, ambulanceId });
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
