import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ShieldAlert, Activity, User, Phone, MapPin, Clock } from 'lucide-react';

const socket = io('http://localhost:5000');

const HospitalDashboard = ({ hospital }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();

    socket.on('new_request', (req) => {
      if (req.destination_hospital_id === hospital.hospital_id) fetchRequests();
    });

    socket.on('request_status_updated', () => {
      fetchRequests();
    });

    return () => {
      socket.off('new_request');
      socket.off('request_status_updated');
    };
  }, [hospital.hospital_id]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/requests/hospital/${hospital.hospital_id}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hospital Stats Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="w-48 h-48" /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm uppercase tracking-wider">
              <MapPin className="w-4 h-4" /> {hospital.type} Facility
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">{hospital.name}</h1>
            <p className="text-slate-400 max-w-lg">{hospital.address}</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 p-4 rounded-xl text-center min-w-[120px]">
              <div className="text-3xl font-bold text-emerald-400">{hospital.available_general_beds}</div>
              <div className="text-xs text-slate-400 uppercase font-semibold mt-1">Gen. Beds</div>
            </div>
            <div className="bg-rose-900/30 backdrop-blur border border-rose-800/50 p-4 rounded-xl text-center min-w-[120px]">
              <div className="text-3xl font-bold text-rose-400">{hospital.available_icu_beds}</div>
              <div className="text-xs text-rose-300 uppercase font-semibold mt-1">ICU Beds</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Incoming Emergencies
            <span className="bg-emerald-100 text-emerald-700 text-sm py-1 px-3 rounded-full font-bold">{requests.length}</span>
          </h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500 shadow-sm flex flex-col items-center justify-center">
             <Activity className="w-12 h-12 text-gray-300 mb-4" />
             <p className="text-lg font-medium">No active incoming emergencies.</p>
             <p className="text-sm">Monitoring live dispatch feed...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {requests.map(req => (
              <div key={req.trip_id} className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md
                border-emerald-500`}>

                {/* Status bar */}
                <div className={`px-5 py-3 flex justify-between items-center text-white
                  bg-gradient-to-r from-emerald-600 to-teal-500`}>
                  <div className="flex items-center gap-2 font-bold tracking-wide">
                    <Activity className="w-5 h-5" />
                    STANDARD DISPATCH
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-sm shadow-inner`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 mb-1">
                        <User className="w-6 h-6 text-gray-400" /> {req.patient_name}
                      </h3>
                      <div className="text-sm text-gray-500 flex items-center gap-2 font-medium">
                        <Clock className="w-4 h-4" /> Requested: {new Date(req.request_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {req.blood_group && (
                      <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-center">
                        <div className="text-xs text-rose-500 font-bold uppercase mb-1">Blood</div>
                        <div className="text-xl font-extrabold text-rose-700">{req.blood_group}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg font-medium text-sm">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      Emergency: N/A
                    </div>
                    <div className="text-xs font-semibold text-gray-400">
                      Ambulance ID: {req.ambulance_id ? req.ambulance_id.split('-')[0] : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
