import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Ambulance, 
  EmergencyRequest 
} from '../types';
import { 
  MapPin, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Layers,
  Crosshair,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Props {
  ambulances: Ambulance[];
  emergencies: EmergencyRequest[];
}

export default function FleetMap({ ambulances, emergencies }: Props) {
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Map bounds (mocking Manhattan area)
  const bounds = {
    minLat: 40.70,
    maxLat: 40.80,
    minLng: -74.02,
    maxLng: -73.92
  };

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  const selectedAmbulance = ambulances.find(a => a.id === selectedId);
  const selectedEmergency = emergencies.find(e => e.id === selectedId);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Fleet Map</h1>
          <p className="text-muted-foreground">Real-time tactical positioning of all units.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-full border border-white/12 bg-white/6 p-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-1.5 hover:bg-accent rounded"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-1.5 hover:bg-accent rounded"><ZoomOut className="w-4 h-4" /></button>
          </div>
          <button className="flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-sm hover:bg-white/10">
            <Layers className="w-4 h-4" /> Layers
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Map Area */}
        <Card className="premium-card lg:col-span-3 relative overflow-hidden group">
          <CardContent className="p-0 h-full relative">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
              style={{ 
                backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', 
                backgroundSize: `${20 * zoom}px ${20 * zoom}px` 
              }} 
            />
            
            {/* Tactical SVG Map */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Mock City Blocks */}
              <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              <line x1="30" y1="10" x2="30" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              <line x1="70" y1="10" x2="70" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              <line x1="10" y1="30" x2="90" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              <line x1="10" y1="70" x2="90" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />

              {/* Emergencies */}
              {emergencies.map(req => {
                const pos = project(req.location.lat, req.location.lng);
                return (
                  <g key={req.id} onClick={() => setSelectedId(req.id)} className="cursor-pointer">
                    <circle cx={pos.x} cy={pos.y} r="1.5" fill="rgba(239, 68, 68, 0.2)" className="animate-pulse" />
                    <circle cx={pos.x} cy={pos.y} r="0.5" fill="#ef4444" />
                    {selectedId === req.id && (
                      <circle cx={pos.x} cy={pos.y} r="2.5" fill="none" stroke="#ef4444" strokeWidth="0.2" className="animate-ping" />
                    )}
                  </g>
                );
              })}

              {/* Ambulances */}
              {ambulances.map(amb => {
                const pos = project(amb.location.lat, amb.location.lng);
                return (
                  <g key={amb.id} onClick={() => setSelectedId(amb.id)} className="cursor-pointer">
                    <rect 
                      x={pos.x - 0.75} y={pos.y - 0.75} width="1.5" height="1.5" 
                      fill={amb.status === 'available' ? '#22c55e' : amb.status === 'busy' ? '#ef4444' : '#3b82f6'} 
                      rx="0.2"
                    />
                    {selectedId === amb.id && (
                      <rect 
                        x={pos.x - 1.25} y={pos.y - 1.25} width="2.5" height="2.5" 
                        fill="none" stroke="white" strokeWidth="0.2" 
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Map Overlay Info */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-[10px] space-y-1 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-sm" /> <span>Available Unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-sm" /> <span>Busy Unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-sm" /> <span>En-route Unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" /> <span>Emergency Incident</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Selection Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedId ? (
                <div className="space-y-4">
                  {selectedAmbulance ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Truck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{selectedAmbulance.id}</p>
                          <p className="text-xs text-muted-foreground">{selectedAmbulance.plateNumber}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant={selectedAmbulance.status === 'available' ? 'outline' : 'default'} className="mt-1">
                            {selectedAmbulance.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium mt-1">{selectedAmbulance.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Fuel</p>
                          <p className="font-medium mt-1">{selectedAmbulance.fuelLevel}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Battery</p>
                          <p className="font-medium mt-1">{selectedAmbulance.batteryLevel}%</p>
                        </div>
                      </div>
                      <Button className="w-full mt-2 rounded-full bg-white text-slate-950 hover:bg-slate-100" size="sm">
                        <Navigation className="w-4 h-4 mr-2" /> Dispatch Commands
                      </Button>
                    </>
                  ) : selectedEmergency ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-bold">{selectedEmergency.id}</p>
                          <p className="text-xs text-muted-foreground">{selectedEmergency.severity.toUpperCase()} PRIORITY</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium">{selectedEmergency.location.address}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Description</p>
                          <p className="font-medium">{selectedEmergency.description}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Caller</p>
                          <p className="font-medium">{selectedEmergency.callerName} ({selectedEmergency.callerPhone})</p>
                        </div>
                      </div>
                      <Button variant="destructive" className="w-full mt-2 rounded-full" size="sm">
                        <Crosshair className="w-4 h-4 mr-2" /> Assign Nearest Unit
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Select a unit or incident on the map to view details.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Units</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto px-4 pb-4 space-y-2">
                {ambulances.map(amb => (
                  <button 
                    key={amb.id}
                    onClick={() => setSelectedId(amb.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                      selectedId === amb.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        amb.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{amb.id}</span>
                    </div>
                    <span className="text-muted-foreground">{amb.location.address.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
