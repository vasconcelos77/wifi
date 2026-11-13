import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const AUTO_ADVANCE_MS = 3000;

function TestimonialDialog({ item, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      className="testimonial-dialog"
      ref={dialogRef}
      aria-label="Depoimento ampliado"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="testimonial-dialog-bar">
        <span className="testimonial-dialog-title">Relato de cliente</span>
        <button type="button" onClick={onClose} autoFocus aria-label="Fechar depoimento">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="testimonial-dialog-body">
        {item.images.map((img) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            width={img.width}
            height={img.height}
          />
        ))}
      </div>
    </dialog>
  );
}

function computeMaxStep(track, count) {
  if (!track || count <= 1) return 0;
  const maxScroll = track.scrollWidth - track.clientWidth;
  if (maxScroll <= 4) return 0;

  const children = Array.from(track.children);
  for (let i = 0; i < children.length; i += 1) {
    if (children[i].offsetLeft >= maxScroll - 4) {
      return i;
    }
  }
  return Math.max(0, count - 1);
}

function getStepTargetLeft(track, index) {
  const card = track?.children?.[index];
  if (!card) return 0;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const isSingleCentered = card.clientWidth > track.clientWidth * 0.72;
  const raw = isSingleCentered
    ? card.offsetLeft - (track.clientWidth - card.clientWidth) / 2
    : card.offsetLeft;
  return Math.max(0, Math.min(raw, maxScroll));
}

export default function Testimonials({ items = [], cta }) {
  const trackRef = useRef(null);
  const activeIndexRef = useRef(0);
  const programmaticUntilRef = useRef(0);

  const [failedSrcs, setFailedSrcs] = useState(() => new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(() => Math.max(0, items.length - 1));
  const [zoomedItem, setZoomedItem] = useState(null);
  const [paused, setPaused] = useState(false);
  const [timerReset, setTimerReset] = useState(0);

  const visibleItems = items
    .map((item) => ({
      ...item,
      images: (item.images || []).filter((img) => img?.src && !failedSrcs.has(img.src)),
    }))
    .filter((item) => item.images.length > 0);

  const visibleCount = visibleItems.length;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || visibleCount === 0) return undefined;

    const updateMax = () => {
      const nextMax = computeMaxStep(track, visibleCount);
      setMaxIndex(nextMax);
      if (activeIndexRef.current > nextMax) {
        activeIndexRef.current = nextMax;
        setActiveIndex(nextMax);
      }
    };

    updateMax();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateMax) : null;
    ro?.observe(track);
    window.addEventListener('resize', updateMax, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateMax);
    };
  }, [visibleCount]);

  const scrollToIndex = useCallback(
    (index, isManual = true) => {
      const track = trackRef.current;
      if (!track || maxIndex <= 0) return;
      const bounded = Math.max(0, Math.min(index, maxIndex));
      const targetLeft = getStepTargetLeft(track, bounded);
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      programmaticUntilRef.current = Date.now() + (reduceMotion ? 60 : 550);
      track.scrollTo({
        left: targetLeft,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
      activeIndexRef.current = bounded;
      setActiveIndex(bounded);
      if (isManual) {
        setTimerReset((n) => n + 1);
      }
    },
    [maxIndex]
  );

  useEffect(() => {
    if (visibleCount <= 1 || maxIndex <= 0 || zoomedItem || paused) return undefined;

    const id = window.setInterval(() => {
      const next = activeIndexRef.current >= maxIndex ? 0 : activeIndexRef.current + 1;
      scrollToIndex(next, false);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [visibleCount, maxIndex, zoomedItem, paused, timerReset, scrollToIndex]);

  if (visibleCount === 0) return null;

  const markBroken = (src) => {
    setFailedSrcs((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  };

  const handleTrackScroll = () => {
    if (Date.now() < programmaticUntilRef.current) return;
    const track = trackRef.current;
    if (!track || maxIndex <= 0) return;

    let closest = 0;
    let minDistance = Infinity;
    for (let i = 0; i <= maxIndex; i += 1) {
      const dist = Math.abs(getStepTargetLeft(track, i) - track.scrollLeft);
      if (dist < minDistance) {
        minDistance = dist;
        closest = i;
      }
    }
    if (closest !== activeIndexRef.current) {
      activeIndexRef.current = closest;
      setActiveIndex(closest);
    }
  };

  const countClass =
    visibleCount === 1
      ? 'testimonials-track--single'
      : visibleCount === 2
        ? 'testimonials-track--two'
        : 'testimonials-track--multi';

  const stepTotal = maxIndex + 1;

  return (
    <section className="section testimonials" id="depoimentos">
      <div className="content content--1120 section-flow">
        <header className="section-title" data-reveal="">
          <h2>Veja o que dizem os clientes</h2>
          <p>
            Relatos de quem comprou os Atlas Visuais de <span className="nowrap">Wi-Fi</span> Residencial.
          </p>
        </header>

        <div
          className="testimonials-stage"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => {
            setPaused(false);
            setTimerReset((n) => n + 1);
          }}
        >
          <div
            ref={trackRef}
            className={`testimonials-track ${countClass}`}
            role="region"
            aria-label="Depoimentos de clientes no WhatsApp"
            tabIndex={0}
            onScroll={handleTrackScroll}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollToIndex(activeIndex >= maxIndex ? 0 : activeIndex + 1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollToIndex(activeIndex <= 0 ? maxIndex : activeIndex - 1);
              }
            }}
          >
            {visibleItems.map((item, idx) => (
              <article
                className="testimonial-card"
                key={item.id}
                data-reveal=""
                style={{ '--stagger': idx }}
              >
                <button
                  type="button"
                  className="testimonial-trigger"
                  onClick={() => setZoomedItem(item)}
                  aria-label={`Ampliar conversa ${idx + 1} de ${visibleCount}`}
                >
                  {item.images.map((img) => (
                    <img
                      key={img.src}
                      src={img.src}
                      alt={img.alt}
                      width={img.width}
                      height={img.height}
                      onError={() => markBroken(img.src)}
                    />
                  ))}
                </button>
              </article>
            ))}
          </div>

          {stepTotal > 1 && (
            <div className="testimonial-controls">
              <button
                type="button"
                className="testimonial-arrow testimonial-arrow--left"
                onClick={() => scrollToIndex(activeIndex <= 0 ? maxIndex : activeIndex - 1)}
                aria-label="Depoimento anterior"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>

              <div className="testimonial-dots" role="tablist" aria-label="Posição dos depoimentos">
                {Array.from({ length: stepTotal }, (_, idx) => (
                  <button
                    key={visibleItems[idx]?.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeIndex}
                    aria-label={`Ver posição ${idx + 1} de ${stepTotal}`}
                    className={`testimonial-dot${idx === activeIndex ? ' is-active' : ''}`}
                    onClick={() => scrollToIndex(idx)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="testimonial-arrow testimonial-arrow--right"
                onClick={() => scrollToIndex(activeIndex >= maxIndex ? 0 : activeIndex + 1)}
                aria-label="Próximo depoimento"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {cta}
      </div>

      {zoomedItem && (
        <TestimonialDialog item={zoomedItem} onClose={() => setZoomedItem(null)} />
      )}
    </section>
  );
}
