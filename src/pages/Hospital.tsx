import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Bed, Loader2, AlertTriangle, ArrowLeft, Ambulance, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/33/33777.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
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
        fetch('/api/ambulances')
      ]);
      
      if (!hospRes.ok || !allHospRes.ok || !incRes.ok || !ambRes.ok) throw new Error('Failed to fetch data');
      
      const hospData = await hospRes.json();
      const allHospData = await allHospRes.json();
      const incData = await incRes.json();
      const ambData = await ambRes.json();
      
      // Default to DMCH location if not provided
      if (!hospData.lat) hospData.lat = 23.7260;
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
        body: JSON.stringify({ id: hospital.id, availableBeds: newAvailable })
      });
      if (!res.ok) throw new Error('Failed to update beds');
      setHospital({ ...hospital, availableBeds: newAvailable });
    } catch (err) {
      alert('Failed to update beds');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !hospital) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !hospital) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Hospital</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Hospital Portal</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{hospital?.name}</CardTitle>
                <CardDescription>Emergency Room Capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bed className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-sm text-muted-foreground">Available ER Beds</div>
                        <div className="text-3xl font-bold">{hospital?.availableBeds} <span className="text-lg text-muted-foreground font-normal">/ {hospital?.totalBeds}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-accent/50 rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1">ICU Beds</div>
                      <div className="text-xl font-bold">{hospital?.availableIcuBeds || 0}</div>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1">Maternity Beds</div>
                      <div className="text-xl font-bold">{hospital?.availableMaternityBeds || 0}</div>
                    </div>
                  </div>
                  {hospital?.specialties && (
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Specialties</div>
                      <div className="flex flex-wrap gap-2">
                        {hospital.specialties.map((spec: string) => (
                          <span key={spec} className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Update Capacity</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => updateBeds((hospital?.availableBeds || 0) - 1)}
                      disabled={updating || hospital?.availableBeds === 0}
                    >
                      -1 Bed
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => updateBeds((hospital?.availableBeds || 0) + 1)}
                      disabled={updating || hospital?.availableBeds === hospital?.totalBeds}
                    >
                      +1 Bed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Live Map</CardTitle>
                <CardDescription>Incoming ambulances</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[300px]">
                {hospital && hospital.lat && hospital.lng && (
                  <MapContainer center={[hospital.lat, hospital.lng]} zoom={12} style={{ height: '100%', width: '100%', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {allHospitals.map(hosp => (
                      <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={hospitalIcon}>
                        <Popup>{hosp.name} {hosp.id === hospital.id ? '(This Hospital)' : ''}</Popup>
                      </Marker>
                    ))}
                    {ambulances.filter(a => a.status === 'dispatched' || a.status === 'busy').map(amb => (
                      <Marker key={amb.id} position={[amb.location.lat, amb.location.lng]} icon={ambulanceIcon}>
                        <Popup>{amb.plateNumber} ({amb.status})</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5" />
                  Incoming Emergencies
                </CardTitle>
                <CardDescription>Patients currently en route to this facility</CardDescription>
              </CardHeader>
              <CardContent>
                {incoming.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mb-4 opacity-20" />
                    <p>No incoming emergencies at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incoming.map(em => (
                      <div key={em.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{em.callerName}</span>
                            {em.bloodGroup && em.bloodGroup !== 'Unknown' && (
                              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-full">
                                {em.bloodGroup}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">Phone: {em.callerPhone}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-medium">Ambulance</div>
                            <div className="text-muted-foreground">{em.ambulancePlate || 'Pending'}</div>
                          </div>
                          <div className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 font-medium rounded-full uppercase text-xs">
                            {em.status.replace(/_/g, ' ')}
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
