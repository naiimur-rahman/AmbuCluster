import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  EmergencyRequest 
} from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Phone, 
  User, 
  MapPin,
  CheckCircle2,
  Timer,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Props {
  emergencies: EmergencyRequest[];
}

export default function EmergencyQueue({ emergencies }: Props) {
  const pending = emergencies.filter(e => e.status === 'pending');
  const active = emergencies.filter(e => e.status === 'dispatched' || e.status === 'on-site');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Queue</h1>
          <p className="text-muted-foreground">Manage incoming requests and dispatch units.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Avg. Wait Time</p>
            <p className="text-xl font-bold text-primary">02:45</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Active Calls</p>
            <p className="text-xl font-bold">{emergencies.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Timer className="w-5 h-5 text-orange-500" /> Pending Dispatch
              <Badge variant="secondary" className="ml-2">{pending.length}</Badge>
            </h2>
          </div>
          
          <div className="space-y-4">
            {pending.length > 0 ? pending.map((req) => (
              <Card key={req.id} className="bg-card/50 border-orange-500/20 hover:border-orange-500/50 transition-all group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{req.id}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Received {Math.floor((Date.now() - new Date(req.timestamp).getTime()) / 60000)}m ago
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="animate-pulse">
                      {req.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{req.location.address}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>{req.callerName} • {req.callerPhone}</span>
                    </div>
                    <p className="text-sm bg-accent/30 p-3 rounded italic text-muted-foreground">
                      "{req.description}"
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                      Auto-Dispatch Nearest
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Manual Dispatch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 bg-accent/10 rounded-lg border border-dashed border-border">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No pending requests. All units assigned.</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Incidents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Active Incidents
              <Badge variant="secondary" className="ml-2">{active.length}</Badge>
            </h2>
          </div>

          <div className="space-y-4">
            {active.map((req) => (
              <Card key={req.id} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{req.id}</h3>
                        <p className="text-xs text-muted-foreground">Assigned to: <span className="text-primary font-mono">{req.assignedAmbulanceId}</span></p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      {req.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {req.callerPhone}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {req.location.address.split(',')[0]}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 12m active
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: req.status === 'dispatched' ? '33%' : req.status === 'on-site' ? '66%' : '100%' }} 
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      Details <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
