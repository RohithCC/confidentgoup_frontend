import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetPropertiesQuery,
  useCreatePropertyMutation,
  useDeletePropertyMutation,
  useSubmitEnquiryMutation,
} from '../features/api/apiSlice.js';
import { selectRole, selectUser } from '../features/auth/authSlice.js';
import { useDebounce } from '../utils/useDebounce.js';
import { PageLoader, EmptyState, Pagination } from '../components/UI.jsx';
import Modal from '../components/Modal.jsx';
import { ROLES, formatINR, prettyEnum, PROPERTY_STATUSES } from '../utils/constants.js';
import { toast, apiErrorMessage } from '../utils/alert.js';
import { IconPlus, IconSearch, IconProperty, IconTrash } from '../components/Icons.jsx';

export const STATUS_PILL = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  BOOKED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-rose-100 text-rose-700',
  INACTIVE: 'bg-navy-100 text-navy-600',
};

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // keep in sync with multer limit
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function Properties() {
  const role = useSelector(selectRole);
  const isAdmin = role === ROLES.SUPER_ADMIN;
  const isCustomer = role === ROLES.USER;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const params = useMemo(() => ({ page, limit: 9, search: debounced || undefined }), [page, debounced]);
  const { data, isLoading } = useGetPropertiesQuery(params);

  const [createOpen, setCreateOpen] = useState(false);
  const [enquiry, setEnquiry] = useState(null);

  const properties = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or location…"
            className="input pl-9"
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-gold w-full justify-center whitespace-nowrap sm:w-auto"
          >
            <IconPlus className="h-4 w-4" /> Add property
          </button>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : properties.length === 0 ? (
        <EmptyState title="No properties found" subtitle="Try a different search." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard
                key={p._id}
                p={p}
                isAdmin={isAdmin}
                isCustomer={isCustomer}
                onEnquire={() => setEnquiry(p)}
              />
            ))}
          </div>
          <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
        </>
      )}

      {isAdmin && <CreatePropertyModal open={createOpen} onClose={() => setCreateOpen(false)} />}
      {enquiry && <EnquiryModal property={enquiry} onClose={() => setEnquiry(null)} />}
    </div>
  );
}

function PropertyCard({ p, isAdmin, isCustomer, onEnquire }) {
  const navigate = useNavigate();
  const [deleteProperty] = useDeletePropertyMutation();
  const images = p.images || [];
  const [active, setActive] = useState(0);
  const cover = images[active] || images[0];

  const goToDetail = () => navigate(`/properties/${p._id}`);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetail();
    }
  };

  const onDelete = async (e) => {
    e.stopPropagation();
    try {
      await deleteProperty(p._id).unwrap();
      toast.success('Property removed');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={onKeyDown}
      aria-label={`View details for ${p.title}`}
      className="card group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      {/* Banner: real image when available, gradient fallback otherwise */}
      <div className="relative h-44 overflow-hidden bg-navy-gradient sm:h-40">
        {cover ? (
          <img
            src={cover.url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #d4af37 0, transparent 45%)' }}
            />
            <IconProperty className="absolute right-4 top-4 h-10 w-10 text-white/20" />
          </>
        )}

        <span className={`absolute bottom-3 left-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[p.status]}`}>
          {prettyEnum(p.status)}
        </span>

        {/* Dots to flip through multiple photos — padded for reliable tapping */}
        {images.length > 1 && (
          <div className="absolute bottom-1.5 right-2 flex items-center">
            {images.map((img, i) => (
              <button
                key={img.key || i}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                aria-label={`Show image ${i + 1}`}
                className="flex h-7 w-5 items-center justify-center"
              >
                <span
                  className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-navy-900">{p.title}</h3>
          {isAdmin && (
            <button onClick={onDelete} className="shrink-0 p-1 text-navy-300 hover:text-rose-600" aria-label="Delete">
              <IconTrash className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-navy-500">{p.location}</p>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-navy-500">
          {p.bedrooms ? <span>{p.bedrooms} BHK</span> : null}
          {p.areaSqft ? <span>{p.areaSqft} sq.ft</span> : null}
          <span>{prettyEnum(p.propertyType)}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-xl font-bold text-gold-600">{formatINR(p.price)}</span>
          {isCustomer && p.status === 'AVAILABLE' && (
            <button
              onClick={(e) => { e.stopPropagation(); onEnquire(); }}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              Enquire
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePropertyModal({ open, onClose }) {
  const [createProperty, { isLoading }] = useCreatePropertyMutation();
  const empty = { title: '', location: '', city: '', price: '', propertyType: 'APARTMENT', bedrooms: '', areaSqft: '', status: 'AVAILABLE' };
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState([]); // [{ file, preview }]
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Revoke object URLs when files change or the modal unmounts (avoids memory leaks).
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.preview)), [files]);

  const reset = () => {
    setForm(empty);
    setFiles((curr) => { curr.forEach((f) => URL.revokeObjectURL(f.preview)); return []; });
  };

  const addFiles = (incoming) => {
    const valid = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported format`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: exceeds 5MB`);
        continue;
      }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }
    setFiles((curr) => {
      const next = [...curr, ...valid];
      if (next.length > MAX_IMAGES) {
        toast.error(`You can upload up to ${MAX_IMAGES} images`);
        next.slice(MAX_IMAGES).forEach((f) => URL.revokeObjectURL(f.preview));
      }
      return next.slice(0, MAX_IMAGES);
    });
  };

  const onPick = (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = ''; // allow re-selecting the same file
  };

  const removeFile = (idx) => {
    setFiles((curr) => {
      const target = curr[idx];
      if (target) URL.revokeObjectURL(target.preview);
      return curr.filter((_, i) => i !== idx);
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    // multipart/form-data: append text fields as strings, skip empty optionals,
    // and append each image under the "images" field the backend expects.
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('location', form.location);
    if (form.city) fd.append('city', form.city);
    fd.append('price', String(Number(form.price)));
    fd.append('propertyType', form.propertyType);
    fd.append('status', form.status);
    if (form.bedrooms) fd.append('bedrooms', String(Number(form.bedrooms)));
    if (form.areaSqft) fd.append('areaSqft', String(Number(form.areaSqft)));
    files.forEach(({ file }) => fd.append('images', file));

    try {
      await createProperty(fd).unwrap();
      toast.success('Property added');
      reset();
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add property" maxWidth="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Title *</label>
            <input name="title" required value={form.title} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Location *</label>
            <input name="location" required value={form.location} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" value={form.city} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Price (₹) *</label>
            <input name="price" type="number" inputMode="numeric" required value={form.price} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="propertyType" value={form.propertyType} onChange={onChange} className="input">
              {['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'OTHER'].map((t) => (
                <option key={t} value={t}>{prettyEnum(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bedrooms</label>
            <input name="bedrooms" type="number" inputMode="numeric" value={form.bedrooms} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Area (sq.ft)</label>
            <input name="areaSqft" type="number" inputMode="numeric" value={form.areaSqft} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" value={form.status} onChange={onChange} className="input">
              {PROPERTY_STATUSES.map((s) => <option key={s} value={s}>{prettyEnum(s)}</option>)}
            </select>
          </div>

          {/* Images */}
          <div className="sm:col-span-2">
            <label className="label">Images <span className="text-navy-400">(up to {MAX_IMAGES}, 5MB each)</span></label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-navy-200 px-4 py-6 text-center transition-colors hover:border-gold-400 hover:bg-navy-50">
              <IconPlus className="h-5 w-5 text-navy-400" />
              <span className="text-sm text-navy-500">Click to add photos</span>
              <input type="file" accept={ACCEPTED_TYPES.join(',')} multiple onChange={onPick} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4">
                {files.map((f, i) => (
                  <div key={f.preview} className="relative aspect-square overflow-hidden rounded-lg border border-navy-100">
                    <img src={f.preview} alt={`Selected ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 rounded-full bg-navy-900/70 p-1.5 text-white transition-colors hover:bg-rose-600"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold w-full justify-center sm:w-auto">
            {isLoading ? 'Adding…' : 'Add property'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function EnquiryModal({ property, onClose }) {
  const user = useSelector(selectUser);
  const [submitEnquiry, { isLoading }] = useSubmitEnquiryMutation();
  const [form, setForm] = useState({
    customerName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    budget: '',
    message: '',
  });
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await submitEnquiry({
        ...form,
        property: property._id,
        budget: form.budget ? Number(form.budget) : undefined,
        email: form.email || undefined,
      }).unwrap();
      toast.success('Enquiry submitted! Our team will contact you.');
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Enquire: ${property.title}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name *</label>
            <input name="customerName" required value={form.customerName} onChange={onChange} className="input" />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input name="phone" type="tel" inputMode="tel" required value={form.phone} onChange={onChange} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email</label>
            <input name="email" type="email" inputMode="email" value={form.email} onChange={onChange} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Message</label>
            <textarea name="message" rows="3" value={form.message} onChange={onChange} className="input" placeholder="I'm interested in this property…" />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost w-full justify-center sm:w-auto">Cancel</button>
          <button type="submit" disabled={isLoading} className="btn-gold w-full justify-center sm:w-auto">Submit enquiry</button>
        </div>
      </form>
    </Modal>
  );
}