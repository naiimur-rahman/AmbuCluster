/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Truck, 
  AlertTriangle, 
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  Activity,
  ShieldAlert,
  Clock,
  Users,
  Loader2,
  ArrowLeft,
  Wrench,
  Ghost,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { 
  Ambulance, 
  EmergencyRequest, 
  Cluster 
} from '../types';

// Sub-components (will be moved to separate files if they grow)
import DashboardOverview from '../components/DashboardOverview';
import FleetMap from '../components/FleetMap';
import FleetList from '../components/FleetList';
import EmergencyQueue from '../components/EmergencyQueue';
import ClusteringView from '../components/ClusteringView';
import AdminAnalytics from '../components/AdminAnalytics';

type View = 'dashboard' | 'map' | 'fleet' | 'emergencies' | 'clustering' | 'analytics' | 'settings';

export default function Admin() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ambRes, emergRes, clusRes] = await Promise.all([
          fetch('/api/ambulances'),
          fetch('/api/emergencies'),
          fetch('/api/clusters')
        ]);

        if (!ambRes.ok || !emergRes.ok || !clusRes.ok) {
          throw new Error('Failed to fetch data from database. Check your database connection.');
        }

        const ambData = await ambRes.json();
        const emergData = await emergRes.json();
        const clusData = await clusRes.json();

        if (!Array.isArray(ambData) || !Array.isArray(emergData) || !Array.isArray(clusData)) {
          throw new Error('Invalid data format received from API');
        }

        setAmbulances(ambData);
        setEmergencies(emergData);
        setClusters(clusData);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Fleet Map', icon: MapIcon },
    { id: 'fleet', label: 'Ambulance Fleet', icon: Truck },
    { id: 'emergencies', label: 'Emergency Queue', icon: AlertTriangle, badge: emergencies.filter(e => e.status === 'pending').length },
    { id: 'clustering', label: 'Cluster Analysis', icon: Activity },
    { id: 'analytics', label: 'Advanced Analytics', icon: Activity },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardOverview ambulances={ambulances} emergencies={emergencies} clusters={clusters} />;
      case 'map': return <FleetMap ambulances={ambulances} emergencies={emergencies} />;
      case 'fleet': return <FleetList ambulances={ambulances} />;
      case 'emergencies': return <EmergencyQueue emergencies={emergencies} />;
      case 'clustering': return <ClusteringView clusters={clusters} ambulances={ambulances} />;
      case 'analytics': return <AdminAnalytics />;
      default: return <DashboardOverview ambulances={ambulances} emergencies={emergencies} clusters={clusters} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Connecting to Database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Database Connection Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="bg-accent/50 border border-border p-4 rounded-lg text-sm text-left w-full mt-4">
            <p className="font-medium mb-2">Troubleshooting steps:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Ensure your PostgreSQL database is running.</li>
              <li>Verify that the <code className="bg-background px-1 py-0.5 rounded">DATABASE_URL</code> environment variable is set correctly in the AI Studio Secrets panel.</li>
              <li>Check if the database allows connections from this environment.</li>
            </ul>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="relative flex flex-col border-r border-border bg-card/50 backdrop-blur-xl z-20"
        >
          <div className="p-6 flex items-center gap-3">
            <Link to="/">
              <div className="bg-primary/20 p-2 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer">
                <ArrowLeft className="w-6 h-6 text-primary" />
              </div>
            </Link>
            <div className="bg-primary p-2 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-primary-foreground" />
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-xl tracking-tight"
              >
                AmbuCluster
              </motion.span>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group ${
                  activeView === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${activeView === item.id ? 'text-primary-foreground' : 'group-hover:text-primary'}`} />
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isSidebarOpen && item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto px-1.5 py-0 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {isSidebarOpen && <span className="text-sm">Collapse Sidebar</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search fleet, incidents, or personnel..." 
                  className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full border border-border/50">
                <div className="status-pulse">
                  <span className="status-pulse-inner bg-green-500"></span>
                  <span className="status-pulse-dot bg-green-500"></span>
                </div>
                <span className="text-xs font-medium">System Online</span>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
              </Button>
              
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">Dispatcher 04</p>
                  <p className="text-xs text-muted-foreground mt-1">Senior Officer</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                  D4
                </div>
              </div>
            </div>
          </header>

          {/* View Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

