import { supabase, IS_SUPABASE_CONFIGURED } from './supabaseClient';

/**
 * Thin wrapper around Supabase Auth. Every function throws a plain Error
 * with a human-readable message on failure, so components can just
 * try/catch and show `error.message` directly.
 *
 * If Supabase isn't configured yet (no .env values set), these all reject
 * with a clear "not configured" error rather than crashing - lets the rest
 * of the app (mock dashboard) keep working while auth is unavailable.
 */

function assertConfigured() {
  if (!IS_SUPABASE_CONFIGURED) {
    throw new Error(
      'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.'
    );
  }
}

export async function signUp({ email, password, fullName }) {
  assertConfigured();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn({ email, password }) {
  assertConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  assertConfigured();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  if (!IS_SUPABASE_CONFIGURED) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function requestPasswordReset(email) {
  assertConfigured();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login',
  });
  if (error) throw new Error(error.message);
}

/**
 * Subscribes to auth state changes (sign in, sign out, token refresh).
 * Returns an unsubscribe function - always call it on unmount.
 */
export function onAuthStateChange(callback) {
  if (!IS_SUPABASE_CONFIGURED) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}
