import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { ShieldAlert, MapPin, CheckCircle, Clock, Droplet, Activity, User, Phone } from 'lucide-react';

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

const socket = io();

const PatientDashboard = ({ user, profile }) => {
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  // Default to Dhaka coordinates
  const [location, setLocation] = useState({ lat: 23.8103, lng: 90.4125 });

  useEffect(() => {
    axios.get('/api/hospitals').then(res => setHospitals(res.data));
    axios.get('/api/ambulances').then(res => setAmbulances(res.data));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation error, using default Dhaka', err)
      );
    }

    socket.on('location_updated', (data) => {
      setAmbulances(prev => prev.map(a => a.ambulance_id === data.ambulanceId ? { ...a, current_lat: data.lat, current_lng: data.lng } : a));
    });

    socket.on('request_status_updated', (data) => {
      if (requestStatus && data.tripId === requestStatus.trip_id) {
         setRequestStatus(prev => ({...prev, status: data.status}));
      }
    });

    return () => {
      socket.off('location_updated');
      socket.off('request_status_updated');
    };
  }, [requestStatus]);

  const requestAmbulance = async (type) => {
    try {
      const res = await axios.post('/api/request-ambulance', {
        patientId: user.user_id,
        type: type,
        lat: location.lat,
        lng: location.lng
      });
      setRequestStatus(res.data);
      alert(`Ambulance requested successfully! Assigned Ambulance ID: ${res.data.ambulance_id.split('-')[0]}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error requesting ambulance');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Patient Portal</h1>
          <p className="text-emerald-600 font-medium">Welcome back, {user.name}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {profile?.blood_group && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-lg font-semibold">
              <Droplet className="w-5 h-5" /> Blood: {profile.blood_group}
            </div>
          )}
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-semibold">
            <Phone className="w-5 h-5" /> {user.phone}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions & Profile */}
        <div className="lg:col-span-1 space-y-6">

          {/* Action Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="w-32 h-32" /></div>
            <h2 className="text-xl font-bold mb-6 text-gray-900 relative z-10">Dispatch Services</h2>

            {requestStatus ? (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-inner relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 animate-pulse">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm text-emerald-600 font-semibold uppercase tracking-wider block">Status</span>
                    <span className="font-extrabold text-lg text-gray-900">{requestStatus.status.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
                <div className="space-y-2 bg-white p-3 rounded-lg text-sm font-medium text-gray-700 border border-emerald-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ambulance ID:</span>
                    <span className="text-gray-900">{requestStatus.ambulance_id ? requestStatus.ambulance_id.split('-')[0] : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Hospital:</span>
                    <span className="text-gray-900">{requestStatus.destination_hospital_id ? requestStatus.destination_hospital_id.split('-')[0] : 'Pending'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                <button
                  onClick={() => requestAmbulance('Basic')}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Basic Ambulance
                </button>

                <button
                  onClick={() => requestAmbulance('ICU')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-5 h-5" />
                  ICU Ambulance
                </button>

                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 blur opacity-20 rounded-xl animate-pulse"></div>
                  <button
                    onClick={() => requestAmbulance('Freezing')}
                    className="relative w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-6 h-6" />
                    Freezing Ambulance
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> Medical Records
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div>
                  <span className="text-gray-500 block text-xs uppercase font-semibold">NID</span>
                  <span className="font-medium text-gray-900">{profile?.nid || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs uppercase font-semibold">DOB</span>
                  <span className="font-medium text-gray-900">{profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <ul className="text-sm text-gray-600 space-y-3 px-1">
                <li className="flex flex-col"><strong className="text-gray-800">Allergies</strong> <span>{profile?.allergies || 'None recorded'}</span></li>
                <li className="flex flex-col"><strong className="text-gray-800">Chronic Diseases</strong> <span>{profile?.chronic_diseases || 'None recorded'}</span></li>
                <li className="flex flex-col"><strong className="text-gray-800">Past Surgeries</strong> <span>{profile?.past_surgeries || 'None recorded'}</span></li>
                <li className="flex flex-col pt-2 border-t border-gray-100"><strong className="text-red-600 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Emergency Contact</strong> <span className="font-bold text-gray-900">{profile?.emergency_contact || 'None'}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2 h-[600px] bg-white rounded-2xl overflow-hidden shadow-sm border border-emerald-100 relative">
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-100">
            <h3 className="font-bold text-sm text-gray-800 mb-2">Live Map Legend</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-sm"></div> Hospital</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow-sm"></div> Ambulance</div>
            </div>
          </div>
          <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <Marker position={[location.lat, location.lng]}>
              <Popup>
                <div className="font-bold">Your Location</div>
              </Popup>
            </Marker>

            {hospitals.map(h => (
              <Marker key={h.hospital_id} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                <Popup>
                  <div className="font-bold text-base">{h.name}</div>
                  <div className="text-sm">Gen Beds: <strong>{h.available_general_beds}</strong></div>
                  <div className="text-sm text-red-600 font-semibold">ICU Beds: {h.available_icu_beds}</div>
                </Popup>
              </Marker>
            ))}

            {ambulances.map(a => (
              <Marker key={a.ambulance_id} position={[a.current_lat, a.current_lng]} icon={ambulanceIcon}>
                <Popup>
                  <div className="font-bold">{a.vehicle_number}</div>
                  <div className="text-xs text-gray-600 mb-1">{a.type}</div>
                  <div className={`text-xs font-bold uppercase ${a.status === 'Available' ? 'text-green-600' : 'text-amber-600'}`}>
                    {a.status}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
