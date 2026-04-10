import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Ambulance, 
  Cluster 
} from '../types';
import { 
  Activity, 
  Target, 
  Zap, 
  Shield, 
  Info,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Tooltip as RechartsTooltip
} from 'recharts';

interface Props {
  clusters: Cluster[];
  ambulances: Ambulance[];
}

const radarData = [
  { subject: 'Response Time', A: 120, fullMark: 150 },
  { subject: 'Coverage', A: 98, fullMark: 150 },
  { subject: 'Efficiency', A: 86, fullMark: 150 },
  { subject: 'Resource Use', A: 99, fullMark: 150 },
  { subject: 'Reliability', A: 85, fullMark: 150 },
];

export default function ClusteringView({ clusters, ambulances }: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cluster Analysis</h1>
          <p className="text-muted-foreground">Optimization of fleet distribution based on historical demand and real-time data.</p>
        </div>
        <Button className="bg-primary">
          <Zap className="w-4 h-4 mr-2" /> Re-optimize Clusters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cluster List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clusters.map((cluster) => (
              <Card key={cluster.id} className="bg-card/50 border-border/50 overflow-hidden group">
                <div className="h-2 bg-primary/20">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${cluster.coverageScore}%` }} 
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cluster.name}</CardTitle>
                      <CardDescription className="text-xs">ID: {cluster.id}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {cluster.coverageScore}% Coverage
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Target className="w-4 h-4" /> Center
                    </span>
                    <span className="font-mono text-xs">{cluster.center.lat.toFixed(4)}, {cluster.center.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Radius
                    </span>
                    <span>{cluster.radius} km</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Units Assigned
                    </span>
                    <div className="flex -space-x-2">
                      {cluster.ambulanceIds.map((id) => (
                        <div key={id} className="w-6 h-6 rounded-full bg-accent border border-background flex items-center justify-center text-[8px] font-bold">
                          {id.split('-')[1]}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>Demand Pressure</span>
                      <span>High</span>
                    </div>
                    <Progress value={75} className="h-1" />
                  </div>

                  <Button variant="ghost" size="sm" className="w-full text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    View Detailed Analytics <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Optimization Logic</CardTitle>
              <CardDescription>How the AmbuCluster algorithm distributes your fleet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-4 p-4 rounded-lg bg-accent/30 border border-border/50">
                <div className="p-2 bg-blue-500/10 rounded-full h-fit">
                  <Info className="w-5 h-5 text-blue-500" />
                </div>
                <p>
                  The system uses a <strong>K-Means++</strong> clustering approach weighted by 
                  historical incident density and real-time traffic data. Clusters are 
                  dynamically adjusted every 15 minutes.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                  <p className="font-bold text-foreground mb-1">Density</p>
                  <p className="text-xs">Prioritizes areas with high call volume.</p>
                </div>
                <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                  <p className="font-bold text-foreground mb-1">Proximity</p>
                  <p className="text-xs">Minimizes travel distance from cluster centers.</p>
                </div>
                <div className="p-4 rounded-lg border border-border/50 bg-card/30">
                  <p className="font-bold text-foreground mb-1">Readiness</p>
                  <p className="text-xs">Considers fuel and maintenance status.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Metrics */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">System Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar
                    name="System"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm">Coverage Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Optimal', value: 65 },
                      { name: 'Under-served', value: 15 },
                      { name: 'Over-served', value: 20 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-[10px] uppercase tracking-tighter">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full" /> Optimal</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full" /> Under</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Over</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">AI Recommendation</p>
                  <p className="text-[10px] text-muted-foreground">Generated 2m ago</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Shift unit <strong>AMB-004</strong> to <strong>CL-2</strong> to compensate for 
                increased traffic congestion in Midtown East.
              </p>
              <Button size="sm" className="w-full">Apply Recommendation</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Separator = () => <div className="h-[1px] bg-border/50 my-4" />;
