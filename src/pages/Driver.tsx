import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, Loader2, AlertTriangle, ArrowLeft, MapPin, Navigation, User, Phone, Route, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const patientIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673221.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const hospitalMarkerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/33/33777.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Ambulance {
  id: string;
  plateNumber: string;
  status: string;
  driver: string;
  location: { lat: number; lng: number };
}

interface IncomingEmergency {
  id: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  bloodGroup: string;
  assignedAmbulanceId: string | null;
  status: string;
  location: { lat: number; lng: number; address: string };
}

const statusActions = [
  { label: 'AVAILABLE', value: 'available', activeClasses: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' },
  { label: 'EN ROUTE', value: 'dispatched', activeClasses: 'bg-sky-500 text-slate-950 hover:bg-sky-400' },
  { label: 'ON SCENE', value: 'on_scene', activeClasses: 'bg-orange-400 text-slate-950 hover:bg-orange-300' },
  { label: 'TO HOSPITAL', value: 'en_route_hospital', activeClasses: 'bg-violet-400 text-slate-950 hover:bg-violet-300' },
  { label: 'AT HOSPITAL', value: 'at_hospital', activeClasses: 'bg-cyan-300 text-slate-950 hover:bg-cyan-200' },
];

export default function Driver() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [assignment, setAssignment] = useState<IncomingEmergency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [selectedAmbulance]);

  const fetchData = async () => {
    try {
      const [ambRes, incRes, hospRes] = await Promise.all([
        fetch('/api/ambulances'),
        fetch('/api/incoming-emergencies'),
        fetch('/api/hospitals'),
      ]);

      if (!ambRes.ok || !incRes.ok || !hospRes.ok) throw new Error('Failed to fetch data');

      const ambData = await ambRes.json();
      const incData = await incRes.json();
      const hospData = await hospRes.json();

      setAmbulances(ambData);
      setHospitals(hospData);

      if (selectedAmbulance) {
        const updated = ambData.find((ambulance: Ambulance) => ambulance.id === selectedAmbulance.id);
        if (updated) setSelectedAmbulance(updated);

        const myAssignment = incData.find((emergency: IncomingEmergency) => emergency.assignedAmbulanceId === selectedAmbulance.id);
        setAssignment(myAssignment || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedAmbulance) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/update-ambulance-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAmbulance.id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchData();
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && ambulances.length === 0) {
    return (
      <div className="portal-shell flex items-center justify-center">
        <div className="premium-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/70">Syncing vehicle roster...</p>
        </div>
      </div>
    );
  }

  if (error && ambulances.length === 0) {
    return (
      <div className="portal-shell flex items-center justify-center">
        <div className="premium-card max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-2xl font-bold">Error Loading Data</h2>
          <p className="mb-4 text-white/68">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-shell">
      <div className="portal-container max-w-6xl">
        <div className="portal-header">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full border border-white/12 bg-white/6 text-white hover:bg-white/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-3">
                  <Truck className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <span className="section-kicker">Driver Cockpit</span>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Field operations surface</h1>
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Switch vehicles quickly, update mission state, and keep patient pickup context visible while you move.
            </p>
          </div>

          <div className="grid w-full gap-3 md:max-w-md md:grid-cols-2">
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Vehicles online</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{ambulances.length}</p>
              <p className="mt-1 text-sm text-white/58">Selectable driver vehicles</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Current assignment</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{assignment ? 'Live' : 'Idle'}</p>
              <p className="mt-1 text-sm text-white/58">{selectedAmbulance ? selectedAmbulance.plateNumber : 'Choose a vehicle first'}</p>
            </div>
          </div>
        </div>

        {!selectedAmbulance ? (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Select Your Vehicle</CardTitle>
              <CardDescription>Choose the ambulance you are operating today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {ambulances.map((ambulance) => (
                  <Button
                    key={ambulance.id}
                    variant="outline"
                    className="h-auto rounded-[1.5rem] border-white/12 bg-white/6 py-5 text-left text-white hover:bg-white/10"
                    onClick={() => setSelectedAmbulance(ambulance)}
                  >
                    <div className="flex w-full flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-amber-200" />
                        <span className="text-lg font-bold">{ambulance.plateNumber}</span>
                      </div>
                      <div className="text-sm text-white/62">Assigned to: {ambulance.driver}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setSelectedAmbulance(null)} className="w-fit rounded-full border border-white/12 bg-white/6 text-white hover:bg-white/10">
              &larr; Change Vehicle
            </Button>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-6 h-6 text-amber-200" />
                  Vehicle {selectedAmbulance.plateNumber}
                </CardTitle>
                <CardDescription>
                  Current status: <span className="font-bold uppercase text-white">{selectedAmbulance.status}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {statusActions.map((statusAction) => {
                    const active = selectedAmbulance.status.toLowerCase() === statusAction.value;
                    return (
                      <Button
                        key={statusAction.value}
                        variant="outline"
                        className={`h-16 text-sm font-semibold ${active ? statusAction.activeClasses : 'border-white/12 bg-white/6 text-white hover:bg-white/10'}`}
                        onClick={() => updateStatus(statusAction.value)}
                        disabled={updating}
                      >
                        {statusAction.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {assignment && (
              <Card className="premium-card border-amber-400/20">
                <CardHeader className="border-b border-white/10 bg-white/5">
                  <CardTitle className="flex items-center gap-2 text-amber-200">
                    <AlertTriangle className="w-5 h-5" />
                    Active Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                        <div className="flex items-start gap-3">
                          <User className="mt-0.5 h-5 w-5 text-white/55" />
                          <div>
                            <div className="font-semibold text-white">{assignment.callerName}</div>
                            <div className="text-sm text-white/58">Patient / Caller</div>
                            {assignment.bloodGroup && assignment.bloodGroup !== 'Unknown' && (
                              <div className="mt-1 text-xs font-medium text-red-200">Blood: {assignment.bloodGroup}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                        <div className="flex items-start gap-3">
                          <Phone className="mt-0.5 h-5 w-5 text-white/55" />
                          <div>
                            <div className="font-semibold text-white">{assignment.callerPhone}</div>
                            <div className="text-sm text-white/58">Contact number</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 text-white/55" />
                          <div>
                            <div className="font-semibold text-white">{assignment.location.address || `${assignment.location.lat.toFixed(4)}, ${assignment.location.lng.toFixed(4)}`}</div>
                            <div className="text-sm text-white/58">Pickup location</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-4">
                          <Route className="mb-2 h-4 w-4 text-sky-300" />
                          <div className="text-sm text-white/58">Mission status</div>
                          <div className="mt-1 font-semibold uppercase text-white">{assignment.status.replace(/_/g, ' ')}</div>
                        </div>
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-4">
                          <Radio className="mb-2 h-4 w-4 text-emerald-300" />
                          <div className="text-sm text-white/58">Vehicle status</div>
                          <div className="mt-1 font-semibold uppercase text-white">{selectedAmbulance.status}</div>
                        </div>
                      </div>
                      <Button className="w-full gap-2 rounded-full bg-white text-slate-950 hover:bg-slate-100" variant="secondary">
                        <Navigation className="w-4 h-4" />
                        Open in Maps
                      </Button>
                    </div>
                  </div>

                  <div className="map-frame h-[320px] w-full">
                    <MapContainer center={[selectedAmbulance.location.lat, selectedAmbulance.location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedAmbulance.location.lat, selectedAmbulance.location.lng]} icon={ambulanceIcon}>
                        <Popup>Your Ambulance</Popup>
                      </Marker>
                      <Marker position={[assignment.location.lat, assignment.location.lng]} icon={patientIcon}>
                        <Popup>Patient Location</Popup>
                      </Marker>
                      {hospitals.map((hospital) => (
                        <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalMarkerIcon}>
                          <Popup>{hospital.name}</Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
