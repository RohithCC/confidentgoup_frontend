// Mirror of the backend enums, plus UI labels/colors.

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STAFF: 'STAFF',
  AGENT: 'AGENT',
  USER: 'USER',
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  STAFF: 'Sales Staff',
  AGENT: 'Agent',
  USER: 'Customer',
};

// Full pipeline (matches backend LEAD_STATUS).
export const LEAD_STATUSES = [
  'NEW',
  'ASSIGNED',
  'CONTACTED',
  'FOLLOW_UP',
  'INTERESTED',
  'SITE_VISIT_SCHEDULED',
  'SITE_VISIT_COMPLETED',
  'NEGOTIATION',
  'BOOKING_PENDING',
  'WON',
  'LOST',
  'HOLD',
];

export const STATUS_LABELS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  CONTACTED: 'Contacted',
  FOLLOW_UP: 'Follow-up',
  INTERESTED: 'Interested',
  SITE_VISIT_SCHEDULED: 'Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Visit Done',
  NEGOTIATION: 'Negotiation',
  BOOKING_PENDING: 'Booking Pending',
  WON: 'Won',
  LOST: 'Lost',
  HOLD: 'Hold',
};

// Tailwind class sets per status (badge styling).
export const STATUS_STYLES = {
  NEW: 'bg-sky-100 text-sky-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-700',
  INTERESTED: 'bg-teal-100 text-teal-700',
  SITE_VISIT_SCHEDULED: 'bg-violet-100 text-violet-700',
  SITE_VISIT_COMPLETED: 'bg-purple-100 text-purple-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  BOOKING_PENDING: 'bg-cyan-100 text-cyan-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-rose-100 text-rose-700',
  HOLD: 'bg-navy-100 text-navy-600',
};

// Allowed forward transitions (matches backend LEAD_TRANSITIONS exactly).
export const LEAD_TRANSITIONS = {
  NEW: ['ASSIGNED', 'CONTACTED', 'LOST'],
  ASSIGNED: ['CONTACTED', 'FOLLOW_UP', 'LOST', 'HOLD'],
  CONTACTED: ['FOLLOW_UP', 'INTERESTED', 'SITE_VISIT_SCHEDULED', 'LOST', 'HOLD'],
  FOLLOW_UP: ['CONTACTED', 'INTERESTED', 'SITE_VISIT_SCHEDULED', 'LOST', 'HOLD'],
  INTERESTED: ['SITE_VISIT_SCHEDULED', 'NEGOTIATION', 'LOST', 'HOLD'],
  SITE_VISIT_SCHEDULED: ['SITE_VISIT_COMPLETED', 'FOLLOW_UP', 'LOST', 'HOLD'],
  SITE_VISIT_COMPLETED: ['NEGOTIATION', 'INTERESTED', 'LOST', 'HOLD'],
  NEGOTIATION: ['BOOKING_PENDING', 'WON', 'LOST', 'HOLD'],
  BOOKING_PENDING: ['WON', 'LOST', 'HOLD'],
  HOLD: ['CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'NEGOTIATION', 'BOOKING_PENDING', 'LOST'],
  WON: [],
  LOST: [],
};

export const LEAD_SOURCES = [
  'WEBSITE',
  'PHONE',
  'WALK_IN',
  'FACEBOOK',
  'GOOGLE_ADS',
  'REFERRAL',
  'MAGICBRICKS',
  '99ACRES',
  'OTHER',
];

export const LOST_REASONS = [
  'WRONG_NUMBER',
  'DUPLICATE_LEAD',
  'NO_RESPONSE',
  'BUDGET_ISSUE',
  'LOCATION_NOT_PREFERRED',
  'COMPETITOR_PROPERTY',
  'PROJECT_CANCELLED',
  'NOT_INTERESTED',
  'LOAN_REJECTED',
  'DEAL_CANCELLED',
  'WRONG_LEAD',
  'OTHER',
];

export const PROPERTY_STATUSES = ['AVAILABLE', 'BOOKED', 'SOLD', 'INACTIVE'];

export const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'PLOT', 'COMMERCIAL', 'OTHER'];

// Requirement-analysis enums (mirror backend).
export const PURPOSE_VALUES = ['INVESTMENT', 'SELF_USE', 'UNDECIDED'];
export const POSSESSION_VALUES = [
  'IMMEDIATE',
  'WITHIN_3_MONTHS',
  'WITHIN_6_MONTHS',
  'WITHIN_1_YEAR',
  'FLEXIBLE',
];

// Payment enums (mirror backend).
export const PAYMENT_TYPES = ['TOKEN', 'BOOKING', 'INSTALLMENT', 'FULL'];
export const PAYMENT_STATUSES = ['CREATED', 'ATTEMPTED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

export const PAYMENT_STATUS_STYLES = {
  CREATED: 'bg-sky-100 text-sky-700',
  ATTEMPTED: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
  REFUNDED: 'bg-navy-100 text-navy-600',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-700',
};

// Document enums (mirror backend).
export const DOCUMENT_TYPES = ['AADHAAR', 'PAN', 'ADDRESS_PROOF', 'AGREEMENT', 'PHOTO', 'OTHER'];
export const DOCUMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

export const DOCUMENT_STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

// Format rupees into a compact Indian-currency string.
export const formatINR = (n) => {
  if (n == null) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

export const prettyEnum = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
