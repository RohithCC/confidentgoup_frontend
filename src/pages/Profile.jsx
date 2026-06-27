import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setUser } from '../features/auth/authSlice.js';
import { useUpdateProfileMutation } from '../features/api/apiSlice.js';
import { toast, apiErrorMessage } from '../utils/alert.js';
import { prettyEnum } from '../utils/constants.js';
import { Spinner } from '../components/UI.jsx';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'plot', 'commercial', 'office', 'pg'];

// Map a user object -> a fully-controlled form shape (no undefined values).
const toForm = (u = {}) => ({
  name: u.name || '',
  phone: u.phone || '',
  avatar: u.avatar || '',
  bio: u.bio || '',
  dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0, 10) : '',
  gender: u.gender || '',
  occupation: u.occupation || '',
  company: u.company || '',
  address: {
    line1: u.address?.line1 || '',
    line2: u.address?.line2 || '',
    city: u.address?.city || '',
    state: u.address?.state || '',
    country: u.address?.country || '',
    zipCode: u.address?.zipCode || '',
  },
  socialLinks: {
    website: u.socialLinks?.website || '',
    facebook: u.socialLinks?.facebook || '',
    twitter: u.socialLinks?.twitter || '',
    instagram: u.socialLinks?.instagram || '',
    linkedin: u.socialLinks?.linkedin || '',
  },
  searchPreferences: {
    listingType: u.searchPreferences?.listingType || 'any',
    propertyTypes: u.searchPreferences?.propertyTypes || [],
    budgetMin: u.searchPreferences?.budgetMin ?? '',
    budgetMax: u.searchPreferences?.budgetMax ?? '',
    minBedrooms: u.searchPreferences?.minBedrooms ?? '',
    furnishing: u.searchPreferences?.furnishing || 'any',
  },
  notificationPreferences: {
    emailAlerts: u.notificationPreferences?.emailAlerts ?? true,
    smsAlerts: u.notificationPreferences?.smsAlerts ?? false,
    pushAlerts: u.notificationPreferences?.pushAlerts ?? true,
    priceDropAlerts: u.notificationPreferences?.priceDropAlerts ?? true,
    newListingAlerts: u.notificationPreferences?.newListingAlerts ?? true,
    newsletter: u.notificationPreferences?.newsletter ?? false,
  },
  preferences: {
    language: u.preferences?.language || 'en',
    currency: u.preferences?.currency || 'INR',
    measurementUnit: u.preferences?.measurementUnit || 'sqft',
  },
});

export default function Profile() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  // Seed from the user we already have in Redux (login returns it).
  const [form, setForm] = useState(() => toForm(user));
  const [locationsText, setLocationsText] = useState(
    (user?.searchPreferences?.preferredLocations || []).join(', ')
  );

  const setTop = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (sec, k, v) =>
    setForm((f) => ({ ...f, [sec]: { ...f[sec], [k]: v } }));

  const togglePropertyType = (t) =>
    setForm((f) => {
      const list = f.searchPreferences.propertyTypes;
      const next = list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
      return { ...f, searchPreferences: { ...f.searchPreferences, propertyTypes: next } };
    });

  const initials =
    user?.name?.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const submit = async (e) => {
    e.preventDefault();
    const sp = form.searchPreferences;
    const num = (v) => (v === '' || v === null ? undefined : Number(v));

    const payload = {
      ...form,
      dateOfBirth: form.dateOfBirth || null,
      searchPreferences: {
        ...sp,
        budgetMin: num(sp.budgetMin),
        budgetMax: num(sp.budgetMax),
        minBedrooms: num(sp.minBedrooms),
        preferredLocations: locationsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };

    try {
      const res = await updateProfile(payload).unwrap();
      const updated = res.user || res; // tolerate { user } or raw user
      dispatch(setUser(updated));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 pb-24">
      {/* ---------- Header ---------- */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {form.avatar ? (
            <img
              src={form.avatar}
              alt={form.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-xl font-bold text-navy-900">
              {initials}
            </span>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-navy-900">{form.name || 'Your profile'}</h1>
            <p className="text-sm text-navy-500">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-600">
              {prettyEnum(user?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Personal information ---------- */}
      <Section title="Personal information" subtitle="Basic details shown on your profile.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className="input" value={form.name} onChange={(e) => setTop('name', e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(e) => setTop('phone', e.target.value)} />
          </Field>
          <Field label="Date of birth">
            <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => setTop('dateOfBirth', e.target.value)} />
          </Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={(e) => setTop('gender', e.target.value)}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Occupation">
            <input className="input" value={form.occupation} onChange={(e) => setTop('occupation', e.target.value)} />
          </Field>
          <Field label="Company">
            <input className="input" value={form.company} onChange={(e) => setTop('company', e.target.value)} />
          </Field>
          <Field label="Avatar URL" full>
            <input className="input" value={form.avatar} onChange={(e) => setTop('avatar', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Bio" full>
            <textarea
              rows={3}
              maxLength={500}
              className="input resize-none"
              value={form.bio}
              onChange={(e) => setTop('bio', e.target.value)}
              placeholder="A short introduction (max 500 characters)."
            />
          </Field>
        </div>
      </Section>

      {/* ---------- Address ---------- */}
      <Section title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1" full>
            <input className="input" value={form.address.line1} onChange={(e) => setNested('address', 'line1', e.target.value)} />
          </Field>
          <Field label="Address line 2" full>
            <input className="input" value={form.address.line2} onChange={(e) => setNested('address', 'line2', e.target.value)} />
          </Field>
          <Field label="City">
            <input className="input" value={form.address.city} onChange={(e) => setNested('address', 'city', e.target.value)} />
          </Field>
          <Field label="State">
            <input className="input" value={form.address.state} onChange={(e) => setNested('address', 'state', e.target.value)} />
          </Field>
          <Field label="ZIP / Postal code">
            <input className="input" value={form.address.zipCode} onChange={(e) => setNested('address', 'zipCode', e.target.value)} />
          </Field>
          <Field label="Country">
            <input className="input" value={form.address.country} onChange={(e) => setNested('address', 'country', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ---------- Property search preferences ---------- */}
      <Section title="Property search preferences" subtitle="We use these to personalise results and alerts.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Looking to">
            <select className="input" value={form.searchPreferences.listingType} onChange={(e) => setNested('searchPreferences', 'listingType', e.target.value)}>
              <option value="any">Buy or rent</option>
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </Field>
          <Field label="Furnishing">
            <select className="input" value={form.searchPreferences.furnishing} onChange={(e) => setNested('searchPreferences', 'furnishing', e.target.value)}>
              <option value="any">Any</option>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </Field>
          <Field label="Min budget (₹)">
            <input type="number" min="0" className="input" value={form.searchPreferences.budgetMin} onChange={(e) => setNested('searchPreferences', 'budgetMin', e.target.value)} />
          </Field>
          <Field label="Max budget (₹)">
            <input type="number" min="0" className="input" value={form.searchPreferences.budgetMax} onChange={(e) => setNested('searchPreferences', 'budgetMax', e.target.value)} />
          </Field>
          <Field label="Min bedrooms">
            <input type="number" min="0" className="input" value={form.searchPreferences.minBedrooms} onChange={(e) => setNested('searchPreferences', 'minBedrooms', e.target.value)} />
          </Field>
          <Field label="Preferred locations" full>
            <input
              className="input"
              value={locationsText}
              onChange={(e) => setLocationsText(e.target.value)}
              placeholder="Whitefield, HSR Layout, Indiranagar"
            />
            <p className="mt-1 text-xs text-navy-400">Separate multiple areas with commas.</p>
          </Field>
          <Field label="Property types" full>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((t) => {
                const active = form.searchPreferences.propertyTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => togglePropertyType(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                      active
                        ? 'border-gold-400 bg-gold-50 text-gold-700'
                        : 'border-navy-100 bg-white text-navy-600 hover:border-gold-300'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </Section>

      {/* ---------- Social links ---------- */}
      <Section title="Social links">
        <div className="grid gap-4 sm:grid-cols-2">
          {['website', 'linkedin', 'facebook', 'twitter', 'instagram'].map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <input className="input" value={form.socialLinks[k]} onChange={(e) => setNested('socialLinks', k, e.target.value)} placeholder="https://…" />
            </Field>
          ))}
        </div>
      </Section>

      {/* ---------- Notifications ---------- */}
      <Section title="Notifications" subtitle="Choose how we keep you updated.">
        <div className="divide-y divide-navy-50">
          <Toggle label="Email alerts" checked={form.notificationPreferences.emailAlerts} onChange={(v) => setNested('notificationPreferences', 'emailAlerts', v)} />
          <Toggle label="SMS alerts" checked={form.notificationPreferences.smsAlerts} onChange={(v) => setNested('notificationPreferences', 'smsAlerts', v)} />
          <Toggle label="Push alerts" checked={form.notificationPreferences.pushAlerts} onChange={(v) => setNested('notificationPreferences', 'pushAlerts', v)} />
          <Toggle label="Price drop alerts" hint="When a saved property drops in price." checked={form.notificationPreferences.priceDropAlerts} onChange={(v) => setNested('notificationPreferences', 'priceDropAlerts', v)} />
          <Toggle label="New listing alerts" hint="New properties matching your preferences." checked={form.notificationPreferences.newListingAlerts} onChange={(v) => setNested('notificationPreferences', 'newListingAlerts', v)} />
          <Toggle label="Newsletter" checked={form.notificationPreferences.newsletter} onChange={(v) => setNested('notificationPreferences', 'newsletter', v)} />
        </div>
      </Section>

      {/* ---------- Sticky save bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 py-3">
          <button type="submit" disabled={isLoading} className="btn-primary min-w-[140px]">
            {isLoading ? <Spinner className="h-5 w-5 text-white" /> : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---------- small presentational helpers ---------- */
function Section({ title, subtitle, children }) {
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-navy-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-navy-800">{label}</p>
        {hint && <p className="text-xs text-navy-400">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-gold-500' : 'bg-navy-200'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}