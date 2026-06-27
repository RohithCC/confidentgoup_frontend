import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectRole } from '../features/auth/authSlice.js';
import { ROLES } from '../utils/constants.js';
import { Logo } from './UI.jsx';
import {
  IconDashboard,
  IconLeads,
  IconProperty,
  IconUsers,
  IconCalendar,
  IconRupee,
  IconClose,
} from './Icons.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard, roles: Object.values(ROLES) },
  { to: '/leads', label: 'Leads', Icon: IconLeads, roles: [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT] },
  { to: '/properties', label: 'Properties', Icon: IconProperty, roles: Object.values(ROLES) },
  { to: '/followups', label: 'Follow-ups', Icon: IconCalendar, roles: [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT] },
  { to: '/payments', label: 'Payments', Icon: IconRupee, roles: [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT] },
  { to: '/users', label: 'Users', Icon: IconUsers, roles: [ROLES.SUPER_ADMIN] },
];

function Sidebar({ open, onClose }) {
  const role = useSelector(selectRole);
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-navy-gradient transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo light />
          <button onClick={onClose} className="text-white/70 hover:text-white lg:hidden" aria-label="Close menu">
            <IconClose />
          </button>
        </div>

        <nav className="mt-2 space-y-1 px-3">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                    : 'text-navy-100/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-gold-400' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="font-display text-sm font-semibold text-white">Confident Group</p>
            <p className="mt-1 text-xs text-navy-100/60">
              20+ years building trust across Kerala &amp; Bangalore.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default memo(Sidebar);
