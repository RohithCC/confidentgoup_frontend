import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetPublicPropertiesQuery } from '../features/api/apiSlice.js';
import { useDebounce } from '../utils/useDebounce.js';
import { PageLoader, EmptyState, Pagination, Logo } from '../components/UI.jsx';
import { formatINR, prettyEnum } from '../utils/constants.js';
import { IconProperty } from '../components/Icons.jsx';
import PublicNav from './PublicNav.jsx';

const STATUS_PILL = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  BOOKED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-rose-100 text-rose-700',
  INACTIVE: 'bg-navy-100 text-navy-600',
};

export default function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: 9, search: debounced || undefined }),
    [page, debounced]
  );
  const { data, isLoading } = useGetPublicPropertiesQuery(params);

  const properties = data?.data || [];
  const pagination = data?.pagination;

  const onSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="min-h-screen bg-white">
      <PublicNav search={search} onSearch={onSearch} />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-navy-gradient">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-navy-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
            Confident Group
          </p>
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Find your next <span className="text-gold-400">confident</span> address.
          </h1>
          <p className="mt-4 max-w-xl text-navy-100/70">
            Browse RERA-approved apartments, villas and plots across the city —
            then enquire in a tap. No account needed to look around.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/catalog" className="btn-gold">Browse all properties</Link>
          </div>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-4 text-white">
            {[
              ['20+', 'Years of trust'],
              ['2766+', 'Homes delivered'],
              ['54', 'RERA projects'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-gold-400">{n}</div>
                <div className="text-xs text-navy-100/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Listings ---------- */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-navy-900">Featured properties</h2>
            {pagination?.total != null && (
              <p className="mt-0.5 text-sm text-navy-500">{pagination.total} listings</p>
            )}
          </div>
          <Link to="/catalog" className="shrink-0 text-sm font-medium text-gold-600 hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : properties.length === 0 ? (
          <EmptyState title="No properties found" subtitle="Try a different search." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {properties.map((p) => (
                <PublicPropertyCard key={p._id} p={p} />
              ))}
            </div>
            <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
          </>
        )}
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-navy-100 bg-navy-50/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-navy-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} Confident Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function PublicPropertyCard({ p }) {
  const navigate = useNavigate();
  const images = p.images || [];
  const cover = images[0];

  const goToDetail = () => navigate(`/properties/${p._id}`);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDetail(); }
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
        {images.length > 1 && (
          <span className="absolute bottom-3 right-4 rounded-full bg-navy-900/60 px-2 py-0.5 text-xs text-white">
            {images.length} photos
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="truncate font-display text-lg font-semibold text-navy-900">{p.title}</h3>
        <p className="mt-1 truncate text-sm text-navy-500">{p.location}</p>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-navy-500">
          {p.bedrooms ? <span>{p.bedrooms} BHK</span> : null}
          {p.areaSqft ? <span>{p.areaSqft} sq.ft</span> : null}
          <span>{prettyEnum(p.propertyType)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-gold-600">{formatINR(p.price)}</span>
          <span className="text-xs font-medium text-gold-600 group-hover:underline">View details →</span>
        </div>
      </div>
    </div>
  );
}