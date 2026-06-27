import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../features/auth/authSlice.js';
import { Logo } from '../components/UI.jsx';
import UserMenu from '../components/UserMenu.jsx';

/**
 * Public top nav (Home / Catalog).
 * - Keeps the existing search props (search, onSearch).
 * - Mobile: hamburger menu for links + a full-width search row.
 * - UserMenu (logout dropdown) works on every screen size.
 */
export default function PublicNav({ search, onSearch }) {
  const user = useSelector(selectUser);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const hasSearch = typeof onSearch === 'function';

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      {/* ---------- Top bar ---------- */}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="shrink-0" onClick={closeMenu}>
          <Logo />
        </Link>

        {/* Desktop search */}
        {hasSearch && (
          <div className="relative ml-2 hidden flex-1 sm:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              type="search"
              value={search}
              onChange={onSearch}
              placeholder="Search properties by location, type…"
              className="w-full rounded-full border border-navy-100 bg-navy-50/50 py-2 pl-9 pr-4 text-sm text-navy-800 outline-none focus:border-gold-300 focus:bg-white"
            />
          </div>
        )}

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-4 sm:flex">
          <Link to="/catalog" className="text-sm font-medium text-navy-600 hover:text-navy-900">
            Properties
          </Link>
          {user ? (
            <UserMenu variant="dark" />
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-navy-700 hover:text-navy-900">
                Sign in
              </Link>
              <Link to="/register" className="btn-gold">
                Create account
              </Link>
            </>
          )}
        </nav>

        {/* Mobile controls: UserMenu (if logged in) + hamburger */}
        <div className="ml-auto flex items-center gap-1 sm:hidden">
          {user && <UserMenu variant="dark" />}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="grid h-10 w-10 place-items-center rounded-lg text-navy-700 hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ---------- Mobile search row ---------- */}
      {hasSearch && (
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              type="search"
              value={search}
              onChange={onSearch}
              placeholder="Search properties…"
              className="w-full rounded-full border border-navy-100 bg-navy-50/50 py-2 pl-9 pr-4 text-sm text-navy-800 outline-none focus:border-gold-300 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* ---------- Mobile dropdown menu ---------- */}
      {menuOpen && (
        <div className="animate-fade-in border-t border-navy-100 bg-white px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              to="/catalog"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              Properties
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  Edit profile
                </Link>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={closeMenu} className="btn-ghost text-center">
                  Sign in
                </Link>
                <Link to="/register" onClick={closeMenu} className="btn-gold text-center">
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

/* ---------- inline icons (no extra deps) ---------- */
function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a1 1 0 01-1.42 1.42l-3.08-3.08A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function MenuIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}