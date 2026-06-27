import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetPaymentsQuery } from '../features/api/apiSlice.js';
import { PageLoader, EmptyState, Pagination } from '../components/UI.jsx';
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_STYLES,
  formatINR,
  prettyEnum,
} from '../utils/constants.js';
import { IconRupee } from '../components/Icons.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export default function Payments() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const params = useMemo(
    () => ({ page, limit: 15, status: status || undefined }),
    [page, status]
  );
  const { data, isLoading, isFetching } = useGetPaymentsQuery(params);

  const payments = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-navy-500">
          <IconRupee className="h-5 w-5 text-gold-500" />
          <span className="text-sm">All payments collected through the gateway.</span>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{prettyEnum(s)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : payments.length === 0 ? (
        <EmptyState title="No payments yet" subtitle="Payments collected on leads will appear here." />
      ) : (
        <>
          {/* Desktop table */}
          <div className={`card hidden overflow-hidden md:block ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50/50 text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Reference</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {payments.map((p) => (
                  <tr key={p._id} className="transition hover:bg-gold-50/40">
                    <td className="px-5 py-3.5">
                      {p.lead ? (
                        <Link to={`/leads/${p.lead._id}`} className="font-semibold text-navy-900 hover:text-gold-600">
                          {p.lead.customerName}
                        </Link>
                      ) : '—'}
                      <p className="text-xs text-navy-400">{p.lead?.leadCode}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">
                      {formatINR(p.amount)}
                      {p.refundedAmount > 0 && (
                        <span className="block text-xs font-normal text-rose-500">−{formatINR(p.refundedAmount)} refunded</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{prettyEnum(p.type)}</td>
                    <td className="px-5 py-3.5 text-xs text-navy-500">{p.razorpayPaymentId || p.razorpayOrderId || '—'}</td>
                    <td className="px-5 py-3.5 text-navy-600">{fmtDate(p.paidAt || p.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[p.status]}`}>
                        {prettyEnum(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {payments.map((p) => (
              <div key={p._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {p.lead ? (
                      <Link to={`/leads/${p.lead._id}`} className="truncate font-semibold text-navy-900">
                        {p.lead.customerName}
                      </Link>
                    ) : <span className="font-semibold text-navy-900">—</span>}
                    <p className="text-xs text-navy-400">{p.lead?.leadCode} · {prettyEnum(p.type)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[p.status]}`}>
                    {prettyEnum(p.status)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-gold-600">{formatINR(p.amount)}</span>
                  <span className="text-xs text-navy-400">{fmtDate(p.paidAt || p.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
