import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import SensorCard from '../../components/SensorCard/SensorCard';
import AlertsPanel from '../../components/AlertsPanel/AlertsPanel';
import DataTable from '../../components/DataTable/DataTable';
import { SensorCardSkeleton } from '../../components/common/Skeleton';
import { useSensorNodes } from '../../hooks/useSensorNodes';
import { fetchAlerts } from '../../services/historyService';
import { DAILY_HISTORY } from '../../data/mockSensorData';

export default function Dashboard() {
  const { nodes, isLoading, isRefreshing, lastRefreshed, refresh, mode, connectionStatus } =
    useSensorNodes();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts().then(setAlerts);
  }, []);

  const lastRefreshedLabel = lastRefreshed
    ? lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar tone="dark" />

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Overview
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  mode === 'mock'
                    ? 'bg-white/5 text-slate-400'
                    : connectionStatus === 'connected'
                    ? 'bg-emerald-400/10 text-emerald-300'
                    : 'bg-amber-400/10 text-amber-300'
                }`}
                title={
                  mode === 'mqtt'
                    ? 'Reading live data from HiveMQ over MQTT-over-WebSocket'
                    : mode === 'websocket'
                    ? 'Reading live data pushed over a plain WebSocket'
                    : 'Using mock data with simulated polling'
                }
              >
                {mode === 'mqtt' && `HiveMQ - ${connectionStatus}`}
                {mode === 'websocket' && `WebSocket - ${connectionStatus}`}
                {mode === 'mock' && 'Mock data'}
              </span>
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Sensor Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-ring"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Last updated {lastRefreshedLabel}
          </button>
        </div>

        <motion.section
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3"
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SensorCardSkeleton key={i} />)
            : nodes.map((node) => (
                <SensorCard
                  key={node.id}
                  node={node}
                  onRefresh={refresh}
                  isRefreshing={isRefreshing}
                />
              ))}
        </motion.section>

        <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DataTable variant="mini" rows={DAILY_HISTORY.slice(-1)} />
          </div>
          <div className="lg:col-span-1">
            <AlertsPanel alerts={alerts} />
          </div>
        </section>
      </main>
    </div>
  );
}
