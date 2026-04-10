import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Ambulance, 
  EmergencyRequest, 
  Cluster 
} from '../types';
import { 
  Activity, 
  Truck, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  MapPin
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface Props {
  ambulances: Ambulance[];
  emergencies: EmergencyRequest[];
  clusters: Cluster[];
}

const chartData = [
  { time: '08:00', requests: 4, responseTime: 8 },
  { time: '10:00', requests: 7, responseTime: 12 },
  { time: '12:00', requests: 12, responseTime: 15 },
  { time: '14:00', requests: 9, responseTime: 10 },
  { time: '16:00', requests: 15, responseTime: 18 },
  { time: '18:00', requests: 11, responseTime: 14 },
  { time: '20:00', requests: 6, responseTime: 9 },
];

export default function DashboardOverview({ ambulances, emergencies, clusters }: Props) {
  const activeEmergencies = emergencies.filter(e => e.status !== 'completed').length;
  const availableAmbulances = ambulances.filter(a => a.status === 'available').length;
  const avgResponseTime = 12.4; // Mock value
  const fleetReadyPercentage = ambulances.length ? Math.round((availableAmbulances / ambulances.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white">System Overview</h1>
          <p className="text-white/62">Real-time monitoring of emergency response fleet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/12 bg-white/6 px-3 py-1 text-white/74">
            <Clock className="w-3 h-3 mr-1" /> Last updated: Just now
          </Badge>
          <Badge variant="outline" className="border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-100">
            Fleet ready: {fleetReadyPercentage}%
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/58">Active Incidents</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-[-0.05em] text-white">{activeEmergencies}</div>
            <p className="text-xs text-white/58 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-red-500" /> +2 since last hour
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/58">Fleet Availability</CardTitle>
            <Truck className="w-4 h-4 text-emerald-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-[-0.05em] text-white">{availableAmbulances} / {ambulances.length}</div>
            <p className="text-xs text-white/58 mt-1">
              {fleetReadyPercentage}% of fleet ready
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/58">Avg. Response Time</CardTitle>
            <Clock className="w-4 h-4 text-cyan-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-[-0.05em] text-white">{avgResponseTime}m</div>
            <p className="text-xs text-white/58 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500 rotate-180" /> -1.2m improvement
            </p>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/58">Active Clusters</CardTitle>
            <Activity className="w-4 h-4 text-violet-300" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-[-0.05em] text-white">{clusters.length}</div>
            <p className="text-xs text-white/58 mt-1">
              Optimizing coverage across zones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Incident Volume</CardTitle>
            <CardDescription>Emergency requests over the last 12 hours.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(245, 122, 72, 0.55)" stopOpacity={1} />
                    <stop offset="95%" stopColor="rgba(245, 122, 72, 0)" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.48)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.48)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(14, 21, 38, 0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#f57a48" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Response Performance</CardTitle>
            <CardDescription>Average response time (minutes) by hour.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.48)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.48)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(14, 21, 38, 0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}
                />
                <Bar dataKey="responseTime" fill="#6fe3ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="premium-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Emergency Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emergencies.slice(0, 3).map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      req.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 
                      req.severity === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{req.location.address}</p>
                      <p className="text-xs text-white/58">{req.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={req.status === 'dispatched' ? 'default' : 'secondary'}>
                      {req.status.toUpperCase()}
                    </Badge>
                    <p className="text-[10px] text-white/42 mt-1">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['available', 'busy', 'en-route', 'maintenance'].map((status) => {
                const count = ambulances.filter(a => a.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'available' ? 'bg-green-500' :
                        status === 'busy' ? 'bg-red-500' :
                        status === 'en-route' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm capitalize">{status}</span>
                    </div>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
