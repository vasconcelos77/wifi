import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Clock, Gift, X } from 'lucide-react';
import { comercial, formatBRL, getPopupUpgradeDiffCents } from '../comercial.js';
import { content } from '../content.js';

export const UPSELL_DURATION_SECONDS = 180;

export function createUpsellExpiresAt(now = Date.now()) {
  return now + UPSELL_DURATION_SECONDS * 1000;
}

export function stepUpsellCountdown(expiresAt, now = Date.now()) {
  const diffMs = expiresAt - now;
  if (diffMs <= 0) {
    return {
      remainingSeconds: UPSELL_DURATION_SECONDS,
      expiresAt: createUpsellExpiresAt(now),
    };
  }
  return {
    remainingSeconds: Math.min(UPSELL_DURATION_SECONDS, Math.ceil(diffMs / 1000)),
    expiresAt,
  };
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export default function UpsellModal({ open, onClose, returnFocusRef }) {
  const titleId = useId();
  const accordionId = useId();
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  const premiumBtnRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const returnFocusRefCurrent = useRef(returnFocusRef);

  onCloseRef.current = onClose;
  returnFocusRefCurrent.current = returnFocusRef;

  const [bonusesOpen, setBonusesOpen] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(UPSELL_DURATION_SECONDS);

  const popupPrice = formatBRL(comercial.popupPremium.priceCents);
  const basicPrice = formatBRL(comercial.basic.priceCents);
  const diffPrice = formatBRL(getPopupUpgradeDiffCents());
  const popupCheckoutUrl = comercial.popupPremium.checkoutUrl;
  const basicCheckoutUrl = comercial.basic.checkoutUrl;

  useEffect(() => {
    if (!open) {
      setBonusesOpen(false);
      setBtnVisible(false);
      setRemainingSeconds(UPSELL_DURATION_SECONDS);
      return undefined;
    }

    let expiresAt = createUpsellExpiresAt();
    setRemainingSeconds(UPSELL_DURATION_SECONDS);

    const syncRemaining = () => {
      const next = stepUpsellCountdown(expiresAt);
      expiresAt = next.expiresAt;
      setRemainingSeconds(next.remainingSeconds);
    };

    const timer = window.setInterval(syncRemaining, 250);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncRemaining();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Button is immediately visible when modal opens
    setBtnVisible(true);

    const focusFrame = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key === 'Tab') {
        const modal = modalRef.current;
        const focusables = getFocusableElements(modal);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        returnFocusRefCurrent.current?.current?.focus();
      });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const btnEl = premiumBtnRef.current;
    const modalEl = modalRef.current;
    if (!btnEl || !modalEl) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setBtnVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setBtnVisible(entry.isIntersecting),
      { root: modalEl, threshold: 0.15 }
    );
    observer.observe(btnEl);
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  const timeFormatted = `${minutes}:${seconds}`;

  const premiumBtnClass = `btn btn--premium${btnVisible ? ' btn--pulse' : ''}`;

  return (
    <div
      ref={overlayRef}
      className="upsell-overlay"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="upsell-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="upsell-timer-banner">
          <Clock size={15} aria-hidden="true" />
          <span>
            OFERTA EXPIRA EM: <strong className="upsell-timer-digits">{timeFormatted}</strong>
          </span>
        </div>

        <button
          ref={closeBtnRef}
          type="button"
          className="upsell-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="upsell-header">
          <h2 id={titleId} className="upsell-title">
            <span className="upsell-title-kicker">ESPERE!</span>
            <span className="upsell-title-main">LEVE OS 4 BÔNUS TAMBÉM</span>
          </h2>

          <p className="upsell-support">
            Por mais {diffPrice.replace(/\s+/g, '')} que o Básico, você recebe o Premium com quatro bônus, suporte 24 horas e atualização mensal.
          </p>
        </div>

        <div className="upsell-price-card">
          <p className="upsell-plan-label">PLANO PREMIUM</p>
          <p className="upsell-total-price">{popupPrice}</p>
          <div className="upsell-diff-wrap">
            <span className="upsell-diff-badge">APENAS + {diffPrice.replace(/\s+/g, '')} DE DIFERENÇA</span>
          </div>
        </div>

        <p className="upsell-price-meta">
          100 atlas em PDF, acesso vitalício e garantia de 15 dias.
        </p>

        <div className="upsell-accordion">
          <button
            type="button"
            className="upsell-accordion-trigger"
            aria-expanded={bonusesOpen}
            aria-controls={accordionId}
            onClick={() => setBonusesOpen((prev) => !prev)}
          >
            <span className="upsell-accordion-label">
              <Gift size={18} aria-hidden="true" />
              <span>VER OS {content.bonuses.length} BÔNUS INCLUÍDOS</span>
            </span>
            <ChevronDown
              size={18}
              className={`upsell-accordion-chevron${bonusesOpen ? ' is-open' : ''}`}
              aria-hidden="true"
            />
          </button>

          {bonusesOpen && (
            <div id={accordionId} className="upsell-accordion-panel">
              <ul className="upsell-bonuses-list">
                {content.bonuses.map((b, idx) => (
                  <li key={b.slug}>
                    <span className="upsell-bonus-tag">BÔNUS {idx + 1}</span>
                    <strong>{b.title}.</strong>
                    <p>{b.popupText || b.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="upsell-actions">
          {popupCheckoutUrl ? (
            <a
              ref={premiumBtnRef}
              className={premiumBtnClass}
              href={popupCheckoutUrl}
            >
              GARANTIR O PLANO PREMIUM
            </a>
          ) : (
            <button
              ref={premiumBtnRef}
              type="button"
              className={premiumBtnClass}
              onClick={() => {}}
            >
              GARANTIR O PLANO PREMIUM
            </button>
          )}

          {basicCheckoutUrl ? (
            <a className="upsell-basic-action" href={basicCheckoutUrl}>
              GARANTIR O PLANO BÁSICO
            </a>
          ) : (
            <button
              type="button"
              className="upsell-basic-action"
              onClick={() => {}}
            >
              GARANTIR O PLANO BÁSICO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
