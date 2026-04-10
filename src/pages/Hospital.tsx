import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Bed, Loader2, AlertTriangle, ArrowLeft, Ambulance, Clock, Building2, HeartPulse } from 'lucide-react';
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

const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/33/33777.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface HospitalData {
  id: string;
  name: string;
  totalBeds: number;
  availableBeds: number;
  availableIcuBeds?: number;
  availableMaternityBeds?: number;
  specialties?: string[];
  lat?: number;
  lng?: number;
}

interface IncomingEmergency {
  id: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  bloodGroup: string;
  ambulancePlate: string;
  status: string;
}

export default function Hospital() {
  const [hospital, setHospital] = useState<HospitalData | null>(null);
  const [allHospitals, setAllHospitals] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<IncomingEmergency[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [hospRes, allHospRes, incRes, ambRes] = await Promise.all([
        fetch('/api/hospital'),
        fetch('/api/hospitals'),
        fetch('/api/incoming-emergencies'),
        fetch('/api/ambulances'),
      ]);

      if (!hospRes.ok || !allHospRes.ok || !incRes.ok || !ambRes.ok) throw new Error('Failed to fetch data');

      const hospData = await hospRes.json();
      const allHospData = await allHospRes.json();
      const incData = await incRes.json();
      const ambData = await ambRes.json();

      if (!hospData.lat) hospData.lat = 23.726;
      if (!hospData.lng) hospData.lng = 90.3976;

      setHospital(hospData);
      setAllHospitals(allHospData);
      setIncoming(incData);
      setAmbulances(ambData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateBeds = async (newAvailable: number) => {
    if (!hospital || newAvailable < 0 || newAvailable > hospital.totalBeds) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/update-hospital-beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hospital.id, availableBeds: newAvailable }),
      });
      if (!res.ok) throw new Error('Failed to update beds');
      setHospital({ ...hospital, availableBeds: newAvailable });
    } catch {
      alert('Failed to update beds');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !hospital) {
    return (
      <div className="portal-shell flex items-center justify-center">
        <div className="premium-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/70">Loading hospital telemetry...</p>
        </div>
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="portal-shell flex items-center justify-center">
        <div className="premium-card max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-2xl font-bold">Error Loading Hospital</h2>
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
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-3">
                  <Activity className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <span className="section-kicker">Hospital Operations</span>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Capacity and inbound flow</h1>
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Keep emergency intake synchronized with bed availability, specialties, and ambulances arriving in real time.
            </p>
          </div>

          <div className="grid w-full gap-3 md:max-w-md md:grid-cols-2">
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Available beds</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{hospital?.availableBeds ?? 0}</p>
              <p className="mt-1 text-sm text-white/58">Out of {hospital?.totalBeds ?? 0} total ER beds</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Incoming cases</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{incoming.length}</p>
              <p className="mt-1 text-sm text-white/58">Ambulances currently routed here</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-300" />
                  {hospital?.name}
                </CardTitle>
                <CardDescription>Emergency room readiness snapshot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-3">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center gap-3">
                      <Bed className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-sm text-white/58">Available ER Beds</div>
                        <div className="text-3xl font-bold text-white">
                          {hospital?.availableBeds} <span className="text-lg font-normal text-white/45">/ {hospital?.totalBeds}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-3">
                      <div className="mb-1 text-xs text-white/45">ICU Beds</div>
                      <div className="text-xl font-bold text-white">{hospital?.availableIcuBeds || 0}</div>
                    </div>
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/6 p-3">
                      <div className="mb-1 text-xs text-white/45">Maternity Beds</div>
                      <div className="text-xl font-bold text-white">{hospital?.availableMaternityBeds || 0}</div>
                    </div>
                  </div>

                  {hospital?.specialties && (
                    <div className="pt-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                        <HeartPulse className="h-3.5 w-3.5 text-cyan-300" />
                        Specialties
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hospital.specialties.map((spec: string) => (
                          <span key={spec} className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/55">Update Capacity</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/12 bg-white/6 text-white hover:bg-white/10"
                      onClick={() => updateBeds((hospital?.availableBeds || 0) - 1)}
                      disabled={updating || hospital?.availableBeds === 0}
                    >
                      -1 Bed
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-white/12 bg-white/6 text-white hover:bg-white/10"
                      onClick={() => updateBeds((hospital?.availableBeds || 0) + 1)}
                      disabled={updating || hospital?.availableBeds === hospital?.totalBeds}
                    >
                      +1 Bed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Live Intake Map</CardTitle>
                <CardDescription>Incoming ambulances and nearby hospitals</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-0">
                {hospital && hospital.lat && hospital.lng && (
                  <div className="map-frame h-full">
                    <MapContainer center={[hospital.lat, hospital.lng]} zoom={12} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {allHospitals.map((hosp) => (
                        <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={hospitalIcon}>
                          <Popup>{hosp.name} {hosp.id === hospital.id ? '(This Hospital)' : ''}</Popup>
                        </Marker>
                      ))}
                      {ambulances.filter((ambulance) => ambulance.status === 'dispatched' || ambulance.status === 'busy').map((ambulance) => (
                        <Marker key={ambulance.id} position={[ambulance.location.lat, ambulance.location.lng]} icon={ambulanceIcon}>
                          <Popup>{ambulance.plateNumber} ({ambulance.status})</Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="premium-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-orange-300" />
                  Incoming Emergencies
                </CardTitle>
                <CardDescription>Patients currently en route to this facility</CardDescription>
              </CardHeader>
              <CardContent>
                {incoming.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-white/52">
                    <Clock className="mb-4 h-12 w-12 opacity-20" />
                    <p>No incoming emergencies at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incoming.map((emergency) => (
                      <div key={emergency.id} className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-white">{emergency.callerName}</span>
                            {emergency.bloodGroup && emergency.bloodGroup !== 'Unknown' && (
                              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-200">
                                {emergency.bloodGroup}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white/58">Phone: {emergency.callerPhone}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-medium text-white">Ambulance</div>
                            <div className="text-white/58">{emergency.ambulancePlate || 'Pending'}</div>
                          </div>
                          <div className="rounded-full bg-amber-500/12 px-3 py-1 text-xs font-medium uppercase text-amber-200">
                            {emergency.status.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
