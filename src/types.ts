export type AmbulanceStatus = 'available' | 'busy' | 'maintenance' | 'en-route';

export interface Ambulance {
  id: string;
  plateNumber: string;
  type: 'ALS' | 'BLS'; // Advanced Life Support, Basic Life Support
  status: AmbulanceStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  driver: string;
  lastMaintenance: string;
  batteryLevel: number;
  fuelLevel: number;
}

export interface EmergencyRequest {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  callerName: string;
  callerPhone: string;
  description: string;
  assignedAmbulanceId?: string;
  status: 'pending' | 'dispatched' | 'on-site' | 'completed';
}

export interface Cluster {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  radius: number; // in km
  ambulanceIds: string[];
  coverageScore: number; // 0-100
}
