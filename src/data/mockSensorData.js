/**
 * Mock sensor data for Project Aether.
 *
 * This file simulates readings that will eventually come from the ESP32
 * device (DHT22 temperature/humidity, MQ-135 air quality, LDR light sensor)
 * over MQTT, ThingSpeak, or a REST API. Keeping all mock values here means
 * swapping in the `services/sensorService.js` live implementation later
 * requires no changes to any component.
 */

// Comfort status thresholds, shared by gauges, cards and the comfort banner.
export const COMFORT_LEVELS = {
  OPTIMAL: {
    key: 'OPTIMAL',
    label: 'Optimal',
    message: 'All parameters within ideal range, environment is comfortable.',
    color: 'var(--color-accent-green)',
    bg: 'from-emerald-900/60 to-emerald-800/40',
    ring: 'ring-emerald-400/30',
  },
  FAIR: {
    key: 'FAIR',
    label: 'Fair',
    message: 'All parameters within an okay range, environment is fairly comfortable.',
    color: 'var(--color-accent-yellow)',
    bg: 'from-amber-900/60 to-amber-800/40',
    ring: 'ring-amber-400/30',
  },
  POOR: {
    key: 'POOR',
    label: 'Poor',
    message: 'Some parameters are outside the ideal range, improvements need to be made.',
    color: 'var(--color-accent-red)',
    bg: 'from-rose-900/60 to-rose-800/40',
    ring: 'ring-rose-400/30',
  },
};

// One "node" per sensing location, mirroring the Figma's ESP32 Sensor Node cards.
export const SENSOR_NODES = [
  {
    id: 'node-01',
    name: 'ESP32 - Sensor Node 01',
    room: 'Living Room - Floor 1',
    status: 'live',
    comfort: 'OPTIMAL',
    temperature: 26,
    humidity: 57,
    airQuality: 42,
    luminosity: 2206,
    battery: 86,
    wifi: 'strong',
    lastUpdated: '2 min ago',
  },
  {
    id: 'node-02',
    name: 'ESP32 - Sensor Node 02',
    room: 'Bedroom - Floor 1',
    status: 'live',
    comfort: 'FAIR',
    temperature: 19,
    humidity: 30,
    airQuality: 39,
    luminosity: 1500,
    battery: 62,
    wifi: 'moderate',
    lastUpdated: '5 min ago',
  },
  {
    id: 'node-03',
    name: 'ESP32 - Sensor Node 03',
    room: 'Kitchen - Floor 1',
    status: 'low',
    comfort: 'POOR',
    temperature: 39,
    humidity: 32,
    airQuality: 39,
    luminosity: 1890,
    battery: 18,
    wifi: 'weak',
    lastUpdated: '11 min ago',
  },
];

// Metric metadata: units, icon keys (lucide-react names) and gauge ranges.
export const METRIC_CONFIG = {
  temperature: {
    label: 'Temperature',
    unit: '\u00b0C',
    icon: 'Thermometer',
    color: 'var(--color-accent-green)',
    min: 0,
    max: 50,
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    icon: 'Droplets',
    color: 'var(--color-accent-blue)',
    min: 0,
    max: 100,
  },
  airQuality: {
    label: 'Air Quality',
    unit: 'AQI',
    icon: 'Wind',
    color: 'var(--color-accent-orange)',
    min: 0,
    max: 100,
  },
  luminosity: {
    label: 'Luminosity',
    unit: 'LUX',
    icon: 'Sun',
    color: 'var(--color-accent-yellow)',
    min: 0,
    max: 3000,
  },
};

// Recent alerts feed - newest first.
export const RECENT_ALERTS = [
  {
    id: 'a1',
    severity: 'warning',
    title: 'Air quality dropping in Kitchen',
    description: 'MQ-135 reading crossed 38 AQI, ventilation recommended.',
    time: '6 min ago',
    node: 'node-03',
  },
  {
    id: 'a2',
    severity: 'info',
    title: 'Humidity stabilised in Bedroom',
    description: 'Humidity returned to the comfortable 30-50% band.',
    time: '24 min ago',
    node: 'node-02',
  },
  {
    id: 'a3',
    severity: 'critical',
    title: 'High temperature in Kitchen',
    description: 'Temperature reached 39\u00b0C, well above the comfort threshold.',
    time: '32 min ago',
    node: 'node-03',
  },
  {
    id: 'a4',
    severity: 'info',
    title: 'Battery topped up on Node 01',
    description: 'Living Room sensor battery increased to 86% after charging.',
    time: '1 hr ago',
    node: 'node-01',
  },
];

// Helper to build a smooth-ish time series around a baseline value.
function buildSeries(baseline, amplitude, points, startHour = 0, stepMinutes = 30) {
  const series = [];
  let value = baseline;
  for (let i = 0; i < points; i += 1) {
    const wobble = Math.sin(i / 2.3) * amplitude * 0.6 + (Math.random() - 0.5) * amplitude * 0.4;
    value = baseline + wobble;
    const totalMinutes = startHour * 60 + i * stepMinutes;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const label = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    series.push({ time: label, value: Math.round(value * 10) / 10 });
  }
  return series;
}

// Historical series used by ChartCard on the Dashboard and Analytics pages.
export const HISTORY = {
  temperature: buildSeries(27, 6, 12),
  humidity: buildSeries(55, 15, 12),
  airQuality: buildSeries(45, 20, 12),
  luminosity: buildSeries(1900, 700, 12),
  comfortIndex: buildSeries(70, 15, 12),
};

// Longer-range daily history, used by the History page table + trend export.
export const DAILY_HISTORY = Array.from({ length: 14 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    id: `day-${i}`,
    date: date.toISOString().slice(0, 10),
    temperature: Math.round((24 + Math.sin(i / 2) * 5 + Math.random() * 2) * 10) / 10,
    humidity: Math.round(50 + Math.cos(i / 3) * 12 + Math.random() * 4),
    airQuality: Math.round(35 + Math.sin(i / 1.7) * 15 + Math.random() * 5),
    luminosity: Math.round(1800 + Math.cos(i / 2.5) * 500 + Math.random() * 200),
    comfortIndex: Math.round(65 + Math.sin(i / 2.2) * 18 + Math.random() * 4),
  };
});

// Derived "comfort index" calculation, kept close to the mock data so the
// formula is easy to find and later replace with a real model.
export function calculateComfortIndex({ temperature, humidity, airQuality }) {
  const tempScore = 100 - Math.abs(temperature - 23) * 4;
  const humidityScore = 100 - Math.abs(humidity - 45) * 2;
  const airScore = 100 - airQuality * 1.2;
  const score = (tempScore * 0.4 + humidityScore * 0.3 + airScore * 0.3);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getComfortLevel(score) {
  if (score >= 75) return COMFORT_LEVELS.OPTIMAL;
  if (score >= 45) return COMFORT_LEVELS.FAIR;
  return COMFORT_LEVELS.POOR;
}

export const DEVICE_STATS = {
  devicesDeployed: '50K',
  usersImproved: '92%',
  monitoring: '24/7',
};

export const TESTIMONIALS = [
  {
    id: 't1',
    quote: 'The dashboard changed how we manage our office air. We can see everything at a glance.',
    name: 'Sarah Chen',
    role: 'Facilities Manager',
  },
  {
    id: 't2',
    quote: 'Setting up the ESP32 node took minutes, and alerts have already caught two ventilation issues.',
    name: 'Daniel Osei',
    role: 'Building Engineer',
  },
  {
    id: 't3',
    quote: 'Our team finally has real data behind comfort complaints instead of guesswork.',
    name: 'Amara Boateng',
    role: 'Operations Lead',
  },
];
