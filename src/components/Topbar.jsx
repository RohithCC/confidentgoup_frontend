import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser, logOut } from '../features/auth/authSlice.js';
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useLogoutMutation,
} from '../features/api/apiSlice.js';
import { ROLE_LABELS } from '../utils/constants.js';
import { confirmAction } from '../utils/alert.js';
import { IconBell, IconMenu, IconLogout } from './Icons.jsx';

export default function Topbar({ onMenu, title }) {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();

  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef(null);
  const menuRef = useRef(null);

  // Poll notifications every 30s (RTK Query handles caching/dedup).
  const { data: notifData } = useGetNotificationsQuery(
    { unread: 'true' },
    { pollingInterval: 30000 }
  );
  const [markAll] = useMarkAllNotificationsReadMutation();
  const unread = notifData?.unreadCount || 0;
  const notes = notifData?.data || [];

  // Close dropdowns on outside click.
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: 'Log out?',
      text: 'You will need to sign in again to access the CRM.',
      confirmText: 'Log out',
    });
    if (!ok) return;
    try {
      await logoutApi().unwrap();
    } catch {
      /* ignore network errors on logout */
    }
    dispatch(logOut());
    navigate('/login', { replace: true });
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-navy-100 bg-white/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="text-navy-600 hover:text-navy-900 lg:hidden" aria-label="Open menu">
          <IconMenu />
        </button>
        <h1 className="font-display text-lg font-bold text-navy-900 sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative grid h-10 w-10 place-items-center rounded-lg text-navy-600 hover:bg-navy-50"
            aria-label="Notifications"
          >
            <IconBell />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right animate-fade-in rounded-xl border border-navy-100 bg-white shadow-soft">
              <div className="flex items-center justify-between border-b border-navy-50 px-4 py-3">
                <span className="font-display font-semibold text-navy-900">Notifications</span>
                {unread > 0 && (
                  <button onClick={() => markAll()} className="text-xs font-semibold text-gold-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-navy-400">You're all caught up.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n._id} className="border-b border-navy-50 px-4 py-3 last:border-0 hover:bg-navy-50/50">
                      <p className="text-sm font-semibold text-navy-800">{n.title}</p>
                      <p className="mt-0.5 text-xs text-navy-500">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-navy-50">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-gradient text-sm font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-navy-900">{user?.name}</span>
              <span className="block text-xs leading-tight text-navy-400">{ROLE_LABELS[user?.role]}</span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right animate-fade-in rounded-xl border border-navy-100 bg-white p-1.5 shadow-soft">
              <div className="border-b border-navy-50 px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-navy-900">{user?.name}</p>
                <p className="truncate text-xs text-navy-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <IconLogout className="h-[18px] w-[18px]" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
