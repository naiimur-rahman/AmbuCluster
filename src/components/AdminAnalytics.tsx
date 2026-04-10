import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Wrench, Ghost, Stethoscope, Loader2, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminAnalytics() {
  const [efficiency, setEfficiency] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [ghostTrips, setGhostTrips] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [effRes, maintRes, ghostRes, equipRes] = await Promise.all([
          fetch('/api/admin/efficiency'),
          fetch('/api/admin/maintenance'),
          fetch('/api/admin/ghost-trips'),
          fetch('/api/admin/equipment')
        ]);

        if (!effRes.ok || !maintRes.ok || !ghostRes.ok || !equipRes.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        setEfficiency(await effRes.json());
        setMaintenance(await maintRes.json());
        setGhostTrips(await ghostRes.json());
        setEquipment(await equipRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-destructive">
        <AlertTriangle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white">Advanced Analytics</h2>
        <p className="text-white/62">
          Insights from Materialized Views and System Logs
        </p>
      </div>

      <Tabs defaultValue="efficiency" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-[1.4rem] border border-white/10 bg-white/6 p-1">
          <TabsTrigger value="efficiency" className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Hospital Efficiency
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Predictive Maintenance
          </TabsTrigger>
          <TabsTrigger value="ghost" className="flex items-center gap-2">
            <Ghost className="w-4 h-4" /> Ghost Trips
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" /> Equipment Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="efficiency" className="mt-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Hospital Efficiency (MV_Hospital_Efficiency)</CardTitle>
              <CardDescription>Average turnaround times and case volumes per hospital.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Avg Turnaround (Mins)</TableHead>
                    <TableHead>Total Cases Handled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {efficiency.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center">No data available</TableCell></TableRow>
                  ) : (
                    efficiency.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.hospital_name}</TableCell>
                        <TableCell>{row.avg_turnaround_mins ? parseFloat(row.avg_turnaround_mins).toFixed(1) : 'N/A'}</TableCell>
                        <TableCell>{row.total_cases_handled}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Predictive Maintenance (MV_Predictive_Maintenance)</CardTitle>
              <CardDescription>Vehicles requiring service based on time and usage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Days Since Maintenance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center">No data available</TableCell></TableRow>
                  ) : (
                    maintenance.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.vehicle_number}</TableCell>
                        <TableCell>{row.days_since_maintenance}</TableCell>
                        <TableCell>
                          <Badge variant={row.maintenance_status === 'Critical' ? 'destructive' : row.maintenance_status === 'Due Soon' ? 'secondary' : 'default'}>
                            {row.maintenance_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ghost" className="mt-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Ghost Trips (V_Ghost_Trips)</CardTitle>
              <CardDescription>Ambulances moving without an active emergency assignment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Driver ID</TableHead>
                    <TableHead>Last Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ghostTrips.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No ghost trips detected.</TableCell></TableRow>
                  ) : (
                    ghostTrips.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.vehicle_number}</TableCell>
                        <TableCell>{row.driver_id}</TableCell>
                        <TableCell>{row.current_latitude}, {row.current_longitude}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>Current medical equipment stock across the fleet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Last Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center">No data available</TableCell></TableRow>
                  ) : (
                    equipment.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.vehicle_number}</TableCell>
                        <TableCell>{row.item_name}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{new Date(row.last_checked).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
