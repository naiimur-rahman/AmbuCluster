import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { AlertTriangle, MapPin, CheckCircle } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const socket = io('http://localhost:5000');

const PatientDashboard = ({ user, profile }) => {
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [location, setLocation] = useState({ lat: 40.7300, lng: -73.9800 });

  useEffect(() => {
    axios.get('http://localhost:5000/api/hospitals').then(res => setHospitals(res.data));
    axios.get('http://localhost:5000/api/ambulances').then(res => setAmbulances(res.data));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation error, using default', err)
      );
    }

    socket.on('location_updated', (data) => {
      setAmbulances(prev => prev.map(a => a.id === data.ambulanceId ? { ...a, location_lat: data.lat, location_lng: data.lng } : a));
    });

    socket.on('request_status_updated', (data) => {
      if (requestStatus && data.requestId === requestStatus.id) {
         setRequestStatus(prev => ({...prev, status: data.status}));
      }
    });

    return () => {
      socket.off('location_updated');
      socket.off('request_status_updated');
    };
  }, [requestStatus]);

  const requestAmbulance = async (isSos) => {
    try {
      const res = await axios.post('http://localhost:5000/api/request-ambulance', {
        patientId: user.id,
        isSos: isSos,
        lat: location.lat,
        lng: location.lng
      });
      setRequestStatus(res.data);
      alert(`Ambulance requested! Assigned Ambulance ID: ${res.data.ambulance_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error requesting ambulance');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patient Dashboard</h1>
        <div className="text-right">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-gray-500">Blood Group: {profile?.blood_group}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Emergency Actions</h2>

            {requestStatus ? (
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Request Status: {requestStatus.status.toUpperCase()}</span>
                </div>
                <p className="text-sm">Assigned Ambulance ID: {requestStatus.ambulance_id}</p>
                <p className="text-sm">Assigned Hospital ID: {requestStatus.hospital_id}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => requestAmbulance(false)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Request Ambulance
                </button>

                <button
                  onClick={() => requestAmbulance(true)}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition flex items-center justify-center gap-2 animate-pulse"
                >
                  <AlertTriangle className="w-5 h-5" />
                  SOS EMERGENCY
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Your Medical Profile</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><strong>Allergies:</strong> {profile?.allergies || 'None'}</li>
              <li><strong>Chronic Diseases:</strong> {profile?.chronic_diseases || 'None'}</li>
              <li><strong>Past Surgeries:</strong> {profile?.past_surgeries || 'None'}</li>
              <li><strong>Emergency Contact:</strong> {profile?.emergency_contact}</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl overflow-hidden shadow-md border border-gray-300">
          <MapContainer center={[location.lat, location.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <Marker position={[location.lat, location.lng]}>
              <Popup>You are here</Popup>
            </Marker>

            {hospitals.map(h => (
              <Marker key={h.id} position={[h.location_lat, h.location_lng]} icon={hospitalIcon}>
                <Popup>{h.name}<br/>Beds: {h.available_beds}/{h.total_beds}</Popup>
              </Marker>
            ))}

            {ambulances.map(a => (
              <Marker key={a.id} position={[a.location_lat, a.location_lng]} icon={ambulanceIcon}>
                <Popup>Ambulance {a.vehicle_number}<br/>Status: {a.status}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
