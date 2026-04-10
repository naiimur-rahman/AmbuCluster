import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Clock3,
  HeartPulse,
  ShieldAlert,
  Truck,
  User,
  Waves,
} from 'lucide-react';
import Admin from './pages/Admin';
import Hospital from './pages/Hospital';
import Driver from './pages/Driver';
import Patient from './pages/Patient';
import { Button } from '@/components/ui/button';

const portalLinks = [
  {
    to: '/admin',
    title: 'Command Center',
    description: 'Live dispatching, cluster analytics, fleet orchestration, and incident management.',
    icon: ShieldAlert,
    accent: 'from-orange-500/25 to-rose-500/10',
    iconColor: 'text-orange-300',
  },
  {
    to: '/hospital',
    title: 'Hospital Operations',
    description: 'Capacity telemetry, inbound patient visibility, and emergency intake coordination.',
    icon: HeartPulse,
    accent: 'from-cyan-500/25 to-sky-500/10',
    iconColor: 'text-cyan-300',
  },
  {
    to: '/driver',
    title: 'Driver Cockpit',
    description: 'Assignment awareness, rapid state transitions, and mobile-ready routing context.',
    icon: Truck,
    accent: 'from-amber-500/25 to-orange-500/10',
    iconColor: 'text-amber-200',
  },
  {
    to: '/patient',
    title: 'Patient SOS',
    description: 'Fast emergency capture, ambulance estimation, and transparent dispatch confirmation.',
    icon: User,
    accent: 'from-emerald-500/25 to-teal-500/10',
    iconColor: 'text-emerald-200',
  },
];

const metrics = [
  { label: 'Average dispatch decision', value: '< 30s' },
  { label: 'Fleet telemetry visibility', value: '24/7' },
  { label: 'Incident coordination layers', value: '4 portals' },
];

function Landing() {
  return (
    <div className="ambient-shell min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-8">
      <div className="hero-orb left-[-8rem] top-8 h-56 w-56 bg-orange-500/30" />
      <div className="hero-orb right-[-4rem] top-28 h-72 w-72 bg-sky-500/20" />
      <div className="hero-orb bottom-[-6rem] left-1/3 h-80 w-80 bg-emerald-500/14" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="premium-card flex items-center justify-between px-5 py-4 md:px-6"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/12 p-3">
              <Activity className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">AmbuCluster</p>
              <p className="text-sm text-white/58">Emergency response intelligence platform</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="portal-chip">
              <Waves className="h-3.5 w-3.5 text-cyan-300" />
              Urban dispatch fabric
            </span>
            <span className="portal-chip">
              <Clock3 className="h-3.5 w-3.5 text-orange-300" />
              Real-time telemetry
            </span>
          </div>
        </motion.header>

        <main className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="premium-card relative overflow-hidden p-6 md:p-8 lg:p-10"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="mb-5">
              <span className="section-kicker">Emergency Mobility Intelligence</span>
            </div>

            <div className="max-w-3xl space-y-6">
              <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                A high-visibility control layer for ambulance dispatch, hospital readiness, and patient access.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                AmbuCluster turns emergency operations into a coordinated digital surface with live fleet context,
                portal-specific workflows, and clearer operational decisions across the full response chain.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/admin">
                <Button className="h-12 rounded-full bg-orange-400 px-6 text-sm font-semibold text-slate-950 hover:bg-orange-300">
                  Enter Command Center
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/patient">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-white/14 bg-white/6 px-6 text-sm text-white hover:bg-white/10"
                >
                  Open Patient SOS
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + index * 0.08 }}
                  className="rounded-[1.6rem] border border-white/10 bg-white/6 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-white/46">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{metric.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
          >
            {portalLinks.map((portal, index) => (
              <Link key={portal.to} to={portal.to} className="group block">
                <motion.article
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                  className={`premium-card relative overflow-hidden p-5 transition-transform duration-300 group-hover:-translate-y-1 ${portal.accent}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                          <portal.icon className={`h-5 w-5 ${portal.iconColor}`} />
                        </div>
                        <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/55">Portal</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">{portal.title}</h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-white/68">{portal.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-white/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                </motion.article>
              </Link>
            ))}
          </motion.section>
        </main>
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
