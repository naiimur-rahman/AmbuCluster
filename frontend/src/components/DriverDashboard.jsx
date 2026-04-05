import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const DriverDashboard = ({ ambulance }) => {
  const [currentStatus, setCurrentStatus] = useState(ambulance.status);
  const [activeRequest, setActiveRequest] = useState(null);
  const [location, setLocation] = useState({ lat: parseFloat(ambulance.location_lat), lng: parseFloat(ambulance.location_lng) });

  useEffect(() => {
    socket.on('ambulance_assigned', (data) => {
      if (data.ambulanceId === ambulance.id) {
        setCurrentStatus('en_route');
        setActiveRequest(data.requestId);
        alert('EMERGENCY DISPATCH RECEIVED!');
      }
    });

    return () => {
      socket.off('ambulance_assigned');
    };
  }, []);

  const updateStatus = (newStatus) => {
    if (!activeRequest && newStatus !== 'available') return;

    socket.emit('update_request_status', {
      requestId: activeRequest,
      status: newStatus,
      ambulanceId: ambulance.id
    });

    if (newStatus === 'completed' || newStatus === 'cancelled') {
      setCurrentStatus('available');
      setActiveRequest(null);
    } else {
      setCurrentStatus(newStatus);
    }
  };

  const simulateMovement = () => {
    const newLat = location.lat + (Math.random() - 0.5) * 0.01;
    const newLng = location.lng + (Math.random() - 0.5) * 0.01;
    setLocation({ lat: newLat, lng: newLng });

    socket.emit('update_location', {
      ambulanceId: ambulance.id,
      lat: newLat,
      lng: newLng
    });
  };

  return (
    <div className="p-6 max-w-lg mx-auto mt-10 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ambulance {ambulance.vehicle_number}</h1>
        <p className={`mt-2 inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest text-white ${currentStatus === 'available' ? 'bg-green-500' : 'bg-red-500'}`}>
          {currentStatus.replace('_', ' ')}
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={simulateMovement}
          className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition"
        >
          Simulate Movement (Update GPS)
        </button>

        {activeRequest && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4 space-y-3">
            <h3 className="font-bold text-blue-800 mb-2">Active Dispatch</h3>
            <button
              onClick={() => updateStatus('en_route_hospital')}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition"
            >
              Patient Picked Up (En Route Hospital)
            </button>
            <button
              onClick={() => updateStatus('completed')}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Arrived at Hospital (Complete)
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center font-mono">
        Current GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </div>
    </div>
  );
};

export default DriverDashboard;
