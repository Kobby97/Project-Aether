import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Mail } from 'lucide-react';
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import { SENSOR_NODES } from '../../data/mockSensorData';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring',
          checked ? 'bg-sky-400' : 'bg-white/10'
        )}
      >
        <motion.span
          layout
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: checked ? '22px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyReport: false,
  });
  const [units, setUnits] = useState('celsius');
  const [pollInterval, setPollInterval] = useState(15);

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar tone="dark" />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar active="/settings" />
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Preferences</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Settings</h1>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {isSupabaseConfigured && (
              <section className="rounded-2xl border border-white/5 bg-navy-900 p-6">
                <h2 className="font-display text-base font-semibold text-white">Account</h2>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                    {(user?.user_metadata?.full_name || user?.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {user?.user_metadata?.full_name || 'Signed in user'}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                      <Mail size={11} />
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-ring"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-white/5 bg-navy-900 p-6">
              <h2 className="font-display text-base font-semibold text-white">Registered nodes</h2>
              <ul className="mt-3 divide-y divide-white/5">
                {SENSOR_NODES.map((node) => (
                  <li key={node.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-200">{node.name}</p>
                      <p className="text-xs text-slate-500">{node.room}</p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        node.status === 'live'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-rose-400/10 text-rose-300'
                      )}
                    >
                      {node.status === 'live' ? 'Live' : 'Low'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/5 bg-navy-900 p-6">
              <h2 className="font-display text-base font-semibold text-white">Notifications</h2>
              <div className="mt-1 divide-y divide-white/5">
                <Toggle
                  label="Email alerts"
                  checked={notifications.email}
                  onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
                />
                <Toggle
                  label="Push notifications"
                  checked={notifications.push}
                  onChange={(v) => setNotifications((n) => ({ ...n, push: v }))}
                />
                <Toggle
                  label="Weekly summary report"
                  checked={notifications.weeklyReport}
                  onChange={(v) => setNotifications((n) => ({ ...n, weeklyReport: v }))}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-navy-900 p-6">
              <h2 className="font-display text-base font-semibold text-white">Units</h2>
              <div className="mt-3 flex gap-2">
                {['celsius', 'fahrenheit'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setUnits(option)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-xs font-semibold capitalize transition-colors focus-ring',
                      units === option
                        ? 'bg-sky-400 text-navy-950'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    )}
                  >
                    {option === 'celsius' ? '\u00b0C Celsius' : '\u00b0F Fahrenheit'}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-navy-900 p-6">
              <h2 className="font-display text-base font-semibold text-white">Refresh interval</h2>
              <p className="mt-1 text-xs text-slate-400">
                How often the dashboard polls each node for new readings.
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="mt-4 w-full accent-sky-400"
                aria-label="Refresh interval in seconds"
              />
              <p className="mt-2 text-sm font-semibold text-sky-300">{pollInterval}s</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
