// Razorpay Checkout helper.
//
// SECURITY NOTE: the publishable key_id is returned by OUR backend in the
// create-order response — it is never hard-coded here, and the key_secret never
// reaches the browser. Signature verification happens server-side.

const RZP_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

/** Load the Razorpay Checkout script once and cache the promise. */
export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RZP_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const s = document.createElement('script');
    s.src = RZP_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Razorpay Checkout. Check your connection.'));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
};

/**
 * Open Razorpay Checkout and resolve with the success payload
 * { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
 * Rejects if the user dismisses the modal or payment fails.
 *
 * @param {Object} opts
 * @param {string} opts.keyId      publishable key from the backend
 * @param {Object} opts.order      { id, amount, currency } from the backend
 * @param {Object} [opts.prefill]  { name, email, contact }
 * @param {string} [opts.name]     business / merchant name
 * @param {string} [opts.description]
 */
export const openCheckout = async ({ keyId, order, prefill = {}, name = 'Confident Property CRM', description = 'Booking payment' }) => {
  await loadRazorpay();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount: order.amount, // paise, from backend
      currency: order.currency,
      name,
      description,
      order_id: order.id,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      theme: { color: '#13233f' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
        escape: true,
        backdropclose: false,
      },
    });

    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp?.error?.description || 'Payment failed'));
    });

    rzp.open();
  });
};

export default openCheckout;
