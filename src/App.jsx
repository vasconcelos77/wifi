import { Children, cloneElement, useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, Check, ChevronLeft, ChevronRight, Clock3, FileQuestion, Gift, Layers3, ListChecks, MonitorSmartphone, SearchCheck, ShieldCheck, FileCheck2, X } from 'lucide-react';
import { content } from './content.js';
import { comercial } from './comercial.js';
const painIcons=[Clock3,Layers3,MonitorSmartphone,SearchCheck,FileQuestion,AlertTriangle];
const mechanismIcons=[BookOpen,SearchCheck,AlertTriangle,ListChecks];
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
function CTA({label='QUERO ESCOLHER MEU PLANO',href='#oferta'}){return <a className="btn" href={href}>{label}<span aria-hidden="true">→</span></a>}
function SectionTitle({children,lead}){return <header className="section-title"><h2>{children}</h2>{lead&&<p>{lead}</p>}</header>}
function ProductComposition({variant='hero'}){
 const collection=variant==='collection', premium=variant==='premium', compact=['basic','premium'].includes(variant);
 return <div className={`product-composition composition--${variant}${compact?' product-composition--compact':''}`} role="img" aria-label={premium?'Coleção dos atlas e quatro bônus do Premium':'Capa e páginas reais dos 100 Atlas Visuais de Wi-Fi Residencial'}>
  <img className="product-sheet product-sheet--left" src="/assets/small-atlas_016.webp" alt="" width="900" height="1350" loading={variant==='hero'?undefined:'lazy'}/>
  <img className="product-sheet product-sheet--middle" src="/assets/small-atlas_032.webp" alt="" width="900" height="1350" loading={variant==='hero'?undefined:'lazy'}/>
  <img className="product-sheet product-sheet--right" src="/assets/small-atlas_068_1.webp" alt="" width="900" height="1350" loading={variant==='hero'?undefined:'lazy'}/>
  {collection&&['atlas_025','atlas_048_1','atlas_098_1'].map((id,i)=><img className={`collection-extra extra-${i}`} key={id} src={`/assets/small-${id}.webp`} alt="" width="900" height="1350" loading="lazy"/>)}
  <img className="product-cover" src="/assets/small-capa.webp" alt="" width="800" height="1200" loading={variant==='hero'?undefined:'lazy'} fetchPriority={variant==='hero'?'high':undefined}/>
  {premium&&<div className="mini-bonuses">{content.bonuses.map(b=><img key={b.slug} src={`/assets/small-bonus-${b.slug}-1.webp`} alt="" loading="lazy"/>)}</div>}
  {variant==='hero'&&<div className="quantity-seal" aria-hidden="true"><strong>{comercial.quantity}</strong><span>ATLAS<br/>VISUAIS</span></div>}
 </div>
}
function ScrollRail({ children, label, className = '', auto = false, interval = 2800 }) {
  const ref = useRef(null);
  const [manualPaused, setManualPaused] = useState(false);
  const pausedRef = useRef(false);
  const visibleRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const normalizeTimerRef = useRef(null);
  const items = Children.toArray(children);
  const renderedItems = auto
    ? [...items, ...items.map((child, index) => cloneElement(child, { key: `loop-${index}`, 'aria-hidden': true, inert: true }))]
    : items;

  const cycleWidth = () => {
    const rail = ref.current;
    if (!rail || rail.children.length <= items.length) return 0;
    return rail.children[items.length].offsetLeft - rail.children[0].offsetLeft;
  };

  const normalize = () => {
    const rail = ref.current;
    const width = cycleWidth();
    if (!rail || !width) return;
    if (rail.scrollLeft >= width) rail.scrollLeft -= width;
  };

  const pauseTemporarily = () => {
    pausedRef.current = true;
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => { pausedRef.current = false; }, 4200);
  };

  const scheduleNormalize = () => {
    window.clearTimeout(normalizeTimerRef.current);
    normalizeTimerRef.current = window.setTimeout(normalize, 700);
  };

  const move = direction => {
    const rail = ref.current;
    if (!rail) return;
    pauseTemporarily();
    const width = cycleWidth();
    if (direction < 0 && width && rail.scrollLeft <= 2) rail.scrollLeft = width;
    rail.scrollBy({ left: direction * rail.clientWidth * .82, behavior: 'smooth' });
    scheduleNormalize();
  };

  useEffect(() => {
    if (!auto || !ref.current) return undefined;
    const rail = ref.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(([entry]) => { visibleRef.current = entry.isIntersecting; }, { threshold: .18 });
    observer.observe(rail);
    const timer = window.setInterval(() => {
      if (manualPaused || reduceMotion.matches || pausedRef.current || !visibleRef.current || document.hidden) return;
      const firstItem = rail.children[0];
      const secondItem = rail.children[1];
      const step = secondItem ? secondItem.offsetLeft - firstItem.offsetLeft : rail.clientWidth * .82;
      rail.scrollBy({ left: step, behavior: 'smooth' });
      scheduleNormalize();
    }, interval);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.clearTimeout(resumeTimerRef.current);
      window.clearTimeout(normalizeTimerRef.current);
    };
  }, [auto, interval, items.length, manualPaused]);

  return <div className={`rail-stage ${className}`}>
    {auto && <button className="rail-pause" type="button" onClick={()=>setManualPaused(!manualPaused)} aria-pressed={manualPaused}>{manualPaused ? "Retomar movimento" : "Pausar movimento"}</button>}
    <button type="button" className="rail-arrow rail-arrow--left" onClick={() => move(-1)} aria-label={`Ver anteriores em ${label}`}><ChevronLeft /></button>
    <div
      className={`rail${auto ? ' rail--loop' : ''}`}
      ref={ref}
      tabIndex="0"
      role="region"
      onKeyDown={e=>{if(e.key === "ArrowRight" || e.key === "ArrowLeft"){e.preventDefault();move(e.key === "ArrowRight" ? 1 : -1);}}}
      aria-label={label}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { pausedRef.current = false; }}
      onPointerDown={() => { pausedRef.current = true; }}
      onPointerUp={pauseTemporarily}
      onTouchEnd={pauseTemporarily}
    >{renderedItems}</div>
    <button type="button" className="rail-arrow rail-arrow--right" onClick={() => move(1)} aria-label={`Ver próximos em ${label}`}><ChevronRight /></button>
  </div>;
}


function PreviewDialog({item,onClose}){
 const ref=useRef(null);
 useEffect(()=>{const d=ref.current;d.showModal();return()=>{if(d.open)d.close()}},[]);
 return <dialog className="preview-dialog" ref={ref} aria-label={item[1]} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose()}}>
  <div className="preview-toolbar"><strong>{item[1]}</strong><button type="button" onClick={onClose} autoFocus aria-label="Fechar prévia"><X aria-hidden="true"/></button></div>
  <img src={`/assets/${item[0]}.webp`} alt={`Página real: ${item[1]}`} width="900" height="1350"/>
 </dialog>
}
function Plan({premium=false}){
 const plan=premium?comercial.premium:comercial.basic;
 const items=[`${comercial.quantity} Atlas Visuais de Wi-Fi Residencial`,'Consulta de conceitos, testes e cenários de rede residencial','Material digital em PDF',comercial.access,`Garantia de ${comercial.guaranteeDays} dias`,...(premium?[...content.bonuses.map(b=>b.title),comercial.premium.support,comercial.premium.updates]:[])];
 return <article className={`plan-card${premium?' plan-card--premium':''}`}>
 <p className="plan-badge">{premium?`100 ATLAS + ${content.bonuses.length} BÔNUS`:'100 ATLAS VISUAIS'}</p>
 <h3>Plano {plan.name}</h3><p className="plan-description">{premium?'Consulta técnica e apoios para conduzir o atendimento.':'A coleção de consulta para a visita residencial.'}</p>
 <div className="plan-mockup"><ProductComposition variant={premium?'premium':'basic'}/></div>
 <ul>{items.map(item=><li key={item}><Check size={20} aria-hidden="true"/><span>{item}</span></li>)}</ul>
 <div className="plan-purchase"><div className="price"><small>Plano {plan.name}</small><strong>{money(plan.price)}</strong></div>
 {plan.checkoutUrl?<CTA label={`QUERO O PLANO ${plan.name.toUpperCase()}`} href={plan.checkoutUrl}/>:<><button className="btn" type="button" disabled>QUERO O PLANO {plan.name.toUpperCase()}</button><p className="checkout-note">Checkout em preparação</p></>}
 <div className="payment-trust"><span><ShieldCheck size={18} aria-hidden="true"/>{comercial.guaranteeDays} dias de garantia</span><span><FileCheck2 size={18} aria-hidden="true"/>Acesso vitalício</span></div></div>
 </article>
}
export default function App(){
 const [preview,setPreview]=useState(null);
 const title=<>{content.hero.titleBefore}<em>{content.hero.titleEmphasis}</em>{content.hero.titleAfter}</>;
 return <><a className="skip-link" href="#conteudo">Ir para o conteúdo</a><main id="conteudo">
 <section className="hero"><div className="content content--860 hero-flow">
 <p className="hero-pill">{content.hero.badge}</p><h1>{title}</h1>
 <div className="hero-media"><ProductComposition/></div><p className="hero-sub">{content.hero.subtitle}</p>
 <CTA label="QUERO VER OS ATLAS" href="#previas"/>
 <ul className="hero-bullets">{content.hero.bullets.map(t=><li key={t}><Check size={20} aria-hidden="true"/><span>{t}</span></li>)}</ul>
 <p className="amplitude">{content.hero.amplitude}</p>
 </div></section>
 <section className="section pain"><div className="content content--880 section-flow">
 <SectionTitle>{content.pain.title} {content.pain.emphasis}</SectionTitle>
 <div className="pain-grid">{content.pains.map((t,i)=>{const Icon=painIcons[i];return <div className="pain-chip" key={t}><Icon size={18} aria-hidden="true"/><span>{t}</span></div>})}</div>
 </div></section>
 <section className="section section--tint gallery" id="previas"><div className="content content--1180 section-flow">
 <SectionTitle lead="Páginas reais sobre cobertura, testes, sintomas e escolha de soluções. Abra uma prévia para ampliar.">Veja os atlas que acompanham sua visita.</SectionTitle>
 <ScrollRail label="Páginas reais dos atlas" className="gallery-rail" auto interval={3200}>{content.gallery.map(item=><figure className="gallery-card" key={item[0]}><button type="button" className="preview-button" onClick={()=>setPreview(item)} aria-label={`Ampliar página: ${item[1]}`}><img src={`/assets/small-${item[0]}.webp`} alt={`Atlas real: ${item[1]}`} width="900" height="1350" loading="lazy"/><span>Ampliar página</span></button><figcaption>{item[1]}</figcaption></figure>)}</ScrollRail>
 </div></section>
 <section className="section mechanism"><div className="content content--1120 section-flow">
 <SectionTitle>Um atlas para cada tema da rede residencial.</SectionTitle>
 <button type="button" className="mechanism-preview" onClick={()=>setPreview(['atlas_068_1','Diagnóstico por sintomas: conexão'])} aria-label="Ampliar atlas de diagnóstico por sintomas"><img src="/assets/atlas_068_1.webp" alt="Atlas 68 parte 1: perguntas e verificações de conexão" width="900" height="1350" loading="lazy"/></button>
 <div className="mechanism-grid">{content.mechanism.map(([t,p],i)=>{const Icon=mechanismIcons[i];return <article key={t}><span className="mechanism-icon"><Icon size={25} aria-hidden="true"/></span><h3>{i+1}. {t}</h3><p>{p}</p></article>})}</div>
 <p className="mechanism-close">{content.mechanismClose}</p><CTA/>
 </div></section>
 <section className="section mid-pitch"><div className="content content--1040 mid-pitch-grid">
 <div className="mid-pitch-media"><ProductComposition variant="pitch"/></div><div className="mid-pitch-copy"><h2>{content.pitch.title}</h2><p>{content.pitch.text}</p><CTA/></div>
 </div></section>
 <section className="section audiences"><div className="content content--1040 section-flow"><SectionTitle>Para quem atende o Wi-Fi dentro da casa do cliente.</SectionTitle><div className="audience-grid">{content.audiences.map(([t,p])=><article key={t}><span><Check size={17} aria-hidden="true"/></span><div><h3>{t}</h3><p>{p}</p></div></article>)}</div></div></section>
 <section className="section section--tint receive"><div className="content content--1000 section-flow">
 <SectionTitle>Da primeira verificação ao plano de melhoria.</SectionTitle><div className="receive-media"><ProductComposition variant="collection"/></div>
 <article className="receive-card"><p className="access-badge">{comercial.quantity} ATLAS VISUAIS</p><p>No Premium, mais {content.bonuses.length} bônus.</p><h3>{content.hero.badge}</h3><p>Uma coleção para consultar conceitos e verificações ao investigar a rede da residência.</p><ul>{content.benefits.map(t=><li key={t}><Check size={20} aria-hidden="true"/><span>{t}</span></li>)}</ul><p className="receive-close">Abra o tema que corresponde à situação e use a página como apoio à verificação.</p></article>
 </div></section>
 <section className="section bonuses"><div className="content content--1120 section-flow">
 <header className="bonus-intro"><h2>No Premium, a consulta continua no registro e na conversa com o cliente.</h2><span><Gift size={17} aria-hidden="true"/>{content.bonuses.length} BÔNUS DO PREMIUM</span></header>
 <div className="bonus-grid">{content.bonuses.map((b,i)=><article className="bonus-card" key={b.slug}><div className="bonus-card-top"><p className="bonus-num">BÔNUS {String(i+1).padStart(2,'0')}</p><div className="bonus-art"><span className="bonus-art-shadow"/><img className="bonus-page bonus-page--1" src={`/assets/small-bonus-${b.slug}-4.webp`} alt="" width="800" height="1131" loading="lazy"/><div className="bonus-book"><img src={`/assets/small-bonus-${b.slug}-1.webp`} alt={`Capa real: ${b.title}`} width="800" height="1131" loading="lazy"/></div></div></div><div className="bonus-card-body"><h3>{b.title}</h3><p>{b.text}</p><div className="bonus-gain"><Check size={18} aria-hidden="true"/><span>{b.gain}</span></div><div className="bonus-price"><strong>INCLUÍDO NO PREMIUM</strong></div></div></article>)}</div>
 </div></section>
 <section className="section offer" id="oferta"><div className="content content--1040 section-flow">
 <SectionTitle>Escolha como você quer consultar e conduzir seus atendimentos.</SectionTitle>
 <div className="value-stack"><p>O QUE CADA PLANO INCLUI</p><ul><li><span>100 atlas em PDF, acesso vitalício e garantia de 15 dias</span><strong>Nos dois planos</strong></li>{content.bonuses.map(b=><li key={b.slug}><span>{b.title}</span><strong>Premium</strong></li>)}<li><span>Suporte 24 horas e atualização mensal do conteúdo</span><strong>Premium</strong></li></ul></div>
 <div className="plans-grid"><Plan/><Plan premium/></div><p className="offer-close">Material digital em PDF. Escolha o plano conforme os apoios que deseja receber.</p>
 </div></section>
 <section className="section purchase-safety"><div className="content content--1000 safety-layout"><article className="guarantee-card"><ShieldCheck size={54} aria-hidden="true"/><h2>Garantia de {comercial.guaranteeDays} dias nos dois planos.</h2><p>Você tem {comercial.guaranteeDays} dias de garantia no Básico e no Premium.</p><p className="pending">{comercial.guaranteeProcedure}</p></article><div className="safety-cards"><article><BookOpen size={30} aria-hidden="true"/><div><h3>Acesso vitalício</h3><p>Volte ao PDF nas próximas consultas.</p></div></article><article><FileCheck2 size={30} aria-hidden="true"/><div><h3>Entrega digital</h3><p>Sem envio de material físico.</p></div></article></div></div></section>
 <section className="section faq"><div className="content content--780 section-flow"><SectionTitle>Perguntas frequentes</SectionTitle><div className="faq-list">{content.faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div></section>
 <section className="closing"><div className="content content--860 closing-inner"><h2>{title}</h2><p className="closing-support">{content.closing.text}</p><CTA/><small>Material digital em PDF. Acesso vitalício nos dois planos.</small></div></section>
 </main><footer className="footer"><div className="footer-inner"><p>Suporte: {comercial.supportContact}</p><p>{comercial.company}</p><p className="footer-legal">Material de apoio técnico. Não substitui os procedimentos do provedor nem autoriza intervenções fora da função do profissional.</p><nav aria-label="Informações legais">{comercial.termsUrl?<a href={comercial.termsUrl}>Termos de uso</a>:<span>[TERMOS DE USO]</span>}{comercial.privacyUrl?<a href={comercial.privacyUrl}>Política de privacidade</a>:<span>[POLÍTICA DE PRIVACIDADE]</span>}</nav></div></footer>
 {preview&&<PreviewDialog item={preview} onClose={()=>setPreview(null)}/>}
 </>
}
