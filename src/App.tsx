import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Admin from './pages/Admin';
import Hospital from './pages/Hospital';
import Driver from './pages/Driver';
import Patient from './pages/Patient';
import { Button } from '@/components/ui/button';
import { Activity, ShieldAlert, Truck, User } from 'lucide-react';

function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
            AmbuCluster
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Intelligent Emergency Response & Ambulance Dispatch System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          <Link to="/admin" className="block">
            <Button variant="outline" className="w-full h-32 flex flex-col items-center justify-center gap-4 text-lg hover:bg-primary/5">
              <ShieldAlert className="w-8 h-8 text-destructive" />
              Admin / Dispatcher Portal
            </Button>
          </Link>
          
          <Link to="/hospital" className="block">
            <Button variant="outline" className="w-full h-32 flex flex-col items-center justify-center gap-4 text-lg hover:bg-primary/5">
              <Activity className="w-8 h-8 text-blue-500" />
              Hospital Portal
            </Button>
          </Link>

          <Link to="/driver" className="block">
            <Button variant="outline" className="w-full h-32 flex flex-col items-center justify-center gap-4 text-lg hover:bg-primary/5">
              <Truck className="w-8 h-8 text-amber-500" />
              Ambulance Driver Portal
            </Button>
          </Link>

          <Link to="/patient" className="block">
            <Button variant="outline" className="w-full h-32 flex flex-col items-center justify-center gap-4 text-lg hover:bg-primary/5">
              <User className="w-8 h-8 text-green-500" />
              Patient Request Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/hospital" element={<Hospital />} />
        <Route path="/driver" element={<Driver />} />
        <Route path="/patient" element={<Patient />} />
      </Routes>
    </Router>
  );
}

export default App;
