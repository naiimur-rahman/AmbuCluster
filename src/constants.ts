import { Ambulance, EmergencyRequest, Cluster } from './types';

export const MOCK_AMBULANCES: Ambulance[] = [
  {
    id: 'AMB-001',
    plateNumber: 'NY-1234',
    type: 'ALS',
    status: 'available',
    location: { lat: 40.7128, lng: -74.0060, address: 'Downtown Manhattan' },
    driver: 'John Doe',
    lastMaintenance: '2024-03-15',
    batteryLevel: 95,
    fuelLevel: 80,
  },
  {
    id: 'AMB-002',
    plateNumber: 'NY-5678',
    type: 'BLS',
    status: 'busy',
    location: { lat: 40.7589, lng: -73.9851, address: 'Times Square' },
    driver: 'Jane Smith',
    lastMaintenance: '2024-03-10',
    batteryLevel: 45,
    fuelLevel: 60,
  },
  {
    id: 'AMB-003',
    plateNumber: 'NY-9012',
    type: 'ALS',
    status: 'en-route',
    location: { lat: 40.7829, lng: -73.9654, address: 'Central Park' },
    driver: 'Mike Ross',
    lastMaintenance: '2024-03-20',
    batteryLevel: 88,
    fuelLevel: 90,
  },
  {
    id: 'AMB-004',
    plateNumber: 'NY-3456',
    type: 'BLS',
    status: 'available',
    location: { lat: 40.7033, lng: -73.9968, address: 'Brooklyn Heights' },
    driver: 'Sarah Connor',
    lastMaintenance: '2024-03-01',
    batteryLevel: 100,
    fuelLevel: 100,
  },
  {
    id: 'AMB-005',
    plateNumber: 'NY-7890',
    type: 'BLS',
    status: 'maintenance',
    location: { lat: 40.7484, lng: -73.9857, address: 'Empire State' },
    driver: 'N/A',
    lastMaintenance: '2024-04-01',
    batteryLevel: 20,
    fuelLevel: 10,
  }
];

export const MOCK_EMERGENCIES: EmergencyRequest[] = [
  {
    id: 'REQ-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: 'critical',
    location: { lat: 40.7549, lng: -73.9840, address: 'Bryant Park' },
    callerName: 'Alice Johnson',
    callerPhone: '555-0101',
    description: 'Cardiac arrest reported near the library entrance.',
    status: 'dispatched',
    assignedAmbulanceId: 'AMB-003'
  },
  {
    id: 'REQ-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    severity: 'high',
    location: { lat: 40.7306, lng: -73.9352, address: 'Long Island City' },
    callerName: 'Bob Wilson',
    callerPhone: '555-0202',
    description: 'Multi-vehicle collision on Queensboro Bridge.',
    status: 'pending'
  }
];

export const MOCK_CLUSTERS: Cluster[] = [
  {
    id: 'CL-1',
    name: 'Manhattan South',
    center: { lat: 40.7128, lng: -74.0060 },
    radius: 2.5,
    ambulanceIds: ['AMB-001', 'AMB-004'],
    coverageScore: 85
  },
  {
    id: 'CL-2',
    name: 'Midtown East',
    center: { lat: 40.7549, lng: -73.9840 },
    radius: 1.8,
    ambulanceIds: ['AMB-002', 'AMB-003'],
    coverageScore: 92
  }
];
