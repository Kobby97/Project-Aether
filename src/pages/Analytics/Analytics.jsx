import Navbar from '../../components/Navbar/Navbar';
import ChartCard from '../../components/ChartCard/ChartCard';
import { HISTORY } from '../../data/mockSensorData';

const CHARTS = [
  {
    key: 'temperature',
    title: 'Analytics - Temperature',
    subtitle: 'Monitor environmental readings over time',
    unit: '\u00b0C',
    color: 'var(--color-accent-green)',
    summary: 'Temperature summary over the past few days.',
  },
  {
    key: 'humidity',
    title: 'Analytics - Humidity',
    subtitle: 'Living Room - Floor 1',
    unit: '%',
    color: 'var(--color-accent-blue)',
    summary: 'Humidity summary over the past few days.',
  },
  {
    key: 'airQuality',
    title: 'Analytics - Air Quality',
    subtitle: 'Living Room - Floor 1',
    unit: ' AQI',
    color: 'var(--color-accent-orange)',
    summary: 'Air quality summary over the past few days.',
  },
  {
    key: 'luminosity',
    title: 'Analytics - Luminosity',
    subtitle: 'Living Room - Floor 1',
    unit: ' LUX',
    color: 'var(--color-accent-yellow)',
    summary: 'Luminosity summary over the past few days.',
  },
];

export default function Analytics() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar tone="dark" />
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">ESP32 - Sensor Node 01</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Deep dive into each metric's trend across the past few days.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {CHARTS.map((chart) => (
            <ChartCard
              key={chart.key}
              title={chart.title}
              subtitle={chart.subtitle}
              data={HISTORY[chart.key]}
              unit={chart.unit}
              color={chart.color}
              summary={chart.summary}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
