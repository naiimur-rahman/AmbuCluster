import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, MapPin, Clock, CreditCard, Navigation, ShieldPlus, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/4320/4320337.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const fieldClassName = 'flex h-11 w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-2 text-sm text-white placeholder:text-white/35';

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const areas = [
    { name: 'Gulshan', lat: 23.794, lng: 90.4125 },
    { name: 'Banani', lat: 23.7936, lng: 90.4066 },
    { name: 'Dhanmondi', lat: 23.7461, lng: 90.3742 },
    { name: 'Uttara', lat: 23.8759, lng: 90.3976 },
    { name: 'Mirpur', lat: 23.8223, lng: 90.3654 },
  ];

  useEffect(() => {
    const savedProfile = localStorage.getItem('patientProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setDob(profile.dob || '');
      setBloodGroup(profile.bloodGroup || 'Unknown');
      setEmergencyContact(profile.emergencyContact || '');
    }

    fetchAmbulances();
    fetchHospitals();
    const interval = setInterval(fetchAmbulances, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAmbulances = async () => {
    try {
      const res = await fetch('/api/ambulances');
      if (res.ok) setAmbulances(await res.json());
    } catch {}
  };

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/hospitals');
      if (res.ok) setHospitals(await res.json());
    } catch {}
  };

  const handleLocateMe = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocating(false);
          setArea('Custom Location');
        },
        () => {
          setError('Could not get your location. Please select an area manually.');
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };

  const handleSOSClick = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name || !phone) {
      setError('Please fill in all required fields');
      return;
    }

    localStorage.setItem('patientProfile', JSON.stringify({ name, phone, dob, bloodGroup, emergencyContact }));
    setEstimating(true);
    setError(null);

    try {
      let lat;
      let lng;
      if (userLocation) {
        lat = userLocation.lat;
        lng = userLocation.lng;
      } else {
        const selectedArea = areas.find((candidate) => candidate.name === area) || areas[0];
        lat = selectedArea.lat + (Math.random() - 0.5) * 0.01;
        lng = selectedArea.lng + (Math.random() - 0.5) * 0.01;
      }

      const res = await fetch('/api/estimate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
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
          estimatedFare: estimation.estimatedFareBDT,
        }),
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

  const selectedArea = areas.find((candidate) => candidate.name === area) || areas[0];
  const currentCenter: [number, number] = [userLocation?.lat || selectedArea.lat, userLocation?.lng || selectedArea.lng];

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
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-3">
                  <User className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <span className="section-kicker">Patient SOS</span>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">Fast emergency access</h1>
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Request urgent transport with location detection, estimated arrival, and live ambulance context before dispatch confirmation.
            </p>
          </div>

          <div className="grid w-full gap-3 md:max-w-md md:grid-cols-2">
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Ambulances visible</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{ambulances.length}</p>
              <p className="mt-1 text-sm text-white/58">Units shown near your selected area</p>
            </div>
            <div className="metric-tile">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Selected location</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{userLocation ? 'GPS' : area}</p>
              <p className="mt-1 text-sm text-white/58">{userLocation ? 'Using live device location' : 'Dhaka pickup area preset'}</p>
            </div>
          </div>
        </div>

        {success ? (
          <Card className="premium-card border-emerald-400/20 bg-emerald-500/6">
            <CardContent className="flex flex-col items-center space-y-4 pt-8 text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-300" />
              <h2 className="text-2xl font-bold text-white">Emergency request sent</h2>
              <p className="max-w-xl text-white/68">
                An ambulance has been dispatched to your location. Stay calm, keep your phone nearby, and prepare your emergency information.
              </p>

              <div className="map-frame mt-4 h-[320px] w-full">
                <MapContainer center={[estimation?.lat || currentCenter[0], estimation?.lng || currentCenter[1]]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater center={[estimation?.lat || currentCenter[0], estimation?.lng || currentCenter[1]]} />
                  <Marker position={[estimation?.lat || currentCenter[0], estimation?.lng || currentCenter[1]]}>
                    <Popup>Your Location</Popup>
                  </Marker>
                  {ambulances.map((ambulance) => (
                    <Marker key={ambulance.id} position={[ambulance.location.lat, ambulance.location.lng]} icon={ambulanceIcon}>
                      <Popup>{ambulance.plateNumber} ({ambulance.status})</Popup>
                    </Marker>
                  ))}
                  {hospitals.map((hospital) => (
                    <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon}>
                      <Popup>{hospital.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <Button onClick={() => setSuccess(false)} variant="outline" className="mt-2 rounded-full border-white/12 bg-white/6 text-white hover:bg-white/10">
                Make Another Request
              </Button>
            </CardContent>
          </Card>
        ) : estimation ? (
          <Card className="premium-card border-amber-400/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-200">
                <AlertTriangle className="w-5 h-5" />
                Confirm Ambulance
              </CardTitle>
              <CardDescription>Review the estimated time and fare before confirming dispatch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                  <Clock className="mb-3 h-8 w-8 text-primary" />
                  <div className="text-sm text-white/58">Estimated Arrival</div>
                  <div className="text-2xl font-bold text-white">{estimation.estimatedTimeMins} mins</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                  <CreditCard className="mb-3 h-8 w-8 text-primary" />
                  <div className="text-sm text-white/58">Estimated Fare</div>
                  <div className="text-2xl font-bold text-white">৳{estimation.estimatedFareBDT}</div>
                </div>
              </div>

              <div className="map-frame h-[280px] w-full">
                <MapContainer center={[estimation.lat, estimation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapUpdater center={[estimation.lat, estimation.lng]} />
                  <Marker position={[estimation.lat, estimation.lng]}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                  {ambulances.map((ambulance) => (
                    <Marker key={ambulance.id} position={[ambulance.location.lat, ambulance.location.lng]} icon={ambulanceIcon}>
                      <Popup>{ambulance.plateNumber}</Popup>
                    </Marker>
                  ))}
                  {hospitals.map((hospital) => (
                    <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon}>
                      <Popup>{hospital.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 rounded-full border-white/12 bg-white/6 text-white hover:bg-white/10" onClick={() => setEstimation(null)} disabled={submitting}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-full bg-orange-400 text-slate-950 hover:bg-orange-300" onClick={confirmAmbulance} disabled={submitting}>
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Dispatch'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-200">
                  <ShieldPlus className="w-5 h-5" />
                  Request Emergency Assistance
                </CardTitle>
                <CardDescription>If this is a life-threatening emergency, call 999 immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSOSClick} className="space-y-4">
                  {error && (
                    <div className="rounded-2xl border border-red-400/15 bg-red-500/10 p-3 text-sm text-red-100">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/82">Patient Full Name *</label>
                      <input
                        type="text"
                        className={fieldClassName}
                        placeholder="e.g. Rahim Uddin"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={estimating}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/82">Phone Number *</label>
                        <input
                          type="tel"
                          className={fieldClassName}
                          placeholder="017XXXXXXXX"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          disabled={estimating}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/82">Emergency Contact</label>
                        <input
                          type="tel"
                          className={fieldClassName}
                          placeholder="017XXXXXXXX"
                          value={emergencyContact}
                          onChange={(event) => setEmergencyContact(event.target.value)}
                          disabled={estimating}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/82">Date of Birth</label>
                      <input type="date" className={fieldClassName} value={dob} onChange={(event) => setDob(event.target.value)} disabled={estimating} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/82">Blood Group</label>
                      <select className={fieldClassName} value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)} disabled={estimating}>
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
                      <label className="text-sm font-medium text-white/82">Emergency Type</label>
                      <select className={fieldClassName} value={emergencyType} onChange={(event) => setEmergencyType(event.target.value)} disabled={estimating}>
                        <option value="Cardiac">Cardiac Arrest / Chest Pain</option>
                        <option value="Trauma">Accident / Trauma</option>
                        <option value="Maternity">Maternity / Labor</option>
                        <option value="Respiratory">Respiratory Issue</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/82">
                      <MapPin className="h-4 w-4 text-emerald-200" />
                      Pickup Area (Dhaka)
                    </div>
                    <div className="flex gap-2">
                      <select
                        className={fieldClassName}
                        value={area}
                        onChange={(event) => {
                          setArea(event.target.value);
                          setUserLocation(null);
                        }}
                        disabled={estimating || !!userLocation}
                      >
                        {userLocation && <option value="Custom Location">Using GPS Location</option>}
                        {areas.map((entry) => (
                          <option key={entry.name} value={entry.name}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant={userLocation ? 'default' : 'outline'}
                        onClick={handleLocateMe}
                        disabled={locating || estimating}
                        className="shrink-0 rounded-full border-white/12 bg-white/6 text-white hover:bg-white/10"
                      >
                        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
                        {userLocation ? 'Located' : 'Locate Me'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 sm:grid-cols-2">
                    <div>
                      <HeartPulse className="mb-2 h-4 w-4 text-rose-300" />
                      <p className="text-sm font-medium text-white">Priority capture</p>
                      <p className="mt-1 text-sm text-white/58">Share enough information for a faster and safer dispatch decision.</p>
                    </div>
                    <div>
                      <Navigation className="mb-2 h-4 w-4 text-cyan-300" />
                      <p className="text-sm font-medium text-white">Location-aware routing</p>
                      <p className="mt-1 text-sm text-white/58">Use GPS or a nearby area preset if precise coordinates are unavailable.</p>
                    </div>
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-full bg-emerald-400 text-base font-semibold text-slate-950 hover:bg-emerald-300" disabled={estimating}>
                    {estimating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Locating Nearest Ambulance...
                      </>
                    ) : (
                      'SOS - Find Ambulance'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="premium-card hidden md:block">
              <CardHeader>
                <CardTitle>Live Area Map</CardTitle>
                <CardDescription>Available ambulances and hospitals around your selected pickup zone</CardDescription>
              </CardHeader>
              <CardContent className="h-[560px] p-0">
                <div className="map-frame h-full">
                  <MapContainer center={currentCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapUpdater center={currentCenter} />
                    {userLocation && (
                      <Marker position={[userLocation.lat, userLocation.lng]}>
                        <Popup>Your Location</Popup>
                      </Marker>
                    )}
                    {ambulances.map((ambulance) => (
                      <Marker key={ambulance.id} position={[ambulance.location.lat, ambulance.location.lng]} icon={ambulanceIcon}>
                        <Popup>{ambulance.plateNumber} ({ambulance.status})</Popup>
                      </Marker>
                    ))}
                    {hospitals.map((hospital) => (
                      <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon}>
                        <Popup>{hospital.name}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
