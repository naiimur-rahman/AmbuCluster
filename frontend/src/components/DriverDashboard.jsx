import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Navigation, MapPin, CheckCircle, Activity, User } from 'lucide-react';

const socket = io();

const DriverDashboard = ({ ambulance }) => {
  const [currentStatus, setCurrentStatus] = useState(ambulance.status);
  const [activeTrip, setActiveTrip] = useState(null);
  const [location, setLocation] = useState({ lat: parseFloat(ambulance.current_lat), lng: parseFloat(ambulance.current_lng) });

  useEffect(() => {
    socket.on('ambulance_assigned', (data) => {
      if (data.ambulanceId === ambulance.ambulance_id) {
        setCurrentStatus('Accepted');
        setActiveTrip(data.tripId);
        alert('🚨 EMERGENCY DISPATCH RECEIVED! 🚨');
      }
    });

    return () => {
      socket.off('ambulance_assigned');
    };
  }, [ambulance.ambulance_id]);

  const updateStatus = (newStatus) => {
    if (!activeTrip && newStatus !== 'Available') return;

    socket.emit('update_request_status', {
      tripId: activeTrip,
      status: newStatus,
      ambulanceId: ambulance.ambulance_id
    });

    if (newStatus === 'Completed' || newStatus === 'Cancelled') {
      setCurrentStatus('Available');
      setActiveTrip(null);
    } else {
      setCurrentStatus(newStatus);
    }
  };

  useEffect(() => {
    let intervalId;
    if (currentStatus === 'Accepted' || currentStatus === 'En_Route') {
      // Automatically simulate GPS movement every 3 seconds when en route
      intervalId = setInterval(() => {
        setLocation(prev => {
          const newLat = prev.lat + (Math.random() - 0.5) * 0.005;
          const newLng = prev.lng + (Math.random() - 0.5) * 0.005;

          socket.emit('update_location', {
            ambulanceId: ambulance.ambulance_id,
            lat: newLat,
            lng: newLng
          });

          return { lat: newLat, lng: newLng };
        });
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentStatus, ambulance.ambulance_id]);

  return (
    <div className="p-6 max-w-2xl mx-auto mt-10">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header Section */}
        <div className={`p-8 text-center text-white relative transition-colors duration-500
          ${currentStatus === 'Available' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' :
            (currentStatus === 'Accepted' || currentStatus === 'En_Route') ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-rose-600 to-red-700'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-20"><Activity className="w-32 h-32" /></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-inner">
               <Navigation className={`w-10 h-10 ${(currentStatus === 'Accepted' || currentStatus === 'En_Route') ? 'animate-bounce' : ''}`} />
            </div>
            <h1 className="text-3xl font-extrabold mb-1">{ambulance.vehicle_number}</h1>
            <p className="text-white/80 font-medium mb-4 tracking-wide">{ambulance.type}</p>

            <div className="inline-block px-6 py-2 rounded-full text-sm font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md shadow-lg border border-white/30">
              STATUS: {currentStatus.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-6 bg-gray-50">

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center relative overflow-hidden">
            {(currentStatus === 'Accepted' || currentStatus === 'En_Route') && (
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>
            )}
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Live GPS Coordinates</span>
              <span className="font-mono text-gray-700 font-semibold text-lg flex items-center gap-2">
                <MapPin className={`w-5 h-5 ${(currentStatus === 'Accepted' || currentStatus === 'En_Route') ? 'text-emerald-500 animate-bounce' : 'text-gray-400'}`} />
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            </div>
            {(currentStatus === 'Accepted' || currentStatus === 'En_Route') && (
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                Transmitting GPS...
              </div>
            )}
          </div>

          {activeTrip ? (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
              <h3 className="font-extrabold text-amber-900 mb-4 text-xl flex items-center gap-2">
                <Activity className="w-6 h-6" /> Active Dispatch
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => updateStatus('En_Route')}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Patient Picked Up
                </button>
                <button
                  onClick={() => updateStatus('Completed')}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Arrived at Hospital
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="font-semibold text-lg">No active dispatch.</p>
              <p className="text-sm">Standing by for emergencies...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
