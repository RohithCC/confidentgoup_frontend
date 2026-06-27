import { STATUS_LABELS, STATUS_STYLES } from '../utils/constants.js';

export const Spinner = ({ className = 'w-6 h-6' }) => (
  <svg className={`animate-spin text-navy-400 ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
  </svg>
);

export const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Spinner className="w-9 h-9" />
  </div>
);

export const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      STATUS_STYLES[status] || 'bg-navy-100 text-navy-700'
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

export const Logo = ({ light = false, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-gradient text-navy-900 shadow-soft">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M5 18 12 6l7 12Z" />
        <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
    <div className="leading-tight">
      <div className={`font-display text-lg font-bold ${light ? 'text-white' : 'text-navy-900'}`}>
        Confident
      </div>
      <div className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? 'text-gold-300' : 'text-gold-500'}`}>
        Property CRM
      </div>
    </div>
  </div>
);

export const EmptyState = ({ title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white/60 py-16 px-6 text-center">
    <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-navy-50 text-navy-300">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 7h18v13H3zM3 7l2-3h14l2 3" strokeLinejoin="round" />
      </svg>
    </div>
    <h3 className="font-display text-lg font-semibold text-navy-800">{title}</h3>
    {subtitle && <p className="mt-1 max-w-sm text-sm text-navy-500">{subtitle}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Pagination = ({ page, pages, onChange }) => {
  if (!pages || pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 px-1 pt-4">
      <button
        className="btn-ghost px-3 py-1.5 text-xs"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="text-xs font-medium text-navy-500">
        Page {page} of {pages}
      </span>
      <button
        className="btn-ghost px-3 py-1.5 text-xs"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
};
