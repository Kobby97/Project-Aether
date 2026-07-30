import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from './config';

/**
 * Single shared Supabase client for the whole app - auth, database reads/
 * writes, and (later, if needed) realtime subscriptions all go through
 * this instance.
 *
 * `supabase` is `null` until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are set, so the app can still run in mock/demo mode before the Supabase
 * project exists. Every function that uses it (authService.js,
 * historyService.js) checks IS_SUPABASE_CONFIGURED first and falls back to
 * mock data/local-only behaviour otherwise.
 */
export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export { IS_SUPABASE_CONFIGURED };
