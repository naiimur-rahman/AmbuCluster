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
  Loader2,
  ArrowLeft,
  Radar,
  Siren
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

  const pendingEmergencies = emergencies.filter((emergency) => emergency.status === 'pending').length;
  const activeUnits = ambulances.filter((ambulance) => ambulance.status !== 'maintenance').length;
  const readyUnits = ambulances.filter((ambulance) => ambulance.status === 'available').length;

  if (loading) {
    return (
      <div className="portal-shell flex items-center justify-center">
        <div className="premium-card flex flex-col items-center gap-4 px-8 py-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/70 animate-pulse">Connecting to dispatch database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-shell flex items-center justify-center">
        <div className="premium-card flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Database Connection Error</h2>
          <p className="text-white/70">{error}</p>
          <div className="w-full rounded-2xl border border-white/10 bg-white/6 p-4 text-left text-sm">
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
      <div className="ambient-shell flex h-screen overflow-hidden text-foreground font-sans">
        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 260 : 80 }}
          className="relative z-20 flex flex-col border-r border-white/10 bg-slate-950/45 backdrop-blur-2xl"
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
                    ? 'bg-white text-slate-950 shadow-lg shadow-white/10' 
                    : 'text-white/62 hover:bg-white/8 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${activeView === item.id ? 'text-slate-950' : 'group-hover:text-orange-300'}`} />
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/8 text-white/62 transition-colors"
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {isSidebarOpen && <span className="text-sm">Collapse Sidebar</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/28 px-8 backdrop-blur-xl z-10">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search fleet, incidents, or personnel..." 
                  className="input-surface pl-10 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
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
            <section className="portal-header mb-8">
              <div className="space-y-4">
                <span className="section-kicker">Mission Control</span>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">Citywide emergency coordination</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
                    Monitor response pressure, fleet readiness, and incident flow from a single tactical surface.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="portal-chip">
                    <Siren className="h-3.5 w-3.5 text-orange-300" />
                    {pendingEmergencies} pending emergencies
                  </span>
                  <span className="portal-chip">
                    <Truck className="h-3.5 w-3.5 text-cyan-300" />
                    {readyUnits}/{ambulances.length} units ready
                  </span>
                  <span className="portal-chip">
                    <Radar className="h-3.5 w-3.5 text-emerald-300" />
                    {clusters.length} live optimization clusters
                  </span>
                </div>
              </div>

              <div className="grid w-full gap-3 md:max-w-md md:grid-cols-2">
                <div className="metric-tile">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Active fleet</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{activeUnits}</p>
                  <p className="mt-1 text-sm text-white/58">Units visible across the network</p>
                </div>
                <div className="metric-tile">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Portal focus</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{navItems.length}</p>
                  <p className="mt-1 text-sm text-white/58">Operational workspaces available</p>
                </div>
              </div>
            </section>

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
