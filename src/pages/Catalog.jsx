import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPublicPropertiesQuery } from '../features/api/apiSlice.js';
import { useDebounce } from '../utils/useDebounce.js';
import { PageLoader, EmptyState, Pagination } from '../components/UI.jsx';
import { formatINR, prettyEnum, PROPERTY_STATUSES } from '../utils/constants.js';
import { IconSearch, IconProperty } from '../components/Icons.jsx';
import PublicNav from './PublicNav.jsx';
import { EnquiryModal } from './Properties.jsx';

const STATUS_PILL = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  BOOKED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-rose-100 text-rose-700',
  INACTIVE: 'bg-navy-100 text-navy-600',
};

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'OTHER'];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-areaSqft', label: 'Largest area' },
];

const EMPTY_FILTERS = {
  search: '',
  status: '',
  propertyType: '',
  city: '',
  minBedrooms: '',
  minPrice: '',
  maxPrice: '',
  sort: '-createdAt',
};

export default function Catalog() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false); // mobile panel
  const [enquireProp, setEnquireProp] = useState(null);

  const debouncedSearch = useDebounce(filters.search);
  const debouncedCity = useDebounce(filters.city);
  const debouncedMin = useDebounce(filters.minPrice);
  const debouncedMax = useDebounce(filters.maxPrice);

  // Build query params, omitting empty values so they're not sent.
  const params = useMemo(() => {
    const p = { page, limit: 12, sort: filters.sort };
    if (debouncedSearch) p.search = debouncedSearch;
    if (filters.status) p.status = filters.status;
    if (filters.propertyType) p.propertyType = filters.propertyType;
    if (debouncedCity) p.city = debouncedCity;
    if (filters.minBedrooms) p.minBedrooms = filters.minBedrooms;
    if (debouncedMin) p.minPrice = debouncedMin;
    if (debouncedMax) p.maxPrice = debouncedMax;
    return p;
  }, [page, filters.sort, filters.status, filters.propertyType, filters.minBedrooms,
      debouncedSearch, debouncedCity, debouncedMin, debouncedMax]);

  const { data, isLoading, isFetching } = useGetPublicPropertiesQuery(params);
  const properties = data?.data || [];
  const pagination = data?.pagination;

  const setFilter = (name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };

  const activeCount = useMemo(
    () => ['search', 'status', 'propertyType', 'city', 'minBedrooms', 'minPrice', 'maxPrice']
      .filter((k) => filters[k]).length,
    [filters]
  );

  const clearAll = () => { setFilters(EMPTY_FILTERS); setPage(1); };

  const total = pagination?.total;

  return (
    <div className="min-h-screen bg-navy-50/40">
      <PublicNav />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Results header — 99acres style */}
        <div className="mb-4">
          <h1 className="font-display text-xl font-bold text-navy-900 sm:text-2xl">
            {total != null ? <>{total.toLocaleString('en-IN')} results</> : 'Properties'}
            <span className="font-normal text-navy-400"> | Properties for sale</span>
          </h1>
        </div>

        {/* Quick status chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {[{ value: '', label: 'All' }, ...PROPERTY_STATUSES.map((s) => ({ value: s, label: prettyEnum(s) }))].map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setFilter('status', c.value)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                filters.status === c.value
                  ? 'border-gold-500 bg-gold-50 text-gold-700'
                  : 'border-navy-200 bg-white text-navy-600 hover:border-navy-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="btn-ghost mb-4 w-full justify-center bg-white lg:hidden"
        >
          {showFilters ? 'Hide filters' : 'Show filters'}
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-gold-500 px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* ---------- Filters sidebar ---------- */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:col-span-1 lg:block`}>
            <div className="rounded-2xl border border-navy-100 bg-white p-5 lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-navy-900">Filters</h2>
                {activeCount > 0 && (
                  <button onClick={clearAll} className="text-xs font-medium text-gold-600 hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">Search</label>
                  <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
                    <input
                      value={filters.search}
                      onChange={(e) => setFilter('search', e.target.value)}
                      placeholder="Name or location"
                      className="input pl-9"
                    />
                  </div>
                </div>

                <Divider label="Budget (₹)" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.minPrice}
                    onChange={(e) => setFilter('minPrice', e.target.value)}
                    placeholder="Min"
                    className="input"
                  />
                  <span className="text-navy-300">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={filters.maxPrice}
                    onChange={(e) => setFilter('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="input"
                  />
                </div>

                <Divider label="Type of property" />
                <select value={filters.propertyType} onChange={(e) => setFilter('propertyType', e.target.value)} className="input">
                  <option value="">Any type</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{prettyEnum(t)}</option>)}
                </select>

                <Divider label="Bedrooms" />
                <select value={filters.minBedrooms} onChange={(e) => setFilter('minBedrooms', e.target.value)} className="input">
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ BHK</option>)}
                </select>

                <Divider label="City" />
                <input
                  value={filters.city}
                  onChange={(e) => setFilter('city', e.target.value)}
                  placeholder="e.g. Bangalore"
                  className="input"
                />
              </div>
            </div>
          </aside>

          {/* ---------- Results ---------- */}
          <section className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm text-navy-500">
                {isFetching ? 'Updating…' : total != null ? `Showing ${properties.length} of ${total}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <label className="hidden text-sm text-navy-500 sm:block">Sort by</label>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  className="input w-auto bg-white"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <PageLoader />
            ) : properties.length === 0 ? (
              <EmptyState
                title="No properties match your filters"
                subtitle={activeCount > 0 ? 'Try widening or clearing some filters.' : 'Check back soon.'}
              />
            ) : (
              <>
                <div className="space-y-4">
                  {properties.map((p) => (
                    <ListingCard key={p._id} p={p} onContact={() => setEnquireProp(p)} />
                  ))}
                </div>
                <Pagination page={pagination?.page} pages={pagination?.pages} onChange={setPage} />
              </>
            )}
          </section>
        </div>
      </div>

      {enquireProp && <EnquiryModal property={enquireProp} onClose={() => setEnquireProp(null)} />}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="pt-1">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <span className="block h-px w-full bg-navy-100" />
    </div>
  );
}

function ListingCard({ p, onContact }) {
  const navigate = useNavigate();
  const images = p.images || [];
  const cover = images[0];
  const perSqft = p.price && p.areaSqft ? Math.round(p.price / p.areaSqft) : null;

  const go = () => navigate(`/properties/${p._id}`);

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white transition-shadow hover:shadow-md sm:flex">
      {/* Image */}
      <button
        onClick={go}
        aria-label={`View ${p.title}`}
        className="group relative block h-48 w-full shrink-0 overflow-hidden bg-navy-gradient sm:h-auto sm:w-64"
      >
        {cover ? (
          <img
            src={cover.url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #d4af37 0, transparent 45%)' }} />
            <IconProperty className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/20" />
          </>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[p.status]}`}>
          {prettyEnum(p.status)}
        </span>
        {images.length > 1 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-navy-900/60 px-2 py-0.5 text-xs text-white">
            {images.length} photos
          </span>
        )}
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <button onClick={go} className="text-left">
          <h3 className="truncate font-display text-lg font-semibold text-navy-900 hover:text-gold-700">{p.title}</h3>
          <p className="mt-0.5 text-sm text-navy-500">
            {p.bedrooms ? `${p.bedrooms} BHK ` : ''}{prettyEnum(p.propertyType)}
            {p.city ? ` in ${p.city}` : ''}
          </p>
          <p className="mt-0.5 truncate text-sm text-navy-400">{p.location}</p>
        </button>

        {/* Price + area row */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div>
            <span className="font-display text-xl font-bold text-gold-600">{formatINR(p.price)}</span>
            {perSqft && <span className="ml-1 text-xs text-navy-400">₹{perSqft.toLocaleString('en-IN')}/sq.ft</span>}
          </div>
          {p.areaSqft && (
            <div className="text-sm">
              <span className="font-semibold text-navy-900">{p.areaSqft.toLocaleString('en-IN')} sq.ft</span>
              <span className="ml-1 text-navy-400">Built-up</span>
            </div>
          )}
        </div>

        {/* Actions — pinned bottom-right on desktop, full-width stack on mobile */}
        <div className="mt-4 flex flex-col gap-2 sm:mt-auto sm:flex-row sm:justify-end">
          <button onClick={go} className="btn-ghost w-full justify-center sm:w-auto">View details</button>
          <button onClick={onContact} className="btn-gold w-full justify-center sm:w-auto">Contact</button>
        </div>
      </div>
    </div>
  );
}