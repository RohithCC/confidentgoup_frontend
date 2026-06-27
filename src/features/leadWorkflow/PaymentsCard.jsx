import { useState } from 'react';
import {
  useGetPaymentsQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useRefundPaymentMutation,
} from '../../features/api/apiSlice.js';
import Modal from '../../components/Modal.jsx';
import { toast, apiErrorMessage, confirmAction } from '../../utils/alert.js';
import { openCheckout } from '../../utils/razorpay.js';
import {
  PAYMENT_TYPES,
  PAYMENT_STATUS_STYLES,
  formatINR,
  prettyEnum,
  ROLES,
} from '../../utils/constants.js';
import { IconRupee } from '../../components/Icons.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

export default function PaymentsCard({ leadId, lead, role, canManage, paymentsEnabled = false }) {
  const { data, isLoading } = useGetPaymentsQuery({ leadId, limit: 50 });
  const [payOpen, setPayOpen] = useState(false);
  const [refund] = useRefundPaymentMutation();
  const payments = data?.data || [];
  const isAdmin = role === ROLES.SUPER_ADMIN;

  // Collecting a payment is only allowed once the sale is WON.
  const canCollect = canManage && paymentsEnabled;

  const totalPaid = payments
    .filter((p) => p.status === 'PAID' || p.status === 'PARTIALLY_REFUNDED')
    .reduce((a, p) => a + (p.amount - (p.refundedAmount || 0)), 0);

  const onRefund = async (p) => {
    const ok = await confirmAction({
      title: 'Refund this payment?',
      text: `This will refund ${formatINR(p.amount - (p.refundedAmount || 0))} via Razorpay.`,
      confirmText: 'Refund',
    });
    if (!ok) return;
    try {
      await refund({ id: p._id }).unwrap();
      toast.success('Refund initiated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const openCollect = () => {
    if (!canCollect) return; // defensive guard
    setPayOpen(true);
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
          <IconRupee className="h-5 w-5 text-gold-500" /> Payments
        </h3>
        {canManage && (
          <button
            onClick={openCollect}
            disabled={!canCollect}
            title={canCollect ? undefined : 'Available after the sale is marked Won'}
            className="btn-primary w-full justify-center px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Collect payment
          </button>
        )}
      </div>

      {canManage && !paymentsEnabled && (
        <p className="mb-3 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-500">
          Payment collection unlocks once this lead is marked <span className="font-semibold">Won</span>.
        </p>
      )}

      {totalPaid > 0 && (
        <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          Total received: {formatINR(totalPaid)}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-navy-400">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-navy-400">No payments yet.</p>
      ) : (
        <ul className="space-y-2">
          {payments.map((p) => (
            <li key={p._id} className="flex items-center justify-between gap-3 rounded-lg border border-navy-50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-900">
                  {formatINR(p.amount)} <span className="text-xs font-normal text-navy-400">· {prettyEnum(p.type)}</span>
                </p>
                <p className="truncate text-xs text-navy-400">
                  {p.paidAt ? fmtDate(p.paidAt) : fmtDate(p.createdAt)}
                  {p.razorpayPaymentId ? ` · ${p.razorpayPaymentId}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLES[p.status]}`}>
                  {prettyEnum(p.status)}
                </span>
                {isAdmin && p.status === 'PAID' && (
                  <button onClick={() => onRefund(p)} className="text-xs font-semibold text-rose-600 hover:underline">
                    Refund
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {payOpen && canCollect && <CollectModal leadId={leadId} lead={lead} onClose={() => setPayOpen(false)} />}
    </div>
  );
}

function CollectModal({ leadId, lead, onClose }) {
  const [amount, setAmount] = useState(lead.bookingAmount || lead.budget || '');
  const [type, setType] = useState('BOOKING');
  const [createOrder, { isLoading: creating }] = useCreatePaymentOrderMutation();
  const [verifyPayment, { isLoading: verifying }] = useVerifyPaymentMutation();
  const [processing, setProcessing] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.warn('Enter a valid amount'); return; }

    setProcessing(true);
    try {
      // 1) Create the order on our backend.
      const res = await createOrder({ leadId, amount: amt, type }).unwrap();
      const { order, keyId } = res;

      // 2) Open Razorpay Checkout.
      const success = await openCheckout({
        keyId,
        order,
        prefill: { name: lead.customerName, email: lead.email, contact: lead.phone },
        description: `${prettyEnum(type)} payment — ${lead.leadCode}`,
      });

      // 3) Verify the signature server-side (webhook is the source of truth too).
      await verifyPayment({ leadId, ...success }).unwrap();
      toast.success('Payment successful');
      onClose();
    } catch (err) {
      // openCheckout rejects with Error('Payment cancelled') on dismiss.
      const msg = err?.message || apiErrorMessage(err);
      if (msg === 'Payment cancelled') toast.info('Payment cancelled');
      else toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const busy = creating || verifying || processing;

  return (
    <Modal open onClose={busy ? undefined : onClose} closeOnBackdrop={!busy} title="Collect payment">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Amount (₹) *</label>
          <input
            type="number"
            inputMode="numeric"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Payment type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{prettyEnum(t)}</option>)}
          </select>
        </div>
        <p className="rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-500">
          A secure Razorpay window will open to complete the payment. The customer's card/UPI
          details are handled by Razorpay and never touch this app.
        </p>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={busy} className="btn-gold w-full justify-center sm:w-auto">
            {busy ? 'Processing…' : 'Pay now'}
          </button>
        </div>
      </form>
    </Modal>
  );
}