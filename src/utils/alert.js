import Swal from 'sweetalert2';

// Brand-themed SweetAlert instance (navy + gold).
const base = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: 'rounded-2xl',
    title: '!text-navy-900 !font-display',
    htmlContainer: '!text-navy-600',
    confirmButton: 'btn-gold !px-6 !mx-1',
    cancelButton: 'btn-ghost !px-6 !mx-1',
    denyButton: 'btn !bg-rose-600 !text-white !px-6 !mx-1',
  },
});

// Lightweight toast (top-right) for success/info/error.
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer);
    el.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const toast = {
  success: (title) => Toast.fire({ icon: 'success', title }),
  error: (title) => Toast.fire({ icon: 'error', title }),
  info: (title) => Toast.fire({ icon: 'info', title }),
  warn: (title) => Toast.fire({ icon: 'warning', title }),
};

export const alertSuccess = (title, text) =>
  base.fire({ icon: 'success', title, text });

export const alertError = (title, text) =>
  base.fire({ icon: 'error', title: title || 'Something went wrong', text });

// Confirm dialog → resolves to boolean.
export const confirmAction = async ({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Yes, continue',
  cancelText = 'Cancel',
  icon = 'warning',
} = {}) => {
  const res = await base.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return res.isConfirmed;
};

// Text prompt → resolves to the entered string, or null if cancelled.
export const promptText = async ({
  title = 'Enter a value',
  label = '',
  placeholder = '',
  confirmText = 'Submit',
  danger = false,
} = {}) => {
  const res = await base.fire({
    title,
    input: 'text',
    inputLabel: label,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: confirmText,
    reverseButtons: true,
    customClass: danger
      ? { confirmButton: 'btn !bg-rose-600 !text-white !px-6 !mx-1', cancelButton: 'btn-ghost !px-6 !mx-1' }
      : undefined,
  });
  return res.isConfirmed ? res.value || '' : null;
};

// Extracts a human-readable message from an RTK Query error object.
export const apiErrorMessage = (err) =>
  err?.data?.message ||
  err?.data?.details?.[0]?.message ||
  err?.error ||
  'Request failed. Please try again.';
