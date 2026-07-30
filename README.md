# Project Aether — Air Quality & Comfort Dashboard

An ESP32-based IoT Air Quality & Comfort Monitoring dashboard, built with React 19, Vite, Tailwind CSS, Recharts, Framer Motion, and React Router.

## Stack
- React 19 + Vite
- Tailwind CSS v4
- React Router v7
- Recharts (charts)
- Lucide React (icons)
- Framer Motion (animation)
- mqtt.js (MQTT over WebSocket, for HiveMQ)
- Supabase (auth + database backend)
- Axios (ready for future REST API calls)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/     Reusable UI building blocks (Navbar, Sidebar, SensorCard,
                   StatusCard, ComfortGauge, ChartCard, AlertsPanel,
                   DataTable, Footer, Landing sections, common/Skeleton,
                   auth/ProtectedRoute)
  pages/          Route-level screens (Landing, Dashboard, History,
                   Analytics, Settings, Auth/Login, Auth/Signup,
                   Auth/ForgotPassword)
  context/        AuthContext - app-wide auth session state
  hooks/          useSensorNodes - MQTT/WebSocket/polling hook
  services/       sensorService.js   - live sensor data (HiveMQ MQTT,
                                       WebSocket, or mock)
                   historyService.js - historical readings + alerts
                                       (Supabase, or mock)
                   authService.js    - Supabase Auth wrapper
                   supabaseClient.js - shared Supabase client
                   config.js         - all env-driven configuration
  utils/          cn (classnames) and formatting helpers
  data/           mockSensorData.js - all mock sensor readings, comfort
                   levels, alerts, and history live here
supabase/
  schema.sql      Run this in the Supabase SQL Editor to create the
                   sensor_readings + alerts tables with RLS policies
```

## Connecting to HiveMQ (MQTT over WebSocket)

This is the primary live-data path for this project. The dashboard uses
[mqtt.js](https://github.com/mqttjs/MQTT.js) to connect **directly** to a
HiveMQ broker from the browser - no separate bridge server needed.

1. **Create a HiveMQ Cloud cluster** (free tier is fine) at
   [console.hivemq.cloud](https://console.hivemq.cloud). Note the cluster
   host, e.g. `1234abcd.s1.eu.hivemq.cloud`.
2. **Create broker credentials** under Access Management on that cluster
   (a username + password used by both the ESP32 and the dashboard).
3. **Copy `.env.example` to `.env`** and fill in:
   ```
   VITE_MQTT_WS_URL=wss://1234abcd.s1.eu.hivemq.cloud:8884/mqtt
   VITE_MQTT_USERNAME=your-username
   VITE_MQTT_PASSWORD=your-password
   VITE_MQTT_TOPIC=aether/+/telemetry
   ```
4. **Restart `npm run dev`** (Vite only reads `.env` on startup).

The ESP32 firmware should publish JSON to a topic per node, matching the
wildcard above, e.g.:

```
topic:   aether/node-01/telemetry
payload: {"temperature":26.4,"humidity":57,"airQuality":42,"luminosity":2206}
```

The dashboard subscribes to `aether/+/telemetry`, reads the node id from
the topic's second segment (`node-01`), and merges each incoming reading
into that node's card in real time. The Dashboard page shows a
"HiveMQ - connected" badge next to the title once it's live; it falls back
to "Mock data" whenever `VITE_MQTT_WS_URL` isn't set.

`connectMqttSensorFeed()` in `src/services/sensorService.js` is the actual
client code, and `useSensorNodes.js` is where it's wired into the UI - see
the comments in both files for the full message-shape contract and mode
priority (MQTT > plain WebSocket > mock).

### Plain WebSocket fallback

If a teammate builds a small bridge server that re-broadcasts MQTT as
plain WebSocket JSON instead of connecting the browser to HiveMQ directly,
set `VITE_WEBSOCKET_URL` instead (and leave `VITE_MQTT_WS_URL` blank) -
`connectSensorSocket()` in the same file handles that path with its own
reconnect logic.

### REST / ThingSpeak

For request/response style integration instead of push, replace the
`fetch*` function bodies in `sensorService.js`:
- REST API:     `axios.get(`${API_BASE_URL}/nodes`)`
- ThingSpeak:    `axios.get(`https://api.thingspeak.com/channels/${channelId}/feeds.json`)`

Keep the same return shapes described in `src/data/mockSensorData.js` so
no component code needs to change, and remove the artificial `delay()`
wrapper once real network latency is in play.

## Setting up Supabase (auth + persistent history)

This project uses [Supabase](https://supabase.com) for two things:

1. **Authentication** - real login/signup, so `/dashboard`, `/history`,
   `/analytics`, and `/settings` are protected routes
2. **Persistence** - the History page's day-by-day table and the
   Dashboard's Recent Alerts panel read from Supabase tables, since MQTT
   only carries *live* readings and doesn't remember anything on its own

**Setup steps:**

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings > API** and copy the Project URL and
   `anon` public key.
3. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Open the **SQL Editor** in your Supabase project, paste in the contents
   of `supabase/schema.sql`, and run it. This creates two tables:
   - `sensor_readings` - historical data for the History page
   - `alerts` - powers the Recent Alerts panel
   Both have Row Level Security enabled with a policy allowing any signed-in
   user to read them (see the comments in the file for how to allow writes
   from the browser too, if you want that instead of a server-side writer).
5. In **Authentication > Providers**, Email/Password is on by default -
   nothing else to configure to get Login/Signup working.
6. (Optional) Under **Authentication > Sign In / Providers**, you can turn
   off "Confirm email" while testing, so new signups get a session
   immediately instead of needing to click a confirmation email first.
7. Restart `npm run dev`.

**What changes once this is done:**
- The Navbar shows Log in / Sign up instead of just a Dashboard button
- Visiting `/dashboard`, `/history`, `/analytics`, or `/settings` while
  signed out redirects to `/login`
- Settings gets an "Account" card showing the signed-in user + a sign-out
  button
- History and the Dashboard's alerts panel read real rows from Supabase
  instead of the mock arrays

**Before Supabase is configured**, none of the above is enforced - every
route stays open and everything reads mock data, so the rest of the team
can keep working on the UI without needing Supabase credentials yet.

### Who writes sensor data into Supabase?

MQTT (HiveMQ) delivers live readings to the browser, but something still
needs to write those readings into the `sensor_readings` table for the
History page to have anything to show. Options, roughly easiest to most
robust:

- **Browser writes on receipt** - call `recordSensorReading()` from
  `src/services/historyService.js` inside the MQTT `onMessage` handler in
  `useSensorNodes.js`. Simplest to wire up, but means every open dashboard
  tab writes duplicate rows, and you'd need to add an INSERT policy for
  the `authenticated` role in `supabase/schema.sql`.
- **A Supabase Edge Function** subscribes to HiveMQ independently and
  inserts rows - one writer, no duplicates, but more setup.
- **A small script/server** does the same thing outside Supabase.

Worth deciding as a team rather than defaulting silently - tag whoever
owns the HiveMQ side.

## Notes

- Mock data is intentionally isolated in `src/data/mockSensorData.js` so it
  can be deleted wholesale once live data is wired up.
- The Dashboard/Analytics/History screens use a dark navy theme matching
  the Figma; the Landing (marketing) page uses a light theme, matching the
  Figma's public-facing site.
