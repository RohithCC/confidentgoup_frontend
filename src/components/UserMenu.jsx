import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, logOut } from '../features/auth/authSlice.js';
import { prettyEnum } from '../utils/constants.js';

/**
 * Avatar + dropdown shown when a user is logged in.
 * Renders nothing when logged out, so it's safe to drop anywhere.
 *
 * variant="light"  -> trigger text is light (use on the dark navy nav)
 * variant="dark"   -> trigger text is dark  (use on white backgrounds / dashboard)
 */
export default function UserMenu({ variant = 'dark' }) {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const initials =
    user.name
      ?.split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const handleLogout = async () => {
    setOpen(false);
    // If you have a logout endpoint that clears the httpOnly refresh cookie,
    // call it here before clearing client state, e.g.:
    //   try { await logoutApi().unwrap(); } catch {}
    dispatch(logOut());          // clears Redux + persisted token (crm_auth)
    navigate('/login', { replace: true });
  };

  const nameColor = variant === 'light' ? 'text-white' : 'text-navy-900';
  const subColor = variant === 'light' ? 'text-navy-100/60' : 'text-navy-400';
  const chevronColor = variant === 'light' ? 'text-navy-100/70' : 'text-navy-400';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full p-1 pr-2 transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
          />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-sm font-bold text-navy-900">
            {initials}
          </span>
        )}
        <span className="hidden text-left sm:block">
          <span className={`block text-sm font-semibold leading-tight ${nameColor}`}>
            {user.name?.split(' ')[0]}
          </span>
          <span className={`block text-xs leading-tight ${subColor}`}>
            {prettyEnum(user.role)}
          </span>
        </span>
        <svg
          className={`h-4 w-4 transition ${chevronColor} ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-navy-100 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-navy-50 px-4 py-3">
            <p className="truncate text-sm font-semibold text-navy-900">{user.name}</p>
            <p className="truncate text-xs text-navy-400">{user.email}</p>
          </div>

          <MenuLink to="/dashboard" onSelect={() => setOpen(false)}>
            Dashboard
          </MenuLink>
          <MenuLink to="/profile" onSelect={() => setOpen(false)}>
            Edit profile
          </MenuLink>

          <div className="my-1 border-t border-navy-50" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, onSelect, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="block px-4 py-2 text-sm text-navy-700 transition hover:bg-navy-50"
    >
      {children}
    </Link>
  );
}