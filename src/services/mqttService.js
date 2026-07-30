/**
 * HiveMQ MQTT-over-WebSocket client.
 *
 * This is the piece your task calls for specifically: "Connect it to
 * HiveMQ MQTT via WebSocket." HiveMQ is an MQTT broker, not a plain
 * WebSocket server, so the browser needs a real MQTT client speaking the
 * MQTT protocol over a WebSocket transport - that's what `mqtt.js`
 * (imported below) does. A raw `new WebSocket(url)` cannot talk to HiveMQ
 * on its own; it would just open a socket with no shared protocol.
 *
 * Flow this expects:
 *   ESP32 --(MQTT, e.g. over WiFi)--> HiveMQ broker --(MQTT over WebSocket)--> browser
 *
 * The ESP32 (or whoever owns that side) publishes one JSON message per
 * node to a topic such as "aether/node-01/telemetry":
 *   { "temperature": 26.4, "humidity": 57, "airQuality": 42, "luminosity": 2206 }
 *
 * This client subscribes to the wildcard topic filter "aether/+/telemetry"
 * (configurable via VITE_MQTT_TOPIC) and extracts the node id from the
 * topic segment that matched the "+".
 */
import mqtt from 'mqtt';
import { MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC } from './config';

/**
 * Pulls the node id out of a topic like "aether/node-01/telemetry" given
 * the subscribed filter "aether/+/telemetry". Falls back to the full topic
 * if the filter shape doesn't match (e.g. a custom topic structure).
 */
function extractNodeId(topic, filter) {
  const topicParts = topic.split('/');
  const filterParts = filter.split('/');
  const wildcardIndex = filterParts.indexOf('+');
  if (wildcardIndex !== -1 && topicParts[wildcardIndex]) {
    return topicParts[wildcardIndex];
  }
  return topic;
}

/**
 * Connects to HiveMQ over MQTT-over-WebSocket and calls `onMessage(nodes)`
 * with an array of `{ id, ...reading }` objects every time a message
 * arrives. Returns a `disconnect()` function - always call it on unmount.
 *
 * @param {Object} options
 * @param {(nodes: Array<{id: string} & Record<string, unknown>>) => void} options.onMessage
 * @param {(status: 'connecting'|'connected'|'reconnecting'|'error'|'disconnected') => void} [options.onStatusChange]
 * @param {string} [options.brokerUrl] - override VITE_MQTT_BROKER_URL
 * @param {string} [options.topic] - override VITE_MQTT_TOPIC
 */
export function connectToHiveMQ({
  onMessage,
  onStatusChange,
  brokerUrl = MQTT_BROKER_URL,
  topic = MQTT_TOPIC,
} = {}) {
  if (!brokerUrl) {
    console.warn('connectToHiveMQ called without a broker URL - see .env.example.');
    return () => {};
  }

  onStatusChange?.('connecting');

  const client = mqtt.connect(brokerUrl, {
    username: MQTT_USERNAME || undefined,
    password: MQTT_PASSWORD || undefined,
    clientId: `aether-dashboard-${Math.random().toString(16).slice(2, 10)}`,
    reconnectPeriod: 3000, // mqtt.js handles reconnect/backoff internally
    connectTimeout: 10000,
  });

  client.on('connect', () => {
    onStatusChange?.('connected');
    client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) console.error('HiveMQ subscribe failed:', err);
    });
  });

  client.on('reconnect', () => onStatusChange?.('reconnecting'));
  client.on('close', () => onStatusChange?.('disconnected'));
  client.on('error', (err) => {
    console.error('HiveMQ connection error:', err);
    onStatusChange?.('error');
  });

  client.on('message', (receivedTopic, payloadBuffer) => {
    try {
      const reading = JSON.parse(payloadBuffer.toString());
      const id = reading.id ?? extractNodeId(receivedTopic, topic);
      onMessage?.([{ id, ...reading, lastUpdated: 'Just now' }]);
    } catch (err) {
      console.error('Malformed MQTT payload from', receivedTopic, err);
    }
  });

  return function disconnect() {
    client.end(true);
  };
}
