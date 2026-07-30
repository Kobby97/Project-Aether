import { createContext, useContext, useEffect, useState } from 'react';
import {
  getSession,
  onAuthStateChange,
  signIn as signInRequest,
  signUp as signUpRequest,
  signOut as signOutRequest,
} from '../services/authService';
import { IS_SUPABASE_CONFIGURED } from '../services/config';

const AuthContext = createContext(null);

/**
 * Wraps the whole app (see App.jsx) and exposes the current auth session
 * plus sign in/up/out actions via useAuth(). Also tracks whether Supabase
 * is configured at all, so pages can decide whether to enforce login or
 * just show a "connect Supabase" notice instead.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((s) => {
        if (mounted) setSession(s);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    const unsubscribe = onAuthStateChange((s) => setSession(s));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function signIn(credentials) {
    const data = await signInRequest(credentials);
    setSession(data.session);
    return data;
  }

  async function signUp(details) {
    const data = await signUpRequest(details);
    // Supabase only returns a session immediately if email confirmation is
    // disabled on the project; otherwise the user must confirm by email
    // first, so `data.session` may be null here - callers should handle
    // both cases (see Signup.jsx).
    if (data.session) setSession(data.session);
    return data;
  }

  async function signOut() {
    await signOutRequest();
    setSession(null);
  }

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session),
    isLoading,
    isSupabaseConfigured: IS_SUPABASE_CONFIGURED,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
