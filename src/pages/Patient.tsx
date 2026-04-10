import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, MapPin, Clock, CreditCard, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4320/4320337.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Component to recenter map when location changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Patient() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState('Cardiac');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [area, setArea] = useState('Gulshan');
  
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState<any>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);

  const areas = [
    { name: 'Gulshan', lat: 23.7940, lng: 90.4125 },
    { name: 'Banani', lat: 23.7936, lng: 90.4066 },
    { name: 'Dhanmondi', lat: 23.7461, lng: 90.3742 },
    { name: 'Uttara', lat: 23.8759, lng: 90.3976 },
    { name: 'Mirpur', lat: 23.8223, lng: 90.3654 }
  ];

  useEffect(() => {
    // Load profile
    const savedProfile = localStorage.getItem('patientProfile');
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setName(p.name || '');
      setPhone(p.phone || '');
      setDob(p.dob || '');
      setBloodGroup(p.bloodGroup || 'Unknown');
      setEmergencyContact(p.emergencyContact || '');
    }
    
    fetchAmbulances();
    fetchHospitals();
    const interval = setInterval(fetchAmbulances, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAmbulances = async () => {
    try {
      const res = await fetch('/api/ambulances');
      if (res.ok) {
        setAmbulances(await res.json());
      }
    } catch (e) {}
  };

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/hospitals');
      if (res.ok) {
        setHospitals(await res.json());
      }
    } catch (e) {}
  };

  const handleLocateMe = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocating(false);
          setArea('Custom Location');
        },
        (error) => {
          console.error("Error getting location", error);
          setError("Could not get your location. Please select an area manually.");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLocating(false);
    }
  };

  const handleSOSClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Please fill in all required fields');
      return;
    }

    // Save profile
    localStorage.setItem('patientProfile', JSON.stringify({ name, phone, dob, bloodGroup, emergencyContact }));

    setEstimating(true);
    setError(null);

    try {
      let lat, lng;
      if (userLocation) {
        lat = userLocation.lat;
        lng = userLocation.lng;
      } else {
        const selectedArea = areas.find(a => a.name === area) || areas[0];
        lat = selectedArea.lat + (Math.random() - 0.5) * 0.01;
        lng = selectedArea.lng + (Math.random() - 0.5) * 0.01;
      }

      const res = await fetch('/api/estimate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (!res.ok) throw new Error('Failed to get estimation');
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setEstimation({ ...data, lat, lng });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setEstimating(false);
    }
  };

  const confirmAmbulance = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/request-ambulance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone, 
          lat: estimation.lat, 
          lng: estimation.lng,
          emergencyType,
          dob,
          bloodGroup,
          emergencyContact,
          estimatedFare: estimation.estimatedFareBDT
        })
      });

      if (!res.ok) throw new Error('Failed to submit request');
      
      setSuccess(true);
      setEstimation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedArea = areas.find(a => a.name === area) || areas[0];

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
            <div className="p-2 bg-green-500/10 rounded-lg">
              <User className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Portal</h1>
          </div>
        </div>

        {success ? (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Emergency Request Sent</h2>
              <p className="text-muted-foreground">
                An ambulance has been dispatched to your location. Please stay calm and keep your phone nearby.
              </p>
              
              <div className="w-full h-[300px] rounded-lg overflow-hidden border mt-4">
                <MapContainer center={[estimation?.lat || (userLocation?.lat || selectedArea.lat), estimation?.lng || (userLocation?.lng || selectedArea.lng)]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater center={[estimation?.lat || (userLocation?.lat || selectedArea.lat), estimation?.lng || (userLocation?.lng || selectedArea.lng)]} />
                  <Marker position={[estimation?.lat || (userLocation?.lat || selectedArea.lat), estimation?.lng || (userLocation?.lng || selectedArea.lng)]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  {ambulances.map(amb => (
                    <Marker key={amb.id} position={[amb.location.lat, amb.location.lng]} icon={ambulanceIcon}>
                      <Popup>{amb.plateNumber} ({amb.status})</Popup>
                    </Marker>
                  ))}
                  {hospitals.map(hosp => (
                    <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={hospitalIcon}>
                      <Popup>{hosp.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <Button onClick={() => setSuccess(false)} variant="outline" className="mt-4">
                Make Another Request
              </Button>
            </CardContent>
          </Card>
        ) : estimation ? (
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-amber-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirm Ambulance
              </CardTitle>
              <CardDescription>Review the estimated time and fare before confirming.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                  <Clock className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Estimated Arrival</div>
                    <div className="text-2xl font-bold">{estimation.estimatedTimeMins} mins</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                  <CreditCard className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Estimated Fare</div>
                    <div className="text-2xl font-bold">৳{estimation.estimatedFareBDT}</div>
                  </div>
                </div>
              </div>

              <div className="w-full h-[250px] rounded-lg overflow-hidden border">
                <MapContainer center={[estimation.lat, estimation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater center={[estimation.lat, estimation.lng]} />
                  <Marker position={[estimation.lat, estimation.lng]}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                  {ambulances.map(amb => (
                    <Marker key={amb.id} position={[amb.location.lat, amb.location.lng]} icon={ambulanceIcon}>
                      <Popup>{amb.plateNumber}</Popup>
                    </Marker>
                  ))}
                  {hospitals.map(hosp => (
                    <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={hospitalIcon}>
                      <Popup>{hosp.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setEstimation(null)} disabled={submitting}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={confirmAmbulance} disabled={submitting}>
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Dispatch'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Request Emergency Assistance
                </CardTitle>
                <CardDescription>
                  If this is a life-threatening emergency, please call 999 immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSOSClick} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Patient Full Name *</label>
                      <input 
                        type="text" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="e.g. Rahim Uddin"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={estimating}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number *</label>
                        <input 
                          type="tel" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="017XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={estimating}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Emergency Contact</label>
                        <input 
                          type="tel" 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="017XXXXXXXX"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          disabled={estimating}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date of Birth</label>
                      <input 
                        type="date" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        disabled={estimating}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Blood Group</label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        disabled={estimating}
                      >
                        <option value="Unknown">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Emergency Type</label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={emergencyType}
                        onChange={(e) => setEmergencyType(e.target.value)}
                        disabled={estimating}
                      >
                        <option value="Cardiac">Cardiac Arrest / Chest Pain</option>
                        <option value="Trauma">Accident / Trauma</option>
                        <option value="Maternity">Maternity / Labor</option>
                        <option value="Respiratory">Respiratory Issue</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Pickup Area (Dhaka)
                    </label>
                    <div className="flex gap-2">
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={area}
                        onChange={(e) => {
                          setArea(e.target.value);
                          setUserLocation(null);
                        }}
                        disabled={estimating || !!userLocation}
                      >
                        {userLocation && <option value="Custom Location">Using GPS Location</option>}
                        {areas.map(a => (
                          <option key={a.name} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                      <Button 
                        type="button" 
                        variant={userLocation ? "default" : "outline"}
                        onClick={handleLocateMe}
                        disabled={locating || estimating}
                        className="shrink-0"
                      >
                        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
                        {userLocation ? "Located" : "Locate Me"}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      disabled={estimating}
                    >
                      {estimating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Locating Nearest Ambulance...
                        </>
                      ) : (
                        'SOS - FIND AMBULANCE'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Live Area Map</CardTitle>
                <CardDescription>Available ambulances in your vicinity</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[450px]">
                <MapContainer center={[userLocation?.lat || selectedArea.lat, userLocation?.lng || selectedArea.lng]} zoom={13} style={{ height: '100%', width: '100%', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater center={[userLocation?.lat || selectedArea.lat, userLocation?.lng || selectedArea.lng]} />
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}
                  {ambulances.map(amb => (
                    <Marker key={amb.id} position={[amb.location.lat, amb.location.lng]} icon={ambulanceIcon}>
                      <Popup>{amb.plateNumber} ({amb.status})</Popup>
                    </Marker>
                  ))}
                  {hospitals.map(hosp => (
                    <Marker key={hosp.id} position={[hosp.lat, hosp.lng]} icon={hospitalIcon}>
                      <Popup>{hosp.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
