import { Zap, AlertTriangle, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { COMFORT_LEVELS } from '../../data/mockSensorData';
import { cn } from '../../utils/cn';

const ICONS = {
  OPTIMAL: Zap,
  FAIR: AlertTriangle,
  POOR: AlertOctagon,
};

const TEXT_COLOR = {
  OPTIMAL: 'text-emerald-400',
  FAIR: 'text-amber-400',
  POOR: 'text-rose-400',
};

const ICON_BG = {
  OPTIMAL: 'bg-emerald-400/15 text-emerald-400',
  FAIR: 'bg-amber-400/15 text-amber-400',
  POOR: 'bg-rose-400/15 text-rose-400',
};

/**
 * The wide banner at the top of each dashboard card showing overall
 * comfort status (Optimal / Fair / Poor) with a short explanation.
 */
export default function StatusCard({ level = 'OPTIMAL' }) {
  const info = COMFORT_LEVELS[level] ?? COMFORT_LEVELS.OPTIMAL;
  const Icon = ICONS[level] ?? Zap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col gap-3 rounded-xl bg-gradient-to-br p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        info.bg
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', ICON_BG[level])}>
          <Icon size={17} />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-300/80">Comfort Status</p>
          <p className={cn('text-lg font-bold leading-tight', TEXT_COLOR[level])}>{info.label}</p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-slate-300/90 sm:max-w-xs sm:text-right">
        {info.message}
      </p>
    </motion.div>
  );
}
