/**
 * Sensor data service layer.
 *
 * Every fetch* function here currently resolves mock data from
 * `src/data/mockSensorData.js`. When the ESP32 backend is ready, swap the
 * bodies of these functions for real calls (a custom REST API or ThingSpeak
 * REST channel reads) without touching any component - they all import
 * from this file, never from the mock data directly... except the mock
 * data module itself.
 *
 * Two real, working live-data clients live at the bottom of this file:
 *  - connectSensorSocket()  - plain WebSocket, behind VITE_WEBSOCKET_URL
 *  - connectMqttSensorFeed() - MQTT over WebSocket (e.g. HiveMQ), behind
 *                              VITE_MQTT_WS_URL
 * Neither is turned on by default. See useSensorNodes.js for how they're
 * wired in and which one takes priority.
 *
 * Suggested future implementations for the request/response functions:
 *  - REST API:     axios.get(`${API_BASE_URL}/nodes`)
 *  - ThingSpeak:    axios.get(`https://api.thingspeak.com/channels/${channelId}/feeds.json`)
 */
import mqtt from 'mqtt';
import { SENSOR_NODES, HISTORY } from '../data/mockSensorData';
import {
  WEBSOCKET_URL,
  MQTT_WS_URL,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_TOPIC,
  MQTT_DEFAULT_NODE_ID,
} from './config';

const SIMULATED_LATENCY_MS = 350;

function delay(value, ms = SIMULATED_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchSensorNodes() {
  return delay(SENSOR_NODES);
}

export async function fetchSensorNode(nodeId) {
  const node = SENSOR_NODES.find((n) => n.id === nodeId) ?? SENSOR_NODES[0];
  return delay(node);
}

export async function fetchHistory() {
  return delay(HISTORY);
}

/**
 * Simulates a live "refresh" by nudging each node's readings slightly, the
 * way real sensor noise would. Replace with a genuine re-fetch once the
 * ESP32 devices are streaming data.
 */
export async function refreshSensorNodes(currentNodes) {
  const jittered = currentNodes.map((node) => ({
    ...node,
    temperature: Math.round((node.temperature + (Math.random() - 0.5) * 1.5) * 10) / 10,
    humidity: Math.max(0, Math.min(100, Math.round(node.humidity + (Math.random() - 0.5) * 4))),
    airQuality: Math.max(0, Math.round(node.airQuality + (Math.random() - 0.5) * 5)),
    luminosity: Math.max(0, Math.round(node.luminosity + (Math.random() - 0.5) * 150)),
    lastUpdated: 'Just now',
  }));
  return delay(jittered, 600);
}

/**
 * Opens a real WebSocket connection to VITE_WEBSOCKET_URL and calls
 * `onMessage(nodes)` every time the server pushes a new reading.
 *
 * Expected server message shape (one node per message, or an array):
 *   { "id": "node-01", "temperature": 26.4, "humidity": 57, "airQuality": 42,
 *     "luminosity": 2206, "lastUpdated": "2026-07-27T09:31:00Z" }
 * or
 *   [{ ...node }, { ...node }, ...]
 *
 * Handles reconnection with exponential backoff (capped at 30s) since ESP32
 * devices and hobbyist WiFi drop out more often than a typical web backend.
 * Returns a `disconnect()` function - always call it in a cleanup/unmount.
 */
export function connectSensorSocket({ onMessage, onStatusChange } = {}) {
  if (!WEBSOCKET_URL) {
    console.warn(
      'connectSensorSocket called without VITE_WEBSOCKET_URL set - see .env.example.'
    );
    return () => {};
  }

  let socket;
  let reconnectAttempt = 0;
  let reconnectTimer;
  let closedByCaller = false;

  function connect() {
    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      reconnectAttempt = 0;
      onStatusChange?.('connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const nodes = Array.isArray(payload) ? payload : [payload];
        onMessage?.(nodes);
      } catch (err) {
        console.error('Malformed WebSocket payload from sensor gateway:', err);
      }
    };

    socket.onerror = () => {
      onStatusChange?.('error');
    };

    socket.onclose = () => {
      onStatusChange?.('disconnected');
      if (closedByCaller) return;
      const backoffMs = Math.min(30000, 1000 * 2 ** reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(connect, backoffMs);
    };
  }

  connect();

  return function disconnect() {
    closedByCaller = true;
    clearTimeout(reconnectTimer);
    socket?.close();
  };
}

/**
 * Connects directly to an MQTT broker (HiveMQ Cloud or self-hosted) using
 * MQTT-over-WebSocket via mqtt.js, and calls `onMessage(nodes)` every time
 * a subscribed topic receives a new reading.
 *
 * This is the client for the "Connect it to HiveMQ MQTT via WebSocket"
 * requirement - it talks the MQTT protocol itself (subscribe/publish,
 * QoS, retained messages) rather than a plain WebSocket, so it works with
 * HiveMQ out of the box.
 *
 * Setup on HiveMQ Cloud (free tier):
 *  1. Create a cluster at console.hivemq.cloud, note its host, e.g.
 *     "1234abcd.s1.eu.hivemq.cloud".
 *  2. Create broker credentials (username/password) under Access Management.
 *  3. Your WebSocket URL is:
 *     wss://<cluster-host>:8884/mqtt
 *  4. Put that plus the credentials into .env (see .env.example).
 *
 * Current firmware payload shape (see the team's Wokwi sketch - one flat
 * topic, "aether/sensors", for a single ESP32):
 *   { "temp": 26.4, "humidity": 57, "heatIndex": 27.1, "airQuality": 42,
 *     "light": 2450, "status": "FAIR" }
 * normalizeEsp32Payload() below translates that into the shape every
 * component expects (temperature/humidity/airQuality/luminosity/comfort).
 *
 * If the firmware later moves to one topic per node (e.g.
 * "aether/node-01/telemetry"), set VITE_MQTT_TOPIC to a wildcard like
 * "aether/+/telemetry" - the node id will then be read from the topic's
 * second segment instead of falling back to VITE_MQTT_DEFAULT_NODE_ID.
 *
 * Returns a `disconnect()` function - always call it in a cleanup/unmount.
 */

// ESP32's raw analog light reading is a 12-bit ADC value (0-4095) - our
// gauges are calibrated for LUX-ish values up to 3000, so scale it down
// proportionally rather than showing a raw ADC number to the user.
const ADC_MAX = 4095;
const LUX_DISPLAY_MAX = 3000;

function normalizeEsp32Payload(payload, topic) {
  const normalized = {};

  if (payload.temperature !== undefined) normalized.temperature = payload.temperature;
  else if (payload.temp !== undefined) normalized.temperature = payload.temp;

  if (payload.humidity !== undefined) normalized.humidity = payload.humidity;

  if (payload.airQuality !== undefined) normalized.airQuality = payload.airQuality;

  if (payload.luminosity !== undefined) {
    normalized.luminosity = payload.luminosity;
  } else if (payload.light !== undefined) {
    normalized.luminosity = Math.round((payload.light / ADC_MAX) * LUX_DISPLAY_MAX);
  }

  // Firmware's "status" field already uses our exact comfort keys
  // (OPTIMAL/FAIR/POOR), just under a different field name.
  if (payload.comfort !== undefined) normalized.comfort = payload.comfort;
  else if (payload.status !== undefined) normalized.comfort = payload.status;

  // Topic has a per-node segment (e.g. "aether/node-01/telemetry") only
  // when it has 3+ segments; a flat topic like "aether/sensors" doesn't,
  // so fall back to the configured default single-device node id.
  const topicSegments = topic.split('/');
  const topicNodeId = topicSegments.length >= 3 ? topicSegments[1] : undefined;

  normalized.id = payload.id ?? topicNodeId ?? MQTT_DEFAULT_NODE_ID;
  normalized.lastUpdated = 'Just now';

  return normalized;
}

export function connectMqttSensorFeed({ onMessage, onStatusChange } = {}) {
  if (!MQTT_WS_URL) {
    console.warn('connectMqttSensorFeed called without VITE_MQTT_WS_URL set - see .env.example.');
    return () => {};
  }

  const client = mqtt.connect(MQTT_WS_URL, {
    username: MQTT_USERNAME || undefined,
    password: MQTT_PASSWORD || undefined,
    protocolVersion: 5,
    reconnectPeriod: 2000, // mqtt.js handles reconnection itself, no manual backoff needed
    connectTimeout: 10000,
    clientId: `aether-dashboard-${Math.random().toString(16).slice(2, 10)}`,
  });

  client.on('connect', () => {
    onStatusChange?.('connected');
    client.subscribe(MQTT_TOPIC, { qos: 0 }, (err) => {
      if (err) console.error('MQTT subscribe failed:', err);
    });
  });

  client.on('reconnect', () => onStatusChange?.('reconnecting'));
  client.on('close', () => onStatusChange?.('disconnected'));
  client.on('error', (err) => {
    console.error('MQTT connection error:', err);
    onStatusChange?.('error');
  });

  client.on('message', (topic, payloadBuffer) => {
    try {
      const payload = JSON.parse(payloadBuffer.toString());
      const node = normalizeEsp32Payload(payload, topic);
      onMessage?.([node]);
    } catch (err) {
      console.error(`Malformed MQTT payload on topic "${topic}":`, err);
    }
  });

  return function disconnect() {
    client.end(true);
  };
}
