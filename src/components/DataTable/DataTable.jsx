import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '../../utils/cn';
import { HISTORY } from '../../data/mockSensorData';

/**
 * Generic sensor readings table. `variant="mini"` renders the compact
 * "Recent History" list (with an inline sparkline per metric) seen on the
 * Dashboard card; `variant="full"` renders a full table with a header row,
 * used on the History page.
 */
export default function DataTable({ rows = [], variant = 'full' }) {
  const columns = [
    { key: 'temperature', label: 'Temperature', unit: '\u00b0C', color: 'text-emerald-400', stroke: '#34d399' },
    { key: 'humidity', label: 'Humidity', unit: '%', color: 'text-sky-400', stroke: '#38bdf8' },
    { key: 'airQuality', label: 'Air Quality', unit: 'AQI', color: 'text-orange-400', stroke: '#fb923c' },
    { key: 'luminosity', label: 'Luminosity', unit: 'LUX', color: 'text-amber-400', stroke: '#facc15' },
  ];

  if (variant === 'mini') {
    return (
      <div className="rounded-2xl border border-white/5 bg-navy-900 p-5 shadow-lg shadow-black/20 sm:p-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Recent History</p>
        <ul className="mt-3 divide-y divide-white/5">
          {columns.map((col) => (
            <li key={col.key} className="flex items-center gap-4 py-3 text-sm">
              <span className="w-24 shrink-0 text-slate-300">{col.label}</span>
              <span className="h-8 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={HISTORY[col.key]}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={col.stroke}
                      strokeWidth={1.75}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </span>
              <span className={cn('w-14 shrink-0 text-right font-semibold', col.color)}>
                {rows[0]?.[col.key] ?? '--'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-navy-900 shadow-lg shadow-black/20">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[11px] uppercase tracking-wide text-slate-400">
            <th className="px-5 py-3 font-medium">Date</th>
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3 font-medium">
                {col.label} ({col.unit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-white/5 last:border-0',
                i % 2 === 1 && 'bg-white/[0.015]'
              )}
            >
              <td className="px-5 py-3 text-slate-300">{row.date}</td>
              {columns.map((col) => (
                <td key={col.key} className={cn('px-5 py-3 font-medium', col.color)}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
