import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetLeadQuery,
  useGetNotesQuery,
  useAddNoteMutation,
  useGetLeadFollowUpsQuery,
  useAddFollowUpMutation,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useGetAssignableQuery,
  useDeleteLeadMutation,
} from '../features/api/apiSlice.js';
import { selectRole } from '../features/auth/authSlice.js';
import { PageLoader, EmptyState, StatusBadge } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import RequirementCard from '../features/leadWorkflow/RequirementCard.jsx';
import DocumentsCard from '../features/leadWorkflow/DocumentsCard.jsx';
import PaymentsCard from '../features/leadWorkflow/PaymentsCard.jsx';
import ApproveModal from '../features/leadWorkflow/ApproveModal.jsx';
import {
  LEAD_TRANSITIONS, STATUS_LABELS, LOST_REASONS, ROLES, formatINR, prettyEnum,
} from '../utils/constants.js';
import { toast, confirmAction, apiErrorMessage } from '../utils/alert.js';
import { IconCalendar, IconTrash, IconCheck } from '../components/Icons.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '');

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(selectRole);

  const { data, isLoading, isError } = useGetLeadQuery(id);
  const [deleteLead] = useDeleteLeadMutation();

  const [statusModal, setStatusModal] = useState(null); // target status
  const [assignOpen, setAssignOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  if (isLoading) return <PageLoader />;
  if (isError || !data?.lead) return <EmptyState title="Lead not found" action={<Link to="/leads" className="btn-ghost">Back to leads</Link>} />;

  const lead = data.lead;
  const canManage = [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.AGENT].includes(role);
  const canAssign = [ROLES.SUPER_ADMIN, ROLES.STAFF].includes(role);
  const canApprove = [ROLES.SUPER_ADMIN, ROLES.STAFF].includes(role);
  const showApprove =
    canApprove && ['NEGOTIATION', 'BOOKING_PENDING'].includes(lead.status);
  const nextStatuses = LEAD_TRANSITIONS[lead.status] || [];

  // Payments + KYC are only actionable once the sale is WON.
  const saleWon = lead.status === 'WON';

  const onDelete = async () => {
    const ok = await confirmAction({
      title: 'Delete this lead?',
      text: 'This permanently removes the lead and its notes and follow-ups.',
      confirmText: 'Delete',
      icon: 'warning',
    });
    if (!ok) return;
    try {
      await deleteLead(id).unwrap();
      toast.success('Lead deleted');
      navigate('/leads');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link to="/leads" className="text-sm font-medium text-navy-400 hover:text-navy-700">← Back to leads</Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold text-navy-900 sm:text-2xl">{lead.customerName}</h2>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 break-words text-sm text-navy-500">{lead.leadCode} · {lead.phone}{lead.email ? ` · ${lead.email}` : ''}</p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {canAssign && <button onClick={() => setAssignOpen(true)} className="btn-ghost flex-1 sm:flex-none">Assign</button>}
            {showApprove && (
              <button onClick={() => setApproveOpen(true)} className="btn-gold flex-1 sm:flex-none">
                Approve sale
              </button>
            )}
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => setStatusModal(s)} className="btn-primary flex-1 whitespace-nowrap sm:flex-none">
                Move to {STATUS_LABELS[s]}
              </button>
            ))}
            {role === ROLES.SUPER_ADMIN && (
              <button onClick={onDelete} className="btn-ghost text-rose-600 hover:bg-rose-50" aria-label="Delete lead">
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + timeline */}
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">Details</h3>
            <dl className="space-y-3 text-sm">
              <Row label="Property" value={lead.property?.title || '—'} />
              <Row label="Location" value={lead.property?.location || '—'} />
              <Row label="Budget" value={formatINR(lead.budget)} />
              <Row label="Source" value={prettyEnum(lead.source)} />
              <Row label="Agent" value={lead.assignedAgent?.name || 'Unassigned'} />
              <Row label="Staff" value={lead.assignedStaff?.name || '—'} />
              {lead.status === 'WON' && <Row label="Booking" value={formatINR(lead.bookingAmount)} />}
              {lead.status === 'LOST' && <Row label="Lost reason" value={prettyEnum(lead.lostReason)} />}
              <Row label="Created" value={fmtDay(lead.createdAt)} />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">Status history</h3>
            <ol className="relative space-y-4 border-l border-navy-100 pl-5">
              {[...(lead.statusHistory || [])].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full bg-gold-gradient ring-4 ring-white">
                    <IconCheck className="h-2.5 w-2.5 text-navy-900" />
                  </span>
                  <p className="text-sm font-semibold text-navy-800">{STATUS_LABELS[h.to] || h.to}</p>
                  <p className="text-xs text-navy-400">{fmtDate(h.at)}{h.remark ? ` · ${h.remark}` : ''}</p>
                </li>
              ))}
              {!lead.statusHistory?.length && <p className="text-sm text-navy-400">No history yet.</p>}
            </ol>
          </div>
        </div>

        {/* Right: workflow + notes + follow-ups */}
        <div className="space-y-6 lg:col-span-2">
          {canManage && (
            <>
              <RequirementCard leadId={id} lead={lead} canManage={canManage} />
              <div className="grid gap-6 md:grid-cols-2">
                <DocumentsCard
                  leadId={id}
                  lead={lead}
                  role={role}
                  canManage={canManage}
                  kycEnabled={saleWon}
                />
                <PaymentsCard
                  leadId={id}
                  lead={lead}
                  role={role}
                  canManage={canManage}
                  paymentsEnabled={saleWon}
                />
              </div>
            </>
          )}
          {canManage && <FollowUps leadId={id} />}
          <Notes leadId={id} canAdd={canManage} />
        </div>
      </div>

      {statusModal && (
        <StatusModal
          leadId={id}
          target={statusModal}
          onClose={() => setStatusModal(null)}
        />
      )}
      {assignOpen && <AssignModal leadId={id} onClose={() => setAssignOpen(false)} />}
      {approveOpen && <ApproveModal leadId={id} lead={lead} onClose={() => setApproveOpen(false)} />}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <dt className="text-navy-400">{label}</dt>
    <dd className="text-right font-medium text-navy-800">{value}</dd>
  </div>
);

function Notes({ leadId, canAdd }) {
  const { data, isLoading } = useGetNotesQuery(leadId);
  const [addNote, { isLoading: adding }] = useAddNoteMutation();
  const [text, setText] = useState('');
  const notes = data?.data || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await addNote({ leadId, note: text.trim() }).unwrap();
      setText('');
      toast.success('Note added');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">Notes</h3>
      {canAdd && (
        <form onSubmit={submit} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note about this conversation…"
            className="input flex-1"
          />
          <button disabled={adding} className="btn-gold w-full whitespace-nowrap sm:w-auto">Add note</button>
        </form>
      )}
      {isLoading ? (
        <p className="text-sm text-navy-400">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-navy-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n._id} className="rounded-lg border border-navy-50 bg-navy-50/40 p-3">
              <p className="text-sm text-navy-800">{n.note}</p>
              <p className="mt-1 text-xs text-navy-400">
                {n.author?.name || 'System'} · {fmtDate(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FollowUps({ leadId }) {
  const { data } = useGetLeadFollowUpsQuery(leadId);
  const [addFollowUp, { isLoading }] = useAddFollowUpMutation();
  const [form, setForm] = useState({ followupDate: '', remarks: '' });
  const items = data?.data || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.followupDate) return;
    try {
      await addFollowUp({ leadId, followupDate: form.followupDate, remarks: form.remarks || undefined }).unwrap();
      setForm({ followupDate: '', remarks: '' });
      toast.success('Follow-up scheduled');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
        <IconCalendar className="h-5 w-5 text-gold-500" /> Follow-ups
      </h3>
      <form onSubmit={submit} className="mb-4 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
        <input
          type="datetime-local"
          value={form.followupDate}
          onChange={(e) => setForm((f) => ({ ...f, followupDate: e.target.value }))}
          className="input"
          required
        />
        <input
          value={form.remarks}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
          placeholder="Remarks (optional)"
          className="input"
        />
        <button disabled={isLoading} className="btn-primary w-full whitespace-nowrap sm:w-auto">Schedule</button>
      </form>
      {items.length === 0 ? (
        <p className="text-sm text-navy-400">No follow-ups scheduled.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((f) => (
            <li key={f._id} className="flex items-center justify-between rounded-lg border border-navy-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-navy-800">{fmtDate(f.followupDate)}</p>
                {f.remarks && <p className="text-xs text-navy-400">{f.remarks}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                f.status === 'DONE' ? 'bg-emerald-100 text-emerald-700'
                : f.status === 'MISSED' ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
                {prettyEnum(f.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusModal({ leadId, target, onClose }) {
  const [updateStatus, { isLoading }] = useUpdateLeadStatusMutation();
  const [remark, setRemark] = useState('');
  const [bookingAmount, setBookingAmount] = useState('');
  const [lostReason, setLostReason] = useState('NOT_INTERESTED');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { id: leadId, status: target, remark: remark || undefined };
      if (target === 'WON') payload.bookingAmount = Number(bookingAmount);
      if (target === 'LOST') payload.lostReason = lostReason;
      await updateStatus(payload).unwrap();
      toast.success(`Lead moved to ${STATUS_LABELS[target]}`);
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Move to ${STATUS_LABELS[target]}`}>
      <form onSubmit={submit} className="space-y-4">
        {target === 'WON' && (
          <div>
            <label className="label">Booking amount (₹) *</label>
            <input type="number" required value={bookingAmount} onChange={(e) => setBookingAmount(e.target.value)} className="input" />
          </div>
        )}
        {target === 'LOST' && (
          <div>
            <label className="label">Lost reason *</label>
            <select value={lostReason} onChange={(e) => setLostReason(e.target.value)} className="input">
              {LOST_REASONS.map((r) => <option key={r} value={r}>{prettyEnum(r)}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Remark</label>
          <input value={remark} onChange={(e) => setRemark(e.target.value)} className="input" placeholder="Optional note" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold">Confirm</button>
        </div>
      </form>
    </Modal>
  );
}

function AssignModal({ leadId, onClose }) {
  const { data } = useGetAssignableQuery();
  const [assignLead, { isLoading }] = useAssignLeadMutation();
  const [agent, setAgent] = useState('');
  const [staff, setStaff] = useState('');

  const people = data?.data || [];
  const agents = people.filter((p) => p.role === ROLES.AGENT);
  const staffs = people.filter((p) => p.role === ROLES.STAFF);

  const submit = async (e) => {
    e.preventDefault();
    if (!agent && !staff) { toast.warn('Pick an agent or staff member'); return; }
    try {
      await assignLead({ id: leadId, assignedAgent: agent || undefined, assignedStaff: staff || undefined }).unwrap();
      toast.success('Lead assigned');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title="Assign lead">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Agent</label>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} className="input">
            <option value="">— Select agent —</option>
            {agents.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Staff</label>
          <select value={staff} onChange={(e) => setStaff(e.target.value)} className="input">
            <option value="">— Select staff —</option>
            {staffs.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold">Assign</button>
        </div>
      </form>
    </Modal>
  );
}