import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useGetPropertiesQuery,
} from '../features/api/apiSlice.js';
import { selectRole } from '../features/auth/authSlice.js';
import { useDebounce } from '../utils/useDebounce.js';
import { PageLoader, EmptyState, StatusBadge, Pagination } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import {
  LEAD_STATUSES, STATUS_LABELS, LEAD_SOURCES, ROLES, formatINR, prettyEnum,
} from '../utils/constants.js';
import { toast, apiErrorMessage } from '../utils/alert.js';
import { IconPlus, IconSearch, IconPhone } from '../components/Icons.jsx';

const emptyForm = { customerName: '', phone: '', email: '', budget: '', property: '', source: 'WEBSITE' };

export default function Leads() {
  const navigate = useNavigate();
  const role = useSelector(selectRole);
  const canCreate = [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT].includes(role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search);

  // Memoize params so the query key is stable (avoids needless refetch).
  const params = useMemo(
    () => ({ page, limit: 12, search: debouncedSearch || undefined, status: status || undefined }),
    [page, debouncedSearch, status]
  );
  const { data, isLoading, isFetching } = useGetLeadsQuery(params);

  const [modalOpen, setModalOpen] = useState(false);

  const leads = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, phone, code…"
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {canCreate && (
            <button onClick={() => setModalOpen(true)} className="btn-gold whitespace-nowrap">
              <IconPlus className="h-4 w-4" /> New lead
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <PageLoader />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          subtitle={search || status ? 'Try adjusting your filters.' : 'New enquiries will appear here.'}
          action={canCreate && <button onClick={() => setModalOpen(true)} className="btn-gold"><IconPlus className="h-4 w-4" /> Add a lead</button>}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className={`card hidden overflow-hidden md:block ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50/50 text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-5 py-3 font-semibold">Property</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Agent</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {leads.map((l) => (
                  <tr
                    key={l._id}
                    onClick={() => navigate(`/leads/${l._id}`)}
                    className="cursor-pointer transition hover:bg-gold-50/40"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-navy-900">{l.customerName}</p>
                      <p className="text-xs text-navy-400">{l.leadCode} · {l.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">
                      {l.property?.title || '—'}
                      {l.budget ? <span className="block text-xs text-navy-400">Budget {formatINR(l.budget)}</span> : null}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{prettyEnum(l.source)}</td>
                    <td className="px-5 py-3.5 text-navy-600">{l.assignedAgent?.name || <span className="text-navy-300">Unassigned</span>}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {leads.map((l) => (
              <button
                key={l._id}
                onClick={() => navigate(`/leads/${l._id}`)}
                className="card flex w-full items-center justify-between p-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy-900">{l.customerName}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-400">
                    <IconPhone className="h-3 w-3" /> {l.phone}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-navy-400">{l.property?.title || l.leadCode}</p>
                </div>
                <StatusBadge status={l.status} />
              </button>
            ))}
          </div>

          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
        </>
      )}

      <CreateLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function CreateLeadModal({ open, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const { data: propData } = useGetPropertiesQuery({ limit: 100 }, { skip: !open });
  const properties = propData?.data || [];

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
        property: form.property || undefined,
        email: form.email || undefined,
      };
      await createLead(payload).unwrap();
      toast.success('Lead created');
      setForm(emptyForm);
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New lead">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Customer name *</label>
            <input name="customerName" required value={form.customerName} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input name="phone" required value={form.phone} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Budget (₹)</label>
            <input name="budget" type="number" value={form.budget} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Property</label>
            <select name="property" value={form.property} onChange={onChange} className="input">
              <option value="">— None —</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <select name="source" value={form.source} onChange={onChange} className="input">
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>{prettyEnum(s)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold">
            {isLoading ? 'Saving…' : 'Create lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
