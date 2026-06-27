import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetMyFollowUpsQuery } from '../features/api/apiSlice.js';
import { PageLoader, EmptyState } from '../components/UI.jsx';
import { prettyEnum } from '../utils/constants.js';
import { IconCalendar } from '../components/Icons.jsx';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const STATUS_PILL = {
  PENDING: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  MISSED: 'bg-rose-100 text-rose-700',
};

export default function FollowUps() {
  const [todayOnly, setTodayOnly] = useState(false);
  const { data, isLoading } = useGetMyFollowUpsQuery(
    todayOnly ? { today: 'true' } : {}
  );
  const items = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-500">
          {todayOnly ? "Today's scheduled follow-ups." : 'All your upcoming follow-ups.'}
        </p>
        <div className="inline-flex rounded-lg border border-navy-100 bg-white p-1 text-sm">
          <button
            onClick={() => setTodayOnly(false)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${!todayOnly ? 'bg-navy-800 text-white' : 'text-navy-500'}`}
          >
            All
          </button>
          <button
            onClick={() => setTodayOnly(true)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${todayOnly ? 'bg-navy-800 text-white' : 'text-navy-500'}`}
          >
            Today
          </button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          subtitle={todayOnly ? 'Nothing scheduled for today.' : 'Schedule follow-ups from a lead’s detail page.'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <Link
              key={f._id}
              to={f.lead ? `/leads/${f.lead._id}` : '#'}
              className="card flex items-center justify-between p-4 transition hover:bg-gold-50/40"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-gradient text-gold-400">
                  <IconCalendar className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-navy-900">{f.lead?.customerName || 'Lead'}</p>
                  <p className="text-xs text-navy-400">
                    {f.lead?.leadCode} · {fmt(f.followupDate)}
                  </p>
                  {f.remarks && <p className="mt-0.5 truncate text-xs text-navy-500">{f.remarks}</p>}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[f.status]}`}>
                {prettyEnum(f.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
