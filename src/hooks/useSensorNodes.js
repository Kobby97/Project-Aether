import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchSensorNodes,
  refreshSensorNodes,
  connectSensorSocket,
  connectMqttSensorFeed,
} from '../services/sensorService';
import { WEBSOCKET_URL, MQTT_WS_URL } from '../services/config';

/**
 * Loads sensor nodes and keeps them fresh.
 *
 * Three modes, in priority order:
 *  1. MQTT (HiveMQ) - active when VITE_MQTT_WS_URL is set. This is the
 *     mode the project brief asks for ("Connect it to HiveMQ MQTT via
 *     WebSocket").
 *  2. Plain WebSocket - active when VITE_MQTT_WS_URL is unset but
 *     VITE_WEBSOCKET_URL is set (useful if a teammate's bridge server
 *     re-broadcasts MQTT as plain WebSocket JSON instead).
 *  3. Mock data polling - the default, used whenever neither is set.
 *
 * Components consuming this hook (Dashboard, SensorCard, etc.) don't need
 * to know or care which mode is active - `nodes` always has the same shape.
 */
export function useSensorNodes({ pollMs = 15000 } = {}) {
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const mode = MQTT_WS_URL ? 'mqtt' : WEBSOCKET_URL ? 'websocket' : 'mock';
  const isLive = mode !== 'mock';

  // Initial load - always starts from a fetch (mock data, or a real
  // "give me current state" REST call) so the UI has something to show
  // before the first live message arrives.
  useEffect(() => {
    let mounted = true;
    fetchSensorNodes().then((data) => {
      if (!mounted) return;
      setNodes(data);
      setIsLoading(false);
      setLastRefreshed(new Date());
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Manual refresh button - in live modes this is mostly a no-op visual
  // affordance since MQTT/WebSocket keep data current, but it's kept so the
  // Dashboard's refresh button still does something meaningful either way.
  const refresh = useCallback(async () => {
    if (!nodesRef.current.length) return;
    setIsRefreshing(true);
    if (!isLive) {
      const updated = await refreshSensorNodes(nodesRef.current);
      setNodes(updated);
    }
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, [isLive]);

  // Polling fallback - only runs in mock mode.
  useEffect(() => {
    if (mode !== 'mock' || !pollMs) return undefined;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [mode, pollMs, refresh]);

  // Merges one or more incoming node updates into state without dropping
  // fields the message didn't include (e.g. an MQTT payload might only
  // send temperature + humidity, keeping the last known airQuality/etc).
  const mergeNodes = useCallback((incomingNodes) => {
    setNodes((current) => {
      const byId = new Map(current.map((n) => [n.id, n]));
      incomingNodes.forEach((n) => byId.set(n.id, { ...byId.get(n.id), ...n }));
      return Array.from(byId.values());
    });
    setLastRefreshed(new Date());
  }, []);

  // MQTT (HiveMQ) subscription - only runs when VITE_MQTT_WS_URL is set.
  useEffect(() => {
    if (mode !== 'mqtt') return undefined;
    const disconnect = connectMqttSensorFeed({
      onStatusChange: setConnectionStatus,
      onMessage: mergeNodes,
    });
    return disconnect;
  }, [mode, mergeNodes]);

  // Plain WebSocket subscription - only runs when MQTT isn't configured but
  // a plain WebSocket URL is.
  useEffect(() => {
    if (mode !== 'websocket') return undefined;
    const disconnect = connectSensorSocket({
      onStatusChange: setConnectionStatus,
      onMessage: mergeNodes,
    });
    return disconnect;
  }, [mode, mergeNodes]);

  return { nodes, isLoading, isRefreshing, lastRefreshed, refresh, isLive, mode, connectionStatus };
}
