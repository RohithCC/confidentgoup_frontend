import { useState } from 'react';
import {
  useUpsertRequirementMutation,
  useGetLeadMatchesQuery,
  useSharePropertiesMutation,
} from '../../features/api/apiSlice.js';
import Modal from '../../components/Modal.jsx';
import { toast, apiErrorMessage } from '../../utils/alert.js';
import {
  PROPERTY_TYPES,
  PURPOSE_VALUES,
  POSSESSION_VALUES,
  formatINR,
  prettyEnum,
} from '../../utils/constants.js';
import { IconClipboard, IconHome, IconShare } from '../../components/Icons.jsx';

const toForm = (r = {}) => ({
  budget: r.budget ?? '',
  budgetMax: r.budgetMax ?? '',
  location: r.location ?? '',
  city: r.city ?? '',
  propertyType: r.propertyType ?? '',
  bhk: r.bhk ?? '',
  loanRequired: Boolean(r.loanRequired),
  possessionTimeline: r.possessionTimeline ?? '',
  purpose: r.purpose ?? '',
  notes: r.notes ?? '',
});

export default function RequirementCard({ leadId, lead, canManage }) {
  const [editOpen, setEditOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const r = lead.requirement;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
          <IconClipboard className="h-5 w-5 text-gold-500" /> Requirement
        </h3>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setMatchOpen(true)} className="btn-ghost px-3 py-1.5 text-xs">
              <IconHome className="h-3.5 w-3.5" /> Matches
            </button>
            <button onClick={() => setEditOpen(true)} className="btn-primary px-3 py-1.5 text-xs">
              {r ? 'Edit' : 'Capture'}
            </button>
          </div>
        )}
      </div>

      {r ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Field label="Budget" value={r.budget ? formatINR(r.budget) : '—'} />
          <Field label="Max budget" value={r.budgetMax ? formatINR(r.budgetMax) : '—'} />
          <Field label="Location" value={r.location || '—'} />
          <Field label="City" value={r.city || '—'} />
          <Field label="Type" value={r.propertyType ? prettyEnum(r.propertyType) : '—'} />
          <Field label="BHK" value={r.bhk ?? '—'} />
          <Field label="Loan" value={r.loanRequired ? 'Required' : 'Not required'} />
          <Field label="Possession" value={r.possessionTimeline ? prettyEnum(r.possessionTimeline) : '—'} />
          <Field label="Purpose" value={r.purpose ? prettyEnum(r.purpose) : '—'} />
          {r.notes && <div className="col-span-2"><Field label="Notes" value={r.notes} /></div>}
        </dl>
      ) : (
        <p className="text-sm text-navy-400">
          No requirement captured yet.{canManage ? ' Use “Capture” to record budget, location, BHK and financing.' : ''}
        </p>
      )}

      {editOpen && (
        <RequirementModal
          leadId={leadId}
          initial={r}
          onClose={() => setEditOpen(false)}
        />
      )}
      {matchOpen && <MatchesModal leadId={leadId} lead={lead} onClose={() => setMatchOpen(false)} />}
    </div>
  );
}

const Field = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-navy-400">{label}</dt>
    <dd className="mt-0.5 font-medium text-navy-800">{value}</dd>
  </div>
);

function RequirementModal({ leadId, initial, onClose }) {
  const [form, setForm] = useState(toForm(initial));
  const [save, { isLoading }] = useUpsertRequirementMutation();
  const on = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { id: leadId };
    // Only send provided fields; coerce numbers.
    if (form.budget !== '') payload.budget = Number(form.budget);
    if (form.budgetMax !== '') payload.budgetMax = Number(form.budgetMax);
    if (form.location) payload.location = form.location;
    if (form.city) payload.city = form.city;
    if (form.propertyType) payload.propertyType = form.propertyType;
    if (form.bhk !== '') payload.bhk = Number(form.bhk);
    payload.loanRequired = form.loanRequired;
    if (form.possessionTimeline) payload.possessionTimeline = form.possessionTimeline;
    if (form.purpose) payload.purpose = form.purpose;
    if (form.notes) payload.notes = form.notes;

    try {
      await save(payload).unwrap();
      toast.success('Requirement saved');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title="Requirement analysis" maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Budget (₹)</label>
            <input name="budget" type="number" inputMode="numeric" value={form.budget} onChange={on} className="input" />
          </div>
          <div>
            <label className="label">Max budget (₹)</label>
            <input name="budgetMax" type="number" inputMode="numeric" value={form.budgetMax} onChange={on} className="input" />
          </div>
          <div>
            <label className="label">Location</label>
            <input name="location" value={form.location} onChange={on} className="input" placeholder="e.g. Whitefield" />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" value={form.city} onChange={on} className="input" />
          </div>
          <div>
            <label className="label">Property type</label>
            <select name="propertyType" value={form.propertyType} onChange={on} className="input">
              <option value="">— Any —</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{prettyEnum(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">BHK</label>
            <input name="bhk" type="number" inputMode="numeric" value={form.bhk} onChange={on} className="input" />
          </div>
          <div>
            <label className="label">Possession timeline</label>
            <select name="possessionTimeline" value={form.possessionTimeline} onChange={on} className="input">
              <option value="">— Any —</option>
              {POSSESSION_VALUES.map((p) => <option key={p} value={p}>{prettyEnum(p)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Purpose</label>
            <select name="purpose" value={form.purpose} onChange={on} className="input">
              <option value="">— Select —</option>
              {PURPOSE_VALUES.map((p) => <option key={p} value={p}>{prettyEnum(p)}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
              <input name="loanRequired" type="checkbox" checked={form.loanRequired} onChange={on} className="h-4 w-4 rounded border-navy-300" />
              Home loan required
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" rows="2" value={form.notes} onChange={on} className="input" />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold w-full justify-center sm:w-auto">
            {isLoading ? 'Saving…' : 'Save requirement'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MatchesModal({ leadId, lead, onClose }) {
  const { data, isLoading, isError } = useGetLeadMatchesQuery({ id: leadId, limit: 12 });
  const [share, { isLoading: sharing }] = useSharePropertiesMutation();
  const [selected, setSelected] = useState([]);
  const matches = data?.data || [];

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onShare = async () => {
    if (!selected.length) { toast.warn('Select at least one property'); return; }
    try {
      const res = await share({ id: leadId, propertyIds: selected, channel: 'EMAIL' }).unwrap();
      toast.success(`Shared ${res.shared ?? selected.length} properties with the customer`);
      setSelected([]);
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Matching properties"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-navy-400">{selected.length} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Close</button>
            <button
              onClick={onShare}
              disabled={sharing || !selected.length || !lead.email}
              className="btn-gold px-4 py-2 text-sm"
              title={!lead.email ? 'Lead has no email to share to' : undefined}
            >
              <IconShare className="h-4 w-4" /> {sharing ? 'Sharing…' : 'Share by email'}
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-sm text-navy-400">Finding matches…</p>
      ) : isError ? (
        <p className="text-sm text-rose-600">Couldn't load matches.</p>
      ) : matches.length === 0 ? (
        <p className="text-sm text-navy-400">
          No matching available properties. Capture/adjust the requirement to widen the search.
        </p>
      ) : (
        <ul className="space-y-2">
          {matches.map(({ property: p, score }) => (
            <li
              key={p._id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                selected.includes(p._id) ? 'border-gold-400 bg-gold-50/50' : 'border-navy-100'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(p._id)}
                onChange={() => toggle(p._id)}
                className="h-4 w-4 shrink-0 rounded border-navy-300"
              />
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-navy-gradient">
                {p.images?.[0]?.url && (
                  <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900">{p.title}</p>
                <p className="truncate text-xs text-navy-400">{p.location} · {formatINR(p.price)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {score}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
