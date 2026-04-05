import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const HospitalDashboard = ({ hospital }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();

    socket.on('new_request', (req) => {
      if (req.hospital_id === hospital.id) fetchRequests();
    });

    socket.on('request_status_updated', () => {
      fetchRequests();
    });

    return () => {
      socket.off('new_request');
      socket.off('request_status_updated');
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/requests/hospital/${hospital.id}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{hospital.name} Dashboard</h1>
        <p className="text-gray-600">Available Beds: {hospital.available_beds} / {hospital.total_beds}</p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Incoming Patients</h2>

        {requests.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-500">
            No incoming emergencies at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map(req => (
              <div key={req.id} className={`p-5 rounded-xl shadow-md border-l-4 ${req.is_sos ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-white'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800">{req.patient_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${req.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {req.status}
                  </span>
                </div>

                {req.is_sos && (
                  <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded font-bold mb-3">
                    SOS EMERGENCY
                  </span>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm mt-2 border-t pt-3 border-gray-200">
                  <div>
                    <p className="text-gray-500">Blood Group</p>
                    <p className="font-semibold text-red-600">{req.blood_group || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Allergies</p>
                    <p className="font-semibold">{req.allergies || 'None'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Chronic Diseases</p>
                    <p className="font-semibold">{req.chronic_diseases || 'None'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Past Surgeries</p>
                    <p className="font-medium text-gray-800">{req.past_surgeries || 'None'}</p>
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
