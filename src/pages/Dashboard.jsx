import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetDashboardQuery } from '../features/api/apiSlice.js';
import { selectUser } from '../features/auth/authSlice.js';
import { PageLoader, EmptyState, StatusBadge } from '../components/UI.jsx';
import { formatINR, STATUS_LABELS, STATUS_STYLES, ROLES } from '../utils/constants.js';
import { IconLeads, IconProperty, IconTrend, IconCheck, IconCalendar } from '../components/Icons.jsx';

const StatCard = ({ label, value, Icon, accent = 'navy', hint }) => {
  const accents = {
    navy: 'from-navy-700 to-navy-900 text-white',
    gold: 'from-gold-400 to-gold-600 text-navy-900',
    green: 'from-emerald-500 to-emerald-700 text-white',
    rose: 'from-rose-500 to-rose-600 text-white',
  };
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-navy-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accents[accent]} shadow-soft`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

// Simple horizontal bar breakdown of leads by status.
const StatusBars = ({ breakdown }) => {
  const entries = Object.entries(breakdown || {}).filter(([, v]) => v > 0);
  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  if (!entries.length) return <p className="text-sm text-navy-400">No lead data yet.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([status, count]) => (
        <div key={status}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <StatusBadge status={status} />
            <span className="font-semibold text-navy-600">{count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-navy-50">
            <div
              className={`h-full rounded-full ${(STATUS_STYLES[status] || '').replace(/text-\S+/, '')}`}
              style={{ width: `${(count / total) * 100}%`, backgroundColor: 'currentColor' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const user = useSelector(selectUser);
  const { data, isLoading, isError } = useGetDashboardQuery();

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <EmptyState title="Couldn't load the dashboard" subtitle="Please refresh and try again." />;

  const m = data.metrics || {};
  const role = data.role;
  const greeting = `Welcome back, ${user?.name?.split(' ')[0] || 'there'}`;

  // ---- Customer (USER) ----
  if (role === ROLES.USER) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">{greeting}</h2>
          <p className="text-sm text-navy-500">Here are your property enquiries.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Enquiries" value={m.myEnquiries ?? 0} Icon={IconLeads} accent="navy" />
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">Recent enquiries</h3>
          {data.data?.length ? (
            <ul className="divide-y divide-navy-50">
              {data.data.map((l) => (
                <li key={l._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-navy-800">{l.property?.title || 'Property enquiry'}</p>
                    <p className="text-xs text-navy-400">{l.leadCode} · {l.property?.location}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No enquiries yet"
              subtitle="Browse properties and submit an enquiry to get started."
              action={<Link to="/properties" className="btn-gold">Browse properties</Link>}
            />
          )}
        </div>
      </div>
    );
  }

  // ---- Agent ----
  if (role === ROLES.AGENT) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">{greeting}</h2>
          <p className="text-sm text-navy-500">Your assigned pipeline at a glance.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Assigned Leads" value={m.assignedLeads ?? 0} Icon={IconLeads} accent="navy" />
          <StatCard label="New Enquiries" value={m.newEnquiries ?? 0} Icon={IconTrend} accent="gold" />
          <StatCard label="Today's Follow-ups" value={m.todayFollowUps ?? 0} Icon={IconCalendar} accent="rose" hint="Pending today" />
          <StatCard label="Won Deals" value={m.wonLeads ?? 0} Icon={IconCheck} accent="green" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">Pipeline breakdown</h3>
            <StatusBars breakdown={m.statusBreakdown} />
          </div>
          <div className="card flex flex-col justify-between p-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-navy-900">Quick actions</h3>
              <p className="mt-1 text-sm text-navy-500">Jump straight to work.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/leads" className="btn-ghost">View leads</Link>
              <Link to="/followups" className="btn-ghost">Follow-ups</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Super Admin / Staff ----
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy-900">{greeting}</h2>
        <p className="text-sm text-navy-500">
          {role === ROLES.SUPER_ADMIN ? 'Full overview of the sales pipeline.' : 'Your team overview.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Leads" value={m.totalLeads ?? 0} Icon={IconLeads} accent="navy" />
        <StatCard label="Properties" value={m.totalProperties ?? 0} Icon={IconProperty} accent="gold" />
        <StatCard label="Won Deals" value={m.wonLeads ?? 0} Icon={IconCheck} accent="green" hint={`${m.conversionRate ?? 0}% conversion`} />
        <StatCard label="Revenue Pipeline" value={formatINR(m.revenuePipeline)} Icon={IconTrend} accent="navy" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New" value={m.newLeads ?? 0} Icon={IconLeads} accent="navy" />
        <StatCard label="Contacted" value={m.contactedLeads ?? 0} Icon={IconLeads} accent="navy" />
        <StatCard label="Site Visits" value={m.siteVisits ?? 0} Icon={IconCalendar} accent="gold" />
        <StatCard label="Lost" value={m.lostLeads ?? 0} Icon={IconLeads} accent="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">Leads by status</h3>
          <StatusBars breakdown={m.statusBreakdown} />
        </div>
        <div className="card flex flex-col justify-between p-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-900">Conversion</h3>
            <p className="mt-1 text-sm text-navy-500">Won vs total leads</p>
          </div>
          <div className="my-6 text-center">
            <div className="font-display text-5xl font-bold text-gold-500">{m.conversionRate ?? 0}%</div>
            <p className="mt-2 text-sm text-navy-400">
              {m.wonLeads ?? 0} won of {m.totalLeads ?? 0} leads
            </p>
          </div>
          <Link to="/leads" className="btn-primary w-full">Manage leads</Link>
        </div>
      </div>
    </div>
  );
}
