export const formatBRL = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export const comercial = {
  "quantity": 100,
  "guaranteeDays": 15,
  "access": "Acesso vitalício",
  "format": "PDF",
  "campaignStartsAt": null,
  "campaignEndsAt": null,
  "urgencyEnabled": true,
  "socialProofEnabled": false,
  "basic": {
    "name": "Básico",
    "priceCents": 1000,
    "price": 10,
    "checkoutUrl": null
  },
  "premium": {
    "name": "Premium",
    "priceCents": 2790,
    "price": 27.9,
    "checkoutUrl": null,
    "support": "Suporte 24 horas",
    "updates": "Atualização mensal do conteúdo"
  },
  "popupPremium": {
    "name": "Premium",
    "priceCents": 1990,
    "price": 19.9,
    "checkoutUrl": null
  },
  "supportContact": "[CONTATO DE SUPORTE]",
  "company": "[RAZÃO SOCIAL / CNPJ]",
  "termsUrl": null,
  "privacyUrl": null,
  "delivery": "[CANAL E PRAZO DE ENTREGA A INFORMAR]",
  "guaranteeProcedure": "[CANAL E PROCEDIMENTO DA GARANTIA A INFORMAR]"
};

export function getPopupUpgradeDiffCents(cfg = comercial) {
  return cfg.popupPremium.priceCents - cfg.basic.priceCents;
}

// Controle centralizado da faixa diária.
// - Defina urgencyEnabled: false para ocultar imediatamente a faixa.
// - Quando campaignEndsAt (ISO-8601 com fuso) estiver preenchido, uma oferta vencida nunca é renovada pela data local.
export function isDailyOfferActive(now = new Date()) {
  if (!comercial.urgencyEnabled) return false;

  if (comercial.campaignStartsAt) {
    const startsAt = new Date(comercial.campaignStartsAt);
    if (Number.isNaN(startsAt.getTime()) || now.getTime() < startsAt.getTime()) {
      return false;
    }
  }

  if (comercial.campaignEndsAt) {
    const endsAt = new Date(comercial.campaignEndsAt);
    if (Number.isNaN(endsAt.getTime()) || now.getTime() > endsAt.getTime()) {
      return false;
    }
  }

  return true;
}
