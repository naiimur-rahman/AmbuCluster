import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, Loader2, AlertTriangle, ArrowLeft, MapPin, Navigation, User, Phone } from 'lucide-react';
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

const patientIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673221.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface Ambulance {
  id: string;
  plateNumber: string;
  status: string;
  driver: string;
  location: { lat: number, lng: number };
}

interface IncomingEmergency {
  id: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  bloodGroup: string;
  assignedAmbulanceId: string | null;
  status: string;
  location: { lat: number, lng: number, address: string };
}

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
        fetch('/api/hospitals')
      ]);
      
      if (!ambRes.ok || !incRes.ok || !hospRes.ok) throw new Error('Failed to fetch data');
      
      const ambData = await ambRes.json();
      const incData = await incRes.json();
      const hospData = await hospRes.json();
      
      setAmbulances(ambData);
      setHospitals(hospData);
      
      if (selectedAmbulance) {
        const updated = ambData.find((a: Ambulance) => a.id === selectedAmbulance.id);
        if (updated) setSelectedAmbulance(updated);
        
        const myAssignment = incData.find((e: IncomingEmergency) => e.assignedAmbulanceId === selectedAmbulance.id);
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
        body: JSON.stringify({ id: selectedAmbulance.id, status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchData();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && ambulances.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && ambulances.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Truck className="w-6 h-6 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Driver Portal</h1>
          </div>
        </div>

        {!selectedAmbulance ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Vehicle</CardTitle>
              <CardDescription>Choose the ambulance you are operating today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ambulances.map(amb => (
                  <Button
                    key={amb.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => setSelectedAmbulance(amb)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Truck className="w-5 h-5 text-muted-foreground" />
                      <span className="font-bold text-lg">{amb.plateNumber}</span>
                    </div>
                    <div className="text-sm text-muted-foreground text-left">
                      Assigned to: {amb.driver}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setSelectedAmbulance(null)} className="mb-4">
              &larr; Change Vehicle
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-6 h-6" />
                  Vehicle {selectedAmbulance.plateNumber}
                </CardTitle>
                <CardDescription>Current Status: <span className="font-bold uppercase">{selectedAmbulance.status}</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button 
                    variant={selectedAmbulance.status.toLowerCase() === 'available' ? 'default' : 'outline'}
                    className="h-16 text-sm"
                    onClick={() => updateStatus('available')}
                    disabled={updating}
                  >
                    AVAILABLE
                  </Button>
                  <Button 
                    variant={selectedAmbulance.status.toLowerCase() === 'dispatched' ? 'default' : 'outline'}
                    className="h-16 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => updateStatus('dispatched')}
                    disabled={updating}
                  >
                    EN ROUTE
                  </Button>
                  <Button 
                    variant={selectedAmbulance.status.toLowerCase() === 'on_scene' ? 'default' : 'outline'}
                    className="h-16 text-sm bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => updateStatus('on_scene')}
                    disabled={updating}
                  >
                    ON SCENE
                  </Button>
                  <Button 
                    variant={selectedAmbulance.status.toLowerCase() === 'en_route_hospital' ? 'default' : 'outline'}
                    className="h-16 text-sm bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => updateStatus('en_route_hospital')}
                    disabled={updating}
                  >
                    TO HOSPITAL
                  </Button>
                  <Button 
                    variant={selectedAmbulance.status.toLowerCase() === 'at_hospital' ? 'default' : 'outline'}
                    className="h-16 text-sm bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => updateStatus('at_hospital')}
                    disabled={updating}
                  >
                    AT HOSPITAL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {assignment && (
              <Card className="border-amber-500/50">
                <CardHeader className="bg-amber-500/5 border-b border-amber-500/20">
                  <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="w-5 h-5" />
                    Active Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-semibold">{assignment.callerName}</div>
                          <div className="text-sm text-muted-foreground">Patient / Caller</div>
                          {assignment.bloodGroup && assignment.bloodGroup !== 'Unknown' && (
                            <div className="text-xs font-medium text-red-500 mt-1">Blood: {assignment.bloodGroup}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-semibold">{assignment.callerPhone}</div>
                          <div className="text-sm text-muted-foreground">Contact Number</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-semibold">Lat: {assignment.location.lat.toFixed(4)}, Lng: {assignment.location.lng.toFixed(4)}</div>
                          <div className="text-sm text-muted-foreground">Pickup Location</div>
                        </div>
                      </div>
                      <Button className="w-full gap-2" variant="secondary">
                        <Navigation className="w-4 h-4" />
                        Open in Maps
                      </Button>
                    </div>
                  </div>
                  
                  <div className="w-full h-[300px] rounded-lg overflow-hidden border mt-4">
                    <MapContainer center={[selectedAmbulance.location.lat, selectedAmbulance.location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedAmbulance.location.lat, selectedAmbulance.location.lng]} icon={ambulanceIcon}>
                        <Popup>Your Ambulance</Popup>
                      </Marker>
                      <Marker position={[assignment.location.lat, assignment.location.lng]} icon={patientIcon}>
                        <Popup>Patient Location</Popup>
                      </Marker>
                      {hospitals.map(hosp => (
                        <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={new L.Icon({
                          iconUrl: 'https://cdn-icons-png.flaticon.com/512/33/33777.png',
                          iconSize: [32, 32],
                          iconAnchor: [16, 16]
                        })}>
                          <Popup>{hosp.name}</Popup>
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
