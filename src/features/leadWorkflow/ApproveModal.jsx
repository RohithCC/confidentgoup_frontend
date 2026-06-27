import { useState } from 'react';
import { useApproveSaleMutation } from '../../features/api/apiSlice.js';
import Modal from '../../components/Modal.jsx';
import { toast, apiErrorMessage } from '../../utils/alert.js';
import { formatINR } from '../../utils/constants.js';
import { IconShield } from '../../components/Icons.jsx';

export default function ApproveModal({ leadId, lead, onClose }) {
  const [approve, { isLoading }] = useApproveSaleMutation();
  const [bookingAmount, setBookingAmount] = useState(
    lead.booking?.bookingAmount || lead.bookingAmount || lead.booking?.totalAmountReceived || ''
  );
  const [remark, setRemark] = useState('');

  const docsVerified = Boolean(lead.booking?.documentsVerified);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await approve({
        id: leadId,
        bookingAmount: bookingAmount ? Number(bookingAmount) : undefined,
        remark: remark || undefined,
      }).unwrap();
      toast.success('Sale approved — lead marked Won');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title="Approve sale (Final Sale)">
      <form onSubmit={submit} className="space-y-4">
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
          docsVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          <IconShield className="h-4 w-4" />
          {docsVerified ? 'Documents verified' : 'Documents not fully verified yet'}
        </div>

        {!docsVerified && (
          <p className="text-sm text-navy-500">
            All KYC documents must be verified before the sale can be approved. Verify the
            pending documents first.
          </p>
        )}

        <div>
          <label className="label">Booking amount (₹) *</label>
          <input
            type="number"
            inputMode="numeric"
            required
            value={bookingAmount}
            onChange={(e) => setBookingAmount(e.target.value)}
            className="input"
          />
          {lead.booking?.totalAmountReceived ? (
            <p className="mt-1 text-xs text-navy-400">
              Received so far: {formatINR(lead.booking.totalAmountReceived)}
            </p>
          ) : null}
        </div>
        <div>
          <label className="label">Remark</label>
          <input value={remark} onChange={(e) => setRemark(e.target.value)} className="input" placeholder="Optional" />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={isLoading || !docsVerified} className="btn-gold w-full justify-center sm:w-auto">
            {isLoading ? 'Approving…' : 'Approve & mark Won'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
