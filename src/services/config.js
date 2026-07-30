/**
 * Central place for future live-integration configuration. Reading from
 * import.meta.env keeps secrets out of source control - copy .env.example
 * to .env and fill in real values when the ESP32 + HiveMQ backend is ready.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL ?? '';

// HiveMQ (or any MQTT broker) over WebSocket. HiveMQ Cloud free clusters
// require TLS, so the URL uses the "wss://" scheme on port 8884 with the
// "/mqtt" path, e.g.:
//   wss://<your-cluster-id>.s1.eu.hivemq.cloud:8884/mqtt
// A local/self-hosted broker without TLS would instead look like:
//   ws://localhost:8000/mqtt
export const MQTT_WS_URL = import.meta.env.VITE_MQTT_WS_URL ?? '';
export const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME ?? '';
export const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD ?? '';

// Topic the ESP32 publishes readings to. The current firmware (see the
// Wokwi sketch) publishes ALL readings from one device to a single flat
// topic - "aether/sensors" - rather than a per-node topic. If the team
// later moves to one topic per node (e.g. "aether/node-01/telemetry"),
// change this to a wildcard like "aether/+/telemetry" and the id-derivation
// logic in sensorService.js will pick the node id up from the topic
// automatically.
export const MQTT_TOPIC = import.meta.env.VITE_MQTT_TOPIC ?? 'aether/sensors';

// Which dashboard node a flat, single-topic feed like the one above should
// update. Only used when the topic has no per-node segment to read an id
// from.
export const MQTT_DEFAULT_NODE_ID = import.meta.env.VITE_MQTT_DEFAULT_NODE_ID ?? 'node-01';

// Supabase - the persistence + auth backend. Create a free project at
// supabase.com, then Project Settings > API for these two values.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const IS_SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
