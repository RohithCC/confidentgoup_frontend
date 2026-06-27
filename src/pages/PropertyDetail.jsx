import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetPropertyQuery,
  useDeletePropertyMutation,
} from '../features/api/apiSlice.js';
import { selectRole } from '../features/auth/authSlice.js';
import { PageLoader, EmptyState } from '../components/UI.jsx';
import { ROLES, formatINR, prettyEnum } from '../utils/constants.js';
import { toast, apiErrorMessage } from '../utils/alert.js';
import { IconProperty, IconTrash } from '../components/Icons.jsx';
import { STATUS_PILL, EnquiryModal } from './Properties.jsx';
import EditPropertyModal from '../features/property/EditPropertyModal.jsx';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(selectRole);
  const isAdmin = role === ROLES.SUPER_ADMIN;
  const isCustomer = role === ROLES.USER;

  const { data: property, isLoading, isError } = useGetPropertyQuery(id);
  const [deleteProperty, { isLoading: deleting }] = useDeletePropertyMutation();
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <PageLoader />;
  if (isError || !property) {
    return (
      <div className="space-y-4">
        <BackLink onClick={() => navigate('/properties')} />
        <EmptyState title="Property not found" subtitle="It may have been removed or the link is incorrect." />
      </div>
    );
  }

  const images = property.images || [];

  const onDelete = async () => {
    try {
      await deleteProperty(property._id).unwrap();
      toast.success('Property removed');
      navigate('/properties');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const specs = [
    property.bedrooms ? { label: 'Bedrooms', value: `${property.bedrooms} BHK` } : null,
    property.areaSqft ? { label: 'Area', value: `${property.areaSqft} sq.ft` } : null,
    { label: 'Type', value: prettyEnum(property.propertyType) },
    property.city ? { label: 'City', value: property.city } : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <BackLink onClick={() => navigate('/properties')} />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditOpen(true)} className="btn-ghost">
              Edit
            </button>
            <button onClick={onDelete} disabled={deleting} className="btn-ghost text-rose-600 hover:bg-rose-50">
              <IconTrash className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <Gallery images={images} title={property.title} status={property.status} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">{property.title}</h1>
            <p className="mt-1 text-navy-500">{property.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map((s) => (
              <div key={s.label} className="rounded-xl border border-navy-100 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-navy-400">{s.label}</p>
                <p className="mt-1 font-semibold text-navy-900">{s.value}</p>
              </div>
            ))}
          </div>

          {property.description && (
            <div>
              <h2 className="font-display text-lg font-semibold text-navy-900">About this property</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-navy-600">{property.description}</p>
            </div>
          )}

          {property.createdBy?.name && (
            <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-4">
              <p className="text-xs uppercase tracking-wide text-navy-400">Listed by</p>
              <p className="mt-1 font-semibold text-navy-900">{property.createdBy.name}</p>
              {property.createdBy.email && (
                <p className="text-sm text-navy-500">{property.createdBy.email}</p>
              )}
            </div>
          )}
        </div>

        {/* Sticky price / action card */}
        <aside className="lg:col-span-1">
          <div className="card p-6 lg:sticky lg:top-6">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[property.status]}`}>
              {prettyEnum(property.status)}
            </span>
            <p className="mt-3 font-display text-3xl font-bold text-gold-600">{formatINR(property.price)}</p>
            <p className="mt-1 text-sm text-navy-400">{property.location}</p>

            {isCustomer && property.status === 'AVAILABLE' ? (
              <button onClick={() => setEnquireOpen(true)} className="btn-gold mt-5 w-full justify-center">
                Enquire now
              </button>
            ) : isCustomer ? (
              <p className="mt-5 rounded-lg bg-navy-50 px-3 py-2 text-center text-sm text-navy-500">
                This property is currently {prettyEnum(property.status).toLowerCase()}.
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {enquireOpen && <EnquiryModal property={property} onClose={() => setEnquireOpen(false)} />}
      {editOpen && <EditPropertyModal property={property} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function BackLink({ onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-sm font-medium text-navy-500 hover:text-navy-900">
      <span aria-hidden>←</span> Back to properties
    </button>
  );
}

function Gallery({ images, title, status }) {
  const [active, setActive] = useState(0);
  const hasImages = images.length > 0;
  const main = images[active];

  const step = (dir) => setActive((i) => (i + dir + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="relative h-60 overflow-hidden rounded-2xl bg-navy-gradient sm:h-80 lg:h-[420px]">
        {hasImages ? (
          <img src={main.url} alt={title} className="h-full w-full object-cover" />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #d4af37 0, transparent 45%)' }}
            />
            <IconProperty className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white/20" />
          </>
        )}

        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[status]}`}>
          {prettyEnum(status)}
        </span>

        {/* Prev / next arrows for multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-navy-900/50 p-2 text-white backdrop-blur transition-colors hover:bg-navy-900/70"
            >
              <span aria-hidden>‹</span>
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-navy-900/50 p-2 text-white backdrop-blur transition-colors hover:bg-navy-900/70"
            >
              <span aria-hidden>›</span>
            </button>
            <span className="absolute bottom-3 right-4 rounded-full bg-navy-900/60 px-2 py-0.5 text-xs text-white">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.key || i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active ? 'border-gold-500' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}