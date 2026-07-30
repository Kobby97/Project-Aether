import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Wind, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/analytics', label: 'More' },
];

/**
 * Shared top navigation bar. `tone="dark"` matches the navy dashboard
 * screens; `tone="light"` is used on the public Landing page.
 *
 * The right-hand action swaps automatically based on auth state: signed
 * out shows Login/Sign up, signed in shows the account initial + sign out.
 * When Supabase isn't configured yet, `isAuthenticated` is always false
 * but every page stays open (see ProtectedRoute), so this just shows the
 * signed-out state without blocking navigation.
 */
export default function Navbar({ tone = 'dark' }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, signOut, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const isDark = tone === 'dark';

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    navigate('/');
  }

  const initial = (user?.user_metadata?.full_name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b',
        isDark
          ? 'bg-navy-950/95 border-white/5 backdrop-blur supports-[backdrop-filter]:bg-navy-950/80'
          : 'bg-white/95 border-black/5 backdrop-blur'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isDark ? 'bg-sky-400/15 text-sky-300' : 'bg-slate-900/5 text-slate-900'
            )}
          >
            <Wind size={18} strokeWidth={2.25} />
          </span>
          <span
            className={cn(
              'font-display text-lg font-semibold tracking-tight italic',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            Aether
          </span>
        </NavLink>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors focus-ring rounded',
                    isDark
                      ? isActive
                        ? 'text-white'
                        : 'text-slate-300 hover:text-white'
                      : isActive
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {isSupabaseConfigured && isAuthenticated ? (
            <>
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  isDark ? 'bg-white/10 text-white' : 'bg-slate-900/10 text-slate-900'
                )}
                title={user?.email}
              >
                {initial}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring',
                  isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          ) : (
            <>
              {isSupabaseConfigured && (
                <NavLink
                  to="/login"
                  className={cn(
                    'text-sm font-medium transition-colors focus-ring rounded',
                    isDark ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  )}
                >
                  Log in
                </NavLink>
              )}
              <NavLink
                to={isSupabaseConfigured ? '/signup' : '/dashboard'}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-ring',
                  isDark
                    ? 'bg-sky-400 text-navy-950 hover:bg-sky-300'
                    : 'bg-slate-900 text-white hover:bg-slate-700'
                )}
              >
                {isSupabaseConfigured ? 'Sign up' : 'Dashboard'}
              </NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'rounded-md p-2 md:hidden focus-ring',
            isDark ? 'text-white' : 'text-slate-900'
          )}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className={cn('border-t md:hidden', isDark ? 'border-white/5' : 'border-black/5')}>
          <ul className="flex flex-col gap-1 px-5 py-3">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-2 py-2.5 text-sm font-medium',
                      isDark
                        ? isActive
                          ? 'bg-white/5 text-white'
                          : 'text-slate-300'
                        : isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              {isSupabaseConfigured && isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={cn(
                    'flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold',
                    isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              ) : (
                <NavLink
                  to={isSupabaseConfigured ? '/signup' : '/dashboard'}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-lg px-4 py-2.5 text-center text-sm font-semibold',
                    isDark ? 'bg-sky-400 text-navy-950' : 'bg-slate-900 text-white'
                  )}
                >
                  {isSupabaseConfigured ? 'Sign up' : 'Dashboard'}
                </NavLink>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
