import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './Icons.jsx';

/**
 * Accessible, responsive modal.
 *
 * Why a portal: the app shell wraps page content in a transformed element
 * (animate-fade-in). A CSS transform makes `position: fixed` resolve against
 * that ancestor instead of the viewport, which previously clipped / mis-placed
 * modals. Rendering into document.body via a portal guarantees the overlay is
 * always viewport-anchored and on top — correct on every device size.
 *
 * Layout: bottom-sheet on mobile, centered card on >= sm. The dialog is a flex
 * column with a sticky header and an independently scrollable body, so long
 * forms never push the header/close button off-screen.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Lock body scroll (compensating for the scrollbar to avoid layout shift),
  // remember/restore focus, and move focus into the dialog.
  useEffect(() => {
    if (!open) return;

    lastFocused.current = document.activeElement;
    const scrollBarComp = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollBarComp > 0) document.body.style.paddingRight = `${scrollBarComp}px`;

    // Focus the first focusable element (or the dialog itself).
    const focusFirst = () => {
      const node = dialogRef.current;
      if (!node) return;
      const focusable = node.querySelector(
        'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      (focusable || node).focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(focusFirst);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadRight;
      // Restore focus to whatever opened the modal.
      if (lastFocused.current && lastFocused.current.focus) {
        lastFocused.current.focus({ preventScroll: true });
      }
    };
  }, [open]);

  // Escape to close + simple focus trap on Tab.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, handleClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
      // Account for iOS safe areas on the bottom-sheet.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? handleClose : undefined}
        aria-hidden
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-soft outline-none animate-fade-in sm:max-h-[88vh] sm:rounded-2xl ${maxWidth}`}
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-navy-50 px-5 py-4">
          <h3 className="min-w-0 truncate font-display text-lg font-bold text-navy-900">{title}</h3>
          <button
            onClick={handleClose}
            className="-mr-1 shrink-0 rounded-lg p-1 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

        {/* Optional sticky footer */}
        {footer && (
          <div className="shrink-0 border-t border-navy-50 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
