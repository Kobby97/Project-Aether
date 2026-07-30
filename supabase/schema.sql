-- Project Aether - Supabase schema
--
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard > SQL Editor > New query > paste this > Run).
--
-- Covers: historical sensor readings + alerts, both readable by any
-- signed-in user. Writes are expected to come from a trusted source (an
-- Edge Function, a small server-side script, or the service_role key) -
-- NOT from anonymous/authenticated browser clients - so there are no
-- insert/update policies for those roles below. If you want the browser
-- itself to write readings (see recordSensorReading() in
-- src/services/historyService.js), add an INSERT policy for the
-- "authenticated" role on sensor_readings/alerts.

-- ---------------------------------------------------------------------
-- Historical sensor readings (powers the History page's table + charts)
-- ---------------------------------------------------------------------
create table if not exists sensor_readings (
  id uuid primary key default gen_random_uuid(),
  node_id text not null,
  recorded_at timestamptz not null default now(),
  temperature numeric,
  humidity numeric,
  air_quality numeric,
  luminosity numeric,
  comfort_index numeric
);

create index if not exists sensor_readings_recorded_at_idx
  on sensor_readings (recorded_at desc);

alter table sensor_readings enable row level security;

create policy "Authenticated users can read sensor readings"
  on sensor_readings for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- Alerts (powers the Recent Alerts panel on the Dashboard)
-- ---------------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  node_id text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists alerts_created_at_idx
  on alerts (created_at desc);

alter table alerts enable row level security;

create policy "Authenticated users can read alerts"
  on alerts for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- Optional: seed a couple of rows so the History page isn't empty the
-- moment you switch VITE_SUPABASE_URL on, before real data arrives.
-- Safe to delete once real readings are flowing in.
-- ---------------------------------------------------------------------
insert into sensor_readings (node_id, temperature, humidity, air_quality, luminosity, comfort_index)
values
  ('node-01', 26, 57, 42, 2206, 78),
  ('node-01', 25.4, 55, 40, 2100, 79)
on conflict do nothing;

insert into alerts (node_id, severity, title, description)
values
  ('node-03', 'warning', 'Air quality dropping in Kitchen', 'MQ-135 reading crossed 38 AQI, ventilation recommended.')
on conflict do nothing;
