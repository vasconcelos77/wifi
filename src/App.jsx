import { Children, cloneElement, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileQuestion,
  FileText,
  Gift,
  Infinity as InfinityIcon,
  Layers3,
  ListChecks,
  MonitorSmartphone,
  SearchCheck,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { content } from './content.js';
import { comercial, formatBRL, isDailyOfferActive } from './comercial.js';
import Testimonials from './components/Testimonials.jsx';
import UpsellModal from './components/UpsellModal.jsx';

const painIcons = [Clock3, Layers3, MonitorSmartphone, SearchCheck, FileQuestion, AlertTriangle];
const mechanismIcons = [BookOpen, SearchCheck, AlertTriangle, ListChecks];
const formatLocalDate = (date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

function renderNoBreakWiFi(text) {
  const parts = String(text).split(/(Wi-Fi)/g);
  return parts.map((part, index) =>
    part === 'Wi-Fi' ? (
      <span className="nowrap" key={`wifi-${index}`}>
        Wi-Fi
      </span>
    ) : (
      part
    )
  );
}

function OfferBar() {
  const [offerDate, setOfferDate] = useState(null);

  useEffect(() => {
    const syncOfferDate = () => {
      const now = new Date();
      setOfferDate(isDailyOfferActive(now) ? formatLocalDate(now) : null);
    };
    syncOfferDate();
    const timer = window.setInterval(syncOfferDate, 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (!offerDate) return null;

  return (
    <div className="offer-bar" role="region" aria-label="Oferta do dia">
      <Zap size={15} strokeWidth={2.4} aria-hidden="true" />
      <p className="offer-bar-text">
        OFERTA APENAS HOJE <strong className="offer-bar-date">{offerDate}</strong>
      </p>
    </div>
  );
}

function CTA({ label = 'QUERO ESCOLHER MEU PLANO', href = '#oferta', className = '' }) {
  return (
    <a className={`btn${className ? ` ${className}` : ''}`} href={href}>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </a>
  );
}

function SectionTitle({ children, lead }) {
  return (
    <header className="section-title" data-reveal="">
      <h2>{renderNoBreakWiFi(children)}</h2>
      {lead && <p>{lead}</p>}
    </header>
  );
}

function ProductComposition({ variant = 'hero' }) {
  const collection = variant === 'collection';
  const premium = variant === 'premium';
  const compact = ['basic', 'premium'].includes(variant);

  return (
    <div
      className={`product-composition composition--${variant}${compact ? ' product-composition--compact' : ''}`}
      role="img"
      aria-label={
        premium
          ? 'Coleção dos atlas e quatro bônus do Premium'
          : 'Capa e páginas reais dos 100 Atlas Visuais de Wi-Fi Residencial'
      }
    >
      <img
        className="product-sheet product-sheet--left"
        src="/assets/small-atlas_016.webp"
        alt=""
        width="500"
        height="750"
        loading={variant === 'hero' ? undefined : 'lazy'}
      />
      {variant !== 'pitch' && (
        <img
          className="product-sheet product-sheet--middle"
          src="/assets/small-atlas_032.webp"
          alt=""
          width="500"
          height="750"
          loading={variant === 'hero' ? undefined : 'lazy'}
        />
      )}
      <img
        className="product-sheet product-sheet--right"
        src="/assets/small-atlas_068_1.webp"
        alt=""
        width="500"
        height="750"
        loading={variant === 'hero' ? undefined : 'lazy'}
      />
      {collection &&
        ['atlas_025', 'atlas_048_1', 'atlas_098_1'].map((id, i) => (
          <img
            className={`collection-extra extra-${i}`}
            key={id}
            src={`/assets/small-${id}.webp`}
            alt=""
            width="500"
            height="750"
            loading="lazy"
          />
        ))}
      <img
        className="product-cover"
        src="/assets/small-capa.webp"
        alt=""
        width="500"
        height="750"
        loading={variant === 'hero' ? undefined : 'lazy'}
        fetchPriority={variant === 'hero' ? 'high' : undefined}
      />
      {premium && (
        <div className="mini-bonuses">
          {content.bonuses.map((b) => (
            <img
              key={b.slug}
              src={`/assets/small-bonus-${b.slug}-1.webp`}
              alt=""
              width="500"
              height="707"
              loading="lazy"
            />
          ))}
        </div>
      )}
      {variant === 'hero' && (
        <div className="quantity-seal" aria-hidden="true">
          <strong>{comercial.quantity}</strong>
          <span>
            ATLAS
            <br />
            VISUAIS
          </span>
        </div>
      )}
    </div>
  );
}

function ScrollRail({ children, label, className = '', auto = false }) {
  const ref = useRef(null);
  const pausedRef = useRef(false);
  const visibleRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const normalizeTimerRef = useRef(null);
  const manualAnimatingRef = useRef(false);
  const virtualScrollRef = useRef(0);

  const items = Children.toArray(children);
  const renderedItems = auto
    ? [
        ...items,
        ...items.map((child, index) =>
          cloneElement(child, { key: `loop-${index}`, 'aria-hidden': true, inert: true })
        ),
      ]
    : items;

  const getCycleWidth = () => {
    const rail = ref.current;
    if (!rail || rail.children.length <= items.length) return 0;
    return rail.children[items.length].offsetLeft - rail.children[0].offsetLeft;
  };

  const normalize = () => {
    const rail = ref.current;
    const width = getCycleWidth();
    if (!rail || !width) return;
    if (rail.scrollLeft >= width) {
      rail.scrollLeft -= width;
    } else if (rail.scrollLeft < 0) {
      rail.scrollLeft += width;
    }
    virtualScrollRef.current = rail.scrollLeft;
    manualAnimatingRef.current = false;
  };

  const pauseTemporarily = (ms = 3600) => {
    pausedRef.current = true;
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      if (ref.current) {
        virtualScrollRef.current = ref.current.scrollLeft;
      }
      pausedRef.current = false;
    }, ms);
  };

  const scheduleNormalize = () => {
    window.clearTimeout(normalizeTimerRef.current);
    normalizeTimerRef.current = window.setTimeout(normalize, 650);
  };

  const move = (direction) => {
    const rail = ref.current;
    if (!rail) return;
    pauseTemporarily(3600);
    manualAnimatingRef.current = true;
    const width = getCycleWidth();
    const first = rail.children[0];
    const second = rail.children[1];
    const cardStep = second ? second.offsetLeft - first.offsetLeft : rail.clientWidth * 0.8;
    const step = Math.max(cardStep, rail.clientWidth * 0.65);

    if (direction < 0 && width && rail.scrollLeft < step) {
      rail.scrollLeft += width;
    }
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
    scheduleNormalize();
  };

  useEffect(() => {
    if (!auto || !ref.current) return undefined;
    const rail = ref.current;
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = reduceMotionQuery.matches;

    const handleMotionChange = (e) => {
      prefersReduced = e.matches;
    };
    reduceMotionQuery.addEventListener?.('change', handleMotionChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.12 }
    );
    observer.observe(rail);

    virtualScrollRef.current = rail.scrollLeft;
    let rafId = 0;
    let lastTime = performance.now();
    const speedPxPerSec = 36;

    const tick = (now) => {
      const dt = Math.min(now - lastTime, 64);
      lastTime = now;

      if (
        !prefersReduced &&
        !pausedRef.current &&
        !manualAnimatingRef.current &&
        visibleRef.current &&
        !document.hidden
      ) {
        const cycleWidth = getCycleWidth();
        if (cycleWidth > 0) {
          let next = virtualScrollRef.current + (speedPxPerSec * dt) / 1000;
          if (next >= cycleWidth) {
            next -= cycleWidth;
          }
          virtualScrollRef.current = next;
          rail.scrollLeft = next;
        }
      } else if (!manualAnimatingRef.current) {
        virtualScrollRef.current = rail.scrollLeft;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      reduceMotionQuery.removeEventListener?.('change', handleMotionChange);
      window.clearTimeout(resumeTimerRef.current);
      window.clearTimeout(normalizeTimerRef.current);
    };
  }, [auto, items.length]);

  return (
    <div className={`rail-stage ${className}`}>
      <button
        type="button"
        className="rail-arrow rail-arrow--left"
        onClick={() => move(-1)}
        aria-label={`Ver anteriores em ${label}`}
      >
        <ChevronLeft />
      </button>
      <div
        className={`rail${auto ? ' rail--smooth' : ''}`}
        ref={ref}
        tabIndex="0"
        role="region"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            move(e.key === 'ArrowRight' ? 1 : -1);
          }
        }}
        aria-label={label}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          if (ref.current) virtualScrollRef.current = ref.current.scrollLeft;
          pausedRef.current = false;
        }}
        onFocus={() => {
          pausedRef.current = true;
        }}
        onBlur={() => {
          if (ref.current) virtualScrollRef.current = ref.current.scrollLeft;
          pausedRef.current = false;
        }}
        onPointerDown={() => {
          pausedRef.current = true;
        }}
        onPointerUp={() => pauseTemporarily(2600)}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
        onTouchEnd={() => pauseTemporarily(2600)}
        onScroll={() => {
          if (pausedRef.current && ref.current && !manualAnimatingRef.current) {
            virtualScrollRef.current = ref.current.scrollLeft;
          }
        }}
      >
        {renderedItems}
      </div>
      <button
        type="button"
        className="rail-arrow rail-arrow--right"
        onClick={() => move(1)}
        aria-label={`Ver próximos em ${label}`}
      >
        <ChevronRight />
      </button>
    </div>
  );
}

function PreviewDialog({ item, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, []);
  return (
    <dialog
      className="preview-dialog"
      ref={ref}
      aria-label={item[1]}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="preview-toolbar">
        <strong>{item[1]}</strong>
        <button type="button" onClick={onClose} autoFocus aria-label="Fechar prévia">
          <X aria-hidden="true" />
        </button>
      </div>
      <img src={`/assets/${item[0]}.webp`} alt={`Página real: ${item[1]}`} width="900" height="1350" />
    </dialog>
  );
}

function Plan({ premium = false, pulseVisible = false, stagger = 0, onBasicClick, basicButtonRef }) {
  const plan = premium ? comercial.premium : comercial.basic;
  const mainItems = premium
    ? [
        `${comercial.quantity} Atlas Visuais de Wi-Fi Residencial`,
        'PDF digital',
        comercial.access,
        `Garantia de ${comercial.guaranteeDays} dias`,
        comercial.premium.support,
        comercial.premium.updates,
      ]
    : [
        `${comercial.quantity} Atlas Visuais de Wi-Fi Residencial`,
        'PDF digital',
        comercial.access,
        `Garantia de ${comercial.guaranteeDays} dias`,
      ];
  const premiumBtnClass = premium
    ? `btn--premium${pulseVisible ? ' btn--pulse' : ''}`
    : '';

  return (
    <article
      className={`plan-card${premium ? ' plan-card--premium' : ' plan-card--basic'}`}
      data-reveal=""
      style={{ '--stagger': stagger }}
    >
      {premium && (
        <p className="plan-badge">100 ATLAS + {content.bonuses.length} BÔNUS</p>
      )}
      <h3>Plano {plan.name}</h3>
      <p className="plan-description">
        {premium ? 'Atlas e apoios para conduzir a visita.' : 'Coleção completa para consulta em campo.'}
      </p>
      {premium && (
        <div className="plan-mockup">
          <ProductComposition variant="premium" />
        </div>
      )}

      <div className="plan-inclusions">
        <ul className="plan-list">
          {mainItems.map((item) => (
            <li key={item}>
              <Check size={18} aria-hidden="true" />
              <span>{renderNoBreakWiFi(item)}</span>
            </li>
          ))}
        </ul>

        {premium && (
          <div className="plan-bonuses-box" aria-label="Bônus incluídos no Plano Premium">
            <p className="plan-bonuses-heading">VOCÊ TAMBÉM RECEBE</p>
            <ul className="plan-bonuses-list">
              {content.bonuses.map((b, i) => (
                <li key={b.slug}>
                  <Gift size={16} aria-hidden="true" />
                  <span>
                    <strong className="plan-bonus-tag">BÔNUS {i + 1}:</strong> {b.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="plan-purchase">
        <div className="price">
          <strong>{formatBRL(plan.priceCents)}</strong>
        </div>
        {!premium ? (
          <button
            ref={basicButtonRef}
            className="btn btn--basic"
            type="button"
            onClick={onBasicClick}
          >
            ESCOLHER PLANO BÁSICO
          </button>
        ) : plan.checkoutUrl ? (
          <a
            className={`btn ${premiumBtnClass}`}
            href={plan.checkoutUrl}
          >
            GARANTIR O PLANO PREMIUM
          </a>
        ) : (
          <>
            <button
              className={`btn ${premiumBtnClass}`}
              type="button"
              onClick={() => {}}
              aria-describedby="plan-premium-checkout-note"
            >
              GARANTIR O PLANO PREMIUM
            </button>
            <p id="plan-premium-checkout-note" className="checkout-note">Checkout em preparação</p>
          </>
        )}
        <div className="payment-trust">
          <span>
            <ShieldCheck size={17} aria-hidden="true" />
            {comercial.guaranteeDays} dias de garantia
          </span>
          <span>
            <FileCheck2 size={17} aria-hidden="true" />
            Acesso vitalício
          </span>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [preview, setPreview] = useState(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [premiumVisible, setPremiumVisible] = useState(false);
  const heroMediaRef = useRef(null);
  const basicBtnRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealTargets = Array.from(document.querySelectorAll('[data-reveal]'));

    if (reduceMotion) {
      revealTargets.forEach((el) => el.classList.add('is-revealed'));
      return undefined;
    }

    const viewportCutoff = window.innerHeight * 0.94;
    const pendingTargets = [];
    revealTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportCutoff) {
        el.classList.add('is-revealed');
      } else {
        el.classList.add('reveal-ready');
        pendingTargets.push(el);
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );
    pendingTargets.forEach((el) => revealObserver.observe(el));

    const heroEl = heroMediaRef.current;
    let heroObserver;
    if (heroEl) {
      heroObserver = new IntersectionObserver(
        ([entry]) => setHeroVisible(entry.isIntersecting),
        { threshold: 0.12 }
      );
      heroObserver.observe(heroEl);
    }

    const premiumCtaEl = document.querySelector('.plan-card--premium .plan-purchase');
    let premiumObserver;
    if (premiumCtaEl) {
      premiumObserver = new IntersectionObserver(
        ([entry]) => setPremiumVisible(entry.isIntersecting),
        { threshold: 0.2 }
      );
      premiumObserver.observe(premiumCtaEl);
    }

    return () => {
      revealObserver.disconnect();
      heroObserver?.disconnect();
      premiumObserver?.disconnect();
    };
  }, []);

  const title = (
    <>
      {renderNoBreakWiFi(content.hero.titleBefore)}
      <em>{renderNoBreakWiFi(content.hero.titleEmphasis)}</em>
      {renderNoBreakWiFi(content.hero.titleAfter)}
    </>
  );

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <OfferBar />
      <main id="conteudo">
        <section className="hero">
          <div className="content content--860 hero-flow">
            <p className="hero-pill">{renderNoBreakWiFi(content.hero.badge)}</p>
            <h1>{title}</h1>
            <div ref={heroMediaRef} className={`hero-media${heroVisible ? ' is-in-view' : ''}`}>
              <ProductComposition />
            </div>

            <div className="hero-bottom">
              <p className="hero-sub">
                Com <strong className="hero-sub-strong">100 atlas visuais</strong>, compare cobertura, aparelhos e conexões para <strong className="hero-sub-strong">escolher o próximo teste</strong> e explicar ao cliente o que precisa ser verificado.
              </p>
              <CTA label="QUERO VER OS ATLAS" href="#previas" className="hero-cta" />
              <div className="hero-benefits-panel">
                <ul className="hero-bullets">
                  {content.hero.bullets.map((t) => (
                    <li key={t}>
                      <Check size={14} aria-hidden="true" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="hero-meta">
                <span>
                  <FileText size={15} aria-hidden="true" />
                  PDF digital
                </span>
                <span className="hero-meta-sep" aria-hidden="true">
                  |
                </span>
                <span>
                  <InfinityIcon size={15} aria-hidden="true" />
                  Acesso vitalício
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="section pain">
          <div className="content content--880 section-flow">
            <SectionTitle>{content.pain.title}</SectionTitle>
            <div className="pain-grid">
              {content.pains.map((t, i) => {
                const Icon = painIcons[i];
                return (
                  <div className="pain-chip" key={t} data-reveal="" style={{ '--stagger': i }}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section--tint gallery" id="previas">
          <div className="content content--1180 section-flow">
            <SectionTitle lead="Confira páginas reais do material.">Veja os atlas por dentro.</SectionTitle>
            <ScrollRail label="Páginas reais dos atlas" className="gallery-rail" auto>
              {content.gallery.map((item) => (
                <figure className="gallery-card" key={item[0]}>
                  <div className="gallery-frame">
                    <img
                      src={`/assets/small-${item[0]}.webp`}
                      alt={`Atlas real: ${item[1]}`}
                      width="500"
                      height="750"
                    />
                  </div>
                  <figcaption>{renderNoBreakWiFi(item[1])}</figcaption>
                </figure>
              ))}
            </ScrollRail>
          </div>
        </section>

        <section className="section mechanism">
          <div className="content content--1120 section-flow">
            <SectionTitle>Um atlas para cada tema.</SectionTitle>
            <button
              type="button"
              className="mechanism-preview"
              data-reveal=""
              onClick={() => setPreview(['atlas_068_1', 'Diagnóstico por sintomas'])}
              aria-label="Ampliar atlas de diagnóstico por sintomas"
            >
              <img
                src="/assets/atlas_068_1.webp"
                alt="Atlas 68 parte 1: perguntas e verificações de conexão"
                width="900"
                height="1350"
                loading="lazy"
              />
            </button>
            <div className="mechanism-grid">
              {content.mechanism.map(([t, p], i) => {
                const Icon = mechanismIcons[i];
                return (
                  <article key={t} data-reveal="" style={{ '--stagger': i }}>
                    <span className="mechanism-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3>
                      {i + 1}. {t}
                    </h3>
                    <p>{p}</p>
                  </article>
                );
              })}
            </div>
            <p className="mechanism-close" data-reveal="">
              {content.mechanismClose}
            </p>
            <CTA />
          </div>
        </section>

        <section className="section mid-pitch">
          <div className="content content--1040 mid-pitch-grid" data-reveal="">
            <div className="mid-pitch-media">
              <ProductComposition variant="pitch" />
            </div>
            <div className="mid-pitch-copy">
              <h2>{content.pitch.title}</h2>
              <p>{content.pitch.text}</p>
              <CTA />
            </div>
          </div>
        </section>

        <section className="section audiences">
          <div className="content content--1040 section-flow">
            <SectionTitle>Para quem atende Wi-Fi residencial.</SectionTitle>
            <div className="audience-grid">
              {content.audiences.map(([t, p], i) => (
                <article key={t} data-reveal="" style={{ '--stagger': i }}>
                  <span>
                    <Check size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{t}</h3>
                    <p>{p}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--tint receive">
          <div className="content content--1000 section-flow">
            <SectionTitle>O que você recebe.</SectionTitle>
            <div className="receive-media" data-reveal="">
              <ProductComposition variant="collection" />
            </div>
            <article className="receive-card" data-reveal="">
              <p className="access-badge">{comercial.quantity} ATLAS VISUAIS EM PDF</p>
              <h3>{renderNoBreakWiFi(content.hero.badge)}</h3>
              <p>Em PDF com acesso vitalício; {content.bonuses.length} bônus no Premium.</p>
              <ul>
                {content.benefits.map((t) => (
                  <li key={t}>
                    <Check size={18} aria-hidden="true" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="section bonuses">
          <div className="content content--1120 section-flow">
            <header className="bonus-intro" data-reveal="">
              <h2>ESCOLHA O PREMIUM E LEVE 4 BÔNUS PARA SEUS ATENDIMENTOS</h2>
              <div className="bonus-banner">
                <span>Além dos 100 atlas, o Premium inclui estes <strong>4 materiais de apoio</strong>.</span>
              </div>
            </header>
            <div className="bonus-grid">
              {content.bonuses.map((b, i) => (
                <article className="bonus-card" key={b.slug} data-reveal="" style={{ '--stagger': i }}>
                  <div className="bonus-card-top">
                    <div className="bonus-card-top-header">
                      <p className="bonus-num">BÔNUS {i + 1}</p>
                      <span className="bonus-icon-badge" aria-hidden="true">
                        <Gift size={16} />
                      </span>
                    </div>
                    <div className="bonus-art">
                      <span className="bonus-art-shadow" aria-hidden="true" />
                      <img
                        className="bonus-page bonus-page--1"
                        src={`/assets/small-bonus-${b.slug}-4.webp`}
                        alt=""
                        width="500"
                        height="707"
                        loading="lazy"
                      />
                      <div className="bonus-book">
                        <img
                          src={`/assets/small-bonus-${b.slug}-1.webp`}
                          alt={`Capa real: ${b.title}`}
                          width="500"
                          height="707"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bonus-card-body">
                    <h3>{b.title}</h3>
                    <p>{b.text}</p>
                    <div className="bonus-price">
                      {b.priceCents && <span className="bonus-original-price">{formatBRL(b.priceCents)}</span>}
                      <span>INCLUÍDO NO PREMIUM</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="bonus-closing-box" data-reveal="">
              <p className="bonus-closing-value">
                Valor total dos bônus: <span className="bonus-strikethrough">{formatBRL(content.bonuses.reduce((acc, b) => acc + (b.priceCents || 0), 0))}</span>
              </p>
              <h3>OS 4 BÔNUS ESTÃO INCLUÍDOS NO PREMIUM</h3>
              <p>Escolha o Premium para receber os atlas e os quatro materiais de apoio.</p>
            </div>
          </div>
        </section>

        <section className="section offer" id="oferta">
          <div className="content content--1040 section-flow">
            <SectionTitle>Escolha seu plano.</SectionTitle>
            <div className="value-stack" data-reveal="">
              <p>INCLUSO EM CADA PLANO</p>
              <ul>
                <li>
                  <span>100 atlas em PDF, acesso vitalício e garantia de 15 dias</span>
                  <strong>Nos dois planos</strong>
                </li>
                {content.bonuses.map((b) => (
                  <li key={b.slug}>
                    <span>{b.title}</span>
                    <strong>Premium</strong>
                  </li>
                ))}
                <li>
                  <span>Suporte 24h e atualização mensal</span>
                  <strong>Premium</strong>
                </li>
              </ul>
            </div>
            <div className="plans-grid">
              <Plan
                stagger={0}
                onBasicClick={() => setUpsellOpen(true)}
                basicButtonRef={basicBtnRef}
              />
              <Plan premium pulseVisible={premiumVisible} stagger={1} />
            </div>
          </div>
        </section>

        <Testimonials
          items={content.testimonials}
          cta={<CTA label="QUERO ESCOLHER MEU PLANO" href="#oferta" />}
        />

        <section className="section purchase-safety">
          <div className="content content--1000 safety-layout">
            <article className="guarantee-card" data-reveal="" style={{ '--stagger': 0 }}>
              <ShieldCheck size={48} aria-hidden="true" />
              <h2>15 dias de garantia.</h2>
              <p>Teste o Básico ou o Premium por {comercial.guaranteeDays} dias.</p>
              <p className="pending">{comercial.guaranteeProcedure}</p>
            </article>
            <div className="safety-cards">
              <article data-reveal="" style={{ '--stagger': 1 }}>
                <BookOpen size={28} aria-hidden="true" />
                <div>
                  <h3>Acesso vitalício</h3>
                  <p>Consulte os PDFs sempre que precisar.</p>
                </div>
              </article>
              <article data-reveal="" style={{ '--stagger': 2 }}>
                <FileCheck2 size={28} aria-hidden="true" />
                <div>
                  <h3>Entrega digital</h3>
                  <p>Material em PDF, sem envio físico.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section faq">
          <div className="content content--780 section-flow">
            <SectionTitle>Tire suas dúvidas.</SectionTitle>
            <div className="faq-list">
              {content.faqs.map(([q, a], i) => (
                <details key={q} data-reveal="" style={{ '--stagger': i }}>
                  <summary>
                    <span>{renderNoBreakWiFi(q)}</span>
                    <span className="faq-plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="content content--860 closing-inner" data-reveal="">
            <h2>{title}</h2>
            <p className="closing-support">{content.closing.text}</p>
            <CTA />
            <small>PDF digital com acesso vitalício nos dois planos.</small>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p>Suporte: {comercial.supportContact}</p>
          <p>{comercial.company}</p>
          <p className="footer-legal">Material de apoio técnico. Siga os procedimentos do provedor.</p>
          <nav aria-label="Informações legais">
            {comercial.termsUrl ? <a href={comercial.termsUrl}>Termos de uso</a> : <span>[TERMOS DE USO]</span>}
            {comercial.privacyUrl ? (
              <a href={comercial.privacyUrl}>Política de privacidade</a>
            ) : (
              <span>[POLÍTICA DE PRIVACIDADE]</span>
            )}
          </nav>
        </div>
      </footer>

      {preview && <PreviewDialog item={preview} onClose={() => setPreview(null)} />}
      <UpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        returnFocusRef={basicBtnRef}
      />
    </>
  );
}
