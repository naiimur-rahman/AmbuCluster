import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Ambulance 
} from '../types';
import { 
  Truck, 
  Battery, 
  Fuel, 
  MoreVertical, 
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  ambulances: Ambulance[];
}

export default function FleetList({ ambulances }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ambulance Fleet</h1>
          <p className="text-muted-foreground">Manage and monitor all units in the service.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Truck className="w-4 h-4 mr-2" /> Add New Unit
        </Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Filter by ID, plate, or driver..." className="pl-10" />
              </div>
              <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                <ArrowUpDown className="w-3 h-3 mr-2" /> Sort
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-4 font-medium">Unit ID</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Location</th>
                  <th className="text-left p-4 font-medium">Resources</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {ambulances.map((amb) => (
                  <tr key={amb.id} className="hover:bg-accent/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Truck className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{amb.id}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{amb.plateNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={amb.status === 'available' ? 'outline' : 'default'}
                        className={
                          amb.status === 'available' ? 'border-green-500/50 text-green-500' :
                          amb.status === 'busy' ? 'bg-red-500 hover:bg-red-600' :
                          amb.status === 'en-route' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500'
                        }
                      >
                        {amb.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{amb.type}</span>
                    </td>
                    <td className="p-4">
                      <p className="max-w-[150px] truncate">{amb.location.address}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Fuel className={`w-3 h-3 ${amb.fuelLevel < 30 ? 'text-red-500' : 'text-muted-foreground'}`} />
                          <span className="text-xs font-mono">{amb.fuelLevel}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Battery className={`w-3 h-3 ${amb.batteryLevel < 30 ? 'text-red-500' : 'text-muted-foreground'}`} />
                          <span className="text-xs font-mono">{amb.batteryLevel}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
