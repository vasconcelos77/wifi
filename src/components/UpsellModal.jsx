import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Clock, Gift, X } from 'lucide-react';
import { comercial, formatBRL, getPopupUpgradeDiffCents } from '../comercial.js';
import { content } from '../content.js';

const STORAGE_KEY = 'wifi_atlas_upsell_expires_at';
const DURATION_SECONDS = 180;

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

  const [bonusesOpen, setBonusesOpen] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(DURATION_SECONDS);

  const popupPrice = formatBRL(comercial.popupPremium.priceCents);
  const basicPrice = formatBRL(comercial.basic.priceCents);
  const diffPrice = formatBRL(getPopupUpgradeDiffCents());
  const popupCheckoutUrl = comercial.popupPremium.checkoutUrl;
  const basicCheckoutUrl = comercial.basic.checkoutUrl;

  useEffect(() => {
    if (!open) {
      setBonusesOpen(false);
      setBtnVisible(false);
      return undefined;
    }

    let expiresAt = Number(localStorage.getItem(STORAGE_KEY));
    const now = Date.now();
    if (!expiresAt || Number.isNaN(expiresAt) || expiresAt <= now) {
      expiresAt = now + DURATION_SECONDS * 1000;
      localStorage.setItem(STORAGE_KEY, String(expiresAt));
    }

    const calcRemaining = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(diff);
      return diff;
    };

    calcRemaining();

    const timer = setInterval(() => {
      const left = calcRemaining();
      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        calcRemaining();
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
        onClose();
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
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        returnFocusRef?.current?.focus();
      });
    };
  }, [open, onClose, returnFocusRef]);

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

  const isExpired = remainingSeconds <= 0;
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  const timeFormatted = `${minutes}:${seconds}`;

  const premiumBtnClass = `btn btn--premium${btnVisible && !isExpired ? ' btn--pulse' : ''}`;

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
        <div className={`upsell-timer-banner${isExpired ? ' is-expired' : ''}`}>
          <Clock size={15} aria-hidden="true" />
          {isExpired ? (
            <span>OFERTA ENCERRADA</span>
          ) : (
            <span>
              OFERTA EXPIRA EM: <strong className="upsell-timer-digits">{timeFormatted}</strong>
            </span>
          )}
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
          {isExpired ? (
            <>
              <p className="upsell-expired-notice">A condição de R$19,90 terminou.</p>
              <a
                ref={premiumBtnRef}
                className="btn btn--premium"
                href="#oferta"
                onClick={onClose}
              >
                VER PLANO PREMIUM
              </a>
            </>
          ) : popupCheckoutUrl ? (
            <a
              ref={premiumBtnRef}
              className={premiumBtnClass}
              href={popupCheckoutUrl}
            >
              GARANTIR O PLANO PREMIUM
            </a>
          ) : (
            <>
              <button
                ref={premiumBtnRef}
                type="button"
                className={premiumBtnClass}
                onClick={() => {}}
                aria-describedby="upsell-premium-note"
              >
                GARANTIR O PLANO PREMIUM
              </button>
              <p id="upsell-premium-note" className="upsell-note">Checkout em preparação</p>
            </>
          )}

          {basicCheckoutUrl ? (
            <a className="upsell-basic-action" href={basicCheckoutUrl}>
              CONTINUAR COM O BÁSICO — {basicPrice.replace(/\s+/g, '')}
            </a>
          ) : (
            <>
              <button
                type="button"
                className="upsell-basic-action"
                onClick={() => {}}
                aria-describedby="upsell-basic-note"
              >
                CONTINUAR COM O BÁSICO — {basicPrice.replace(/\s+/g, '')}
              </button>
              <p id="upsell-basic-note" className="upsell-note">Checkout em preparação</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
