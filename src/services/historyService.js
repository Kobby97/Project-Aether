/**
 * History + alerts persistence layer.
 *
 * Live sensor readings arrive over HiveMQ/MQTT (see sensorService.js) but
 * MQTT itself doesn't remember anything - nothing is "historical" until
 * something writes it down. That's Supabase's job here: a Postgres table
 * that something (an Edge Function, a small script, or this same client
 * if you choose to write from the browser) inserts a row into every time a
 * reading comes in.
 *
 * Every function below checks IS_SUPABASE_CONFIGURED first and falls back
 * to the mock data in `data/mockSensorData.js` otherwise, so the History
 * and Dashboard pages work identically before and after Supabase exists.
 */
import { supabase, IS_SUPABASE_CONFIGURED } from './supabaseClient';
import { DAILY_HISTORY, RECENT_ALERTS } from '../data/mockSensorData';

const SIMULATED_LATENCY_MS = 350;

function delay(value, ms = SIMULATED_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Suggested Supabase schema (see supabase/schema.sql for the full script):
 *
 *   sensor_readings (id, node_id, recorded_at, temperature, humidity,
 *                     air_quality, luminosity, comfort_index)
 *   alerts          (id, node_id, severity, title, description, created_at)
 */

export async function fetchDailyHistory() {
  if (!IS_SUPABASE_CONFIGURED) return delay(DAILY_HISTORY);

  const { data, error } = await supabase
    .from('sensor_readings')
    .select('id, recorded_at, temperature, humidity, air_quality, luminosity, comfort_index')
    .order('recorded_at', { ascending: true })
    .limit(14);

  if (error) {
    console.error('Failed to load sensor_readings from Supabase, falling back to mock data:', error);
    return DAILY_HISTORY;
  }

  return data.map((row) => ({
    id: row.id,
    date: row.recorded_at?.slice(0, 10),
    temperature: row.temperature,
    humidity: row.humidity,
    airQuality: row.air_quality,
    luminosity: row.luminosity,
    comfortIndex: row.comfort_index,
  }));
}

export async function fetchAlerts() {
  if (!IS_SUPABASE_CONFIGURED) return delay(RECENT_ALERTS);

  const { data, error } = await supabase
    .from('alerts')
    .select('id, node_id, severity, title, description, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Failed to load alerts from Supabase, falling back to mock data:', error);
    return RECENT_ALERTS;
  }

  return data.map((row) => ({
    id: row.id,
    node: row.node_id,
    severity: row.severity,
    title: row.title,
    description: row.description,
    time: new Date(row.created_at).toLocaleString(),
  }));
}

/**
 * Writes one sensor reading to Supabase. Call this from wherever readings
 * land in the app (e.g. the MQTT onMessage handler) once you want browser-
 * side logging instead of a server-side Edge Function. Silently no-ops if
 * Supabase isn't configured.
 */
export async function recordSensorReading(nodeId, reading) {
  if (!IS_SUPABASE_CONFIGURED) return null;

  const { error } = await supabase.from('sensor_readings').insert({
    node_id: nodeId,
    temperature: reading.temperature,
    humidity: reading.humidity,
    air_quality: reading.airQuality,
    luminosity: reading.luminosity,
    comfort_index: reading.comfortIndex ?? null,
  });

  if (error) console.error('Failed to record sensor reading to Supabase:', error);
}
