import { motion } from 'framer-motion';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import StatusCard from '../StatusCard/StatusCard';
import ComfortGauge from '../ComfortGauge/ComfortGauge';
import { METRIC_CONFIG } from '../../data/mockSensorData';
import { cn } from '../../utils/cn';

const METRIC_KEYS = ['temperature', 'humidity', 'airQuality', 'luminosity'];

/**
 * The primary "Air Quality & Comfort" card shown per sensor node - mirrors
 * the Figma dashboard cards exactly: node name + room, live/low status,
 * comfort banner, four metric gauges and a short summary line.
 */
export default function SensorCard({ node, onRefresh, isRefreshing }) {
  const isLive = node.status === 'live';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/5 bg-navy-900 p-5 shadow-lg shadow-black/20 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {node.name}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">
            Air Quality &amp; Comfort
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{node.room}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
              isLive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'
            )}
          >
            {isLive ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isLive ? 'Live' : 'Low'}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh sensor readings"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-ring"
          >
            <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <StatusCard level={node.comfort} />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-4">
        {METRIC_KEYS.map((key) => {
          const cfg = METRIC_CONFIG[key];
          return (
            <ComfortGauge
              key={key}
              label={cfg.label}
              value={node[key]}
              unit={cfg.unit}
              min={cfg.min}
              max={cfg.max}
              color={cfg.color}
              iconName={cfg.icon}
            />
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="text-xs font-semibold text-slate-300">Summary</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Given the above calculated weather quantities, the atmosphere is{' '}
          {node.comfort === 'OPTIMAL' && 'comfortable.'}
          {node.comfort === 'FAIR' && 'fairly comfortable, however improvements can be made.'}
          {node.comfort === 'POOR' && 'not comfortable, improvements need to be made.'}
        </p>
      </div>
    </motion.div>
  );
}
