import { motion } from 'framer-motion';
import { severityStyles } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * Recent Alerts feed - shows the latest notifications generated from
 * sensor thresholds being crossed. Reused on Dashboard (compact) and
 * a future dedicated Alerts view.
 */
export default function AlertsPanel({ alerts = [] }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-navy-900 p-5 shadow-lg shadow-black/20 sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Notifications</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-white">Recent Alerts</h3>

      <ul className="mt-4 flex flex-col gap-1">
        {alerts.map((alert, i) => {
          const styles = severityStyles(alert.severity);
          return (
            <motion.li
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', styles.dot)} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{alert.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{alert.description}</p>
                <p className={cn('mt-1 text-[11px]', styles.text)}>{alert.time}</p>
              </div>
            </motion.li>
          );
        })}
        {alerts.length === 0 && (
          <li className="py-6 text-center text-xs text-slate-500">No alerts right now - all clear.</li>
        )}
      </ul>
    </div>
  );
}
