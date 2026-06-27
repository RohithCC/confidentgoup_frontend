import { useState } from 'react';
import {
  useGetLeadDocumentsQuery,
  useUploadLeadDocumentsMutation,
  useVerifyDocumentMutation,
  useDeleteDocumentMutation,
  useUploadAgreementMutation,
} from '../../features/api/apiSlice.js';
import Modal from '../../components/Modal.jsx';
import { toast, apiErrorMessage, confirmAction, promptText } from '../../utils/alert.js';
import {
  DOCUMENT_TYPES,
  DOCUMENT_STATUS_STYLES,
  prettyEnum,
  ROLES,
} from '../../utils/constants.js';
import { IconDocument, IconUpload, IconTrash, IconCheck, IconShield } from '../../components/Icons.jsx';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;

export default function DocumentsCard({ leadId, lead, role, canManage }) {
  const { data, isLoading } = useGetLeadDocumentsQuery(leadId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const docs = data?.data || [];
  const canVerify = [ROLES.SUPER_ADMIN, ROLES.STAFF].includes(role);

  const [verifyDoc] = useVerifyDocumentMutation();
  const [deleteDoc] = useDeleteDocumentMutation();

  const onVerify = async (doc, status) => {
    let rejectionReason;
    if (status === 'REJECTED') {
      const value = await promptText({
        title: 'Reject document',
        label: 'Reason',
        placeholder: 'Why is this rejected?',
        confirmText: 'Reject',
        danger: true,
      });
      if (value === null) return; // cancelled
      rejectionReason = value || 'Not specified';
    }
    try {
      await verifyDoc({ id: doc._id, leadId, status, rejectionReason }).unwrap();
      toast.success(status === 'VERIFIED' ? 'Document verified' : 'Document rejected');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const onDelete = async (doc) => {
    const ok = await confirmAction({ title: 'Delete document?', confirmText: 'Delete' });
    if (!ok) return;
    try {
      await deleteDoc({ id: doc._id, leadId }).unwrap();
      toast.success('Document deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
          <IconDocument className="h-5 w-5 text-gold-500" /> Documents (KYC)
        </h3>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setAgreementOpen(true)} className="btn-ghost px-3 py-1.5 text-xs">
              Agreement
            </button>
            <button onClick={() => setUploadOpen(true)} className="btn-primary px-3 py-1.5 text-xs">
              <IconUpload className="h-3.5 w-3.5" /> Upload
            </button>
          </div>
        )}
      </div>

      {lead.booking?.documentsVerified && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <IconShield className="h-4 w-4" /> All documents verified
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-navy-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-navy-400">No documents uploaded.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d._id} className="flex items-center gap-3 rounded-lg border border-navy-50 px-3 py-2">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-medium text-navy-800 hover:text-gold-600">
                  {prettyEnum(d.type)}{d.label ? ` · ${d.label}` : ''}
                </p>
                <p className="truncate text-xs text-navy-400">{new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
              </a>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${DOCUMENT_STATUS_STYLES[d.status]}`}>
                {prettyEnum(d.status)}
              </span>
              {canVerify && d.status !== 'VERIFIED' && (
                <button onClick={() => onVerify(d, 'VERIFIED')} className="shrink-0 rounded-md p-1 text-emerald-600 hover:bg-emerald-50" aria-label="Verify">
                  <IconCheck className="h-4 w-4" />
                </button>
              )}
              {canVerify && d.status === 'PENDING' && (
                <button onClick={() => onVerify(d, 'REJECTED')} className="shrink-0 rounded-md p-1 text-rose-600 hover:bg-rose-50" aria-label="Reject">
                  <span className="text-sm font-bold">✕</span>
                </button>
              )}
              {canManage && (
                <button onClick={() => onDelete(d)} className="shrink-0 rounded-md p-1 text-navy-300 hover:text-rose-600" aria-label="Delete">
                  <IconTrash className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {lead.booking?.agreement?.url && (
        <a
          href={lead.booking.agreement.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:underline"
        >
          <IconDocument className="h-4 w-4" /> View agreement
        </a>
      )}

      {uploadOpen && <UploadModal leadId={leadId} onClose={() => setUploadOpen(false)} />}
      {agreementOpen && <AgreementModal leadId={leadId} onClose={() => setAgreementOpen(false)} />}
    </div>
  );
}

function UploadModal({ leadId, onClose }) {
  const [type, setType] = useState('AADHAAR');
  const [files, setFiles] = useState([]);
  const [upload, { isLoading }] = useUploadLeadDocumentsMutation();

  const onPick = (e) => {
    const incoming = Array.from(e.target.files || []);
    const valid = [];
    for (const f of incoming) {
      if (!ACCEPTED.includes(f.type)) { toast.error(`${f.name}: unsupported type`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: exceeds 10MB`); continue; }
      valid.push(f);
    }
    setFiles(valid);
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) { toast.warn('Choose at least one file'); return; }
    const fd = new FormData();
    fd.append('type', type);
    files.forEach((f) => fd.append('documents', f));
    try {
      await upload({ leadId, formData: fd }).unwrap();
      toast.success('Documents uploaded');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title="Upload documents">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Document type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            {DOCUMENT_TYPES.filter((t) => t !== 'AGREEMENT').map((t) => (
              <option key={t} value={t}>{prettyEnum(t)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Files <span className="text-navy-400">(images or PDF, 10MB each)</span></label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-200 px-4 py-6 text-center transition hover:border-gold-400 hover:bg-navy-50">
            <IconUpload className="h-5 w-5 text-navy-400" />
            <span className="text-sm text-navy-500">Click to choose files</span>
            <input type="file" accept={ACCEPTED.join(',')} multiple onChange={onPick} className="hidden" />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-navy-500">
              {files.map((f, i) => <li key={i} className="truncate">• {f.name}</li>)}
            </ul>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold w-full justify-center sm:w-auto">
            {isLoading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AgreementModal({ leadId, onClose }) {
  const [file, setFile] = useState(null);
  const [upload, { isLoading }] = useUploadAgreementMutation();

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) { toast.error('Unsupported type'); return; }
    if (f.size > 15 * 1024 * 1024) { toast.error('Exceeds 15MB'); return; }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { toast.warn('Choose the agreement file'); return; }
    const fd = new FormData();
    fd.append('agreement', file);
    try {
      await upload({ leadId, formData: fd }).unwrap();
      toast.success('Agreement uploaded');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title="Upload agreement">
      <form onSubmit={submit} className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-200 px-4 py-6 text-center transition hover:border-gold-400 hover:bg-navy-50">
          <IconUpload className="h-5 w-5 text-navy-400" />
          <span className="text-sm text-navy-500">{file ? file.name : 'Click to choose the agreement (PDF/image)'}</span>
          <input type="file" accept={ACCEPTED.join(',')} onChange={onPick} className="hidden" />
        </label>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold w-full justify-center sm:w-auto">
            {isLoading ? 'Uploading…' : 'Upload agreement'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
