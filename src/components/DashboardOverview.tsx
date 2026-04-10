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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">Real-time monitoring of emergency response fleet.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
            <Clock className="w-3 h-3 mr-1" /> Last updated: Just now
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Incidents</CardTitle>
            <AlertTriangle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmergencies}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-red-500" /> +2 since last hour
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fleet Availability</CardTitle>
            <Truck className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableAmbulances} / {ambulances.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((availableAmbulances / ambulances.length) * 100)}% of fleet ready
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Response Time</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}m</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500 rotate-180" /> -1.2m improvement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clusters</CardTitle>
            <Activity className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clusters.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Optimizing coverage across zones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Incident Volume</CardTitle>
            <CardDescription>Emergency requests over the last 12 hours.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Response Performance</CardTitle>
            <CardDescription>Average response time (minutes) by hour.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="responseTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Recent Emergency Dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emergencies.slice(0, 3).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-lg bg-accent/30 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      req.severity === 'critical' ? 'bg-red-500/20 text-red-500' : 
                      req.severity === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{req.location.address}</p>
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={req.status === 'dispatched' ? 'default' : 'secondary'}>
                      {req.status.toUpperCase()}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
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
