import test from 'node:test';
import assert from 'node:assert/strict';
import { comercial, formatBRL, getPopupUpgradeDiffCents, isDailyOfferActive } from './comercial.js';

test('isDailyOfferActive respects urgencyEnabled and ISO campaign window without UTC drift', () => {
  const original = {
    urgencyEnabled: comercial.urgencyEnabled,
    campaignStartsAt: comercial.campaignStartsAt,
    campaignEndsAt: comercial.campaignEndsAt,
  };

  try {
    comercial.urgencyEnabled = true;
    comercial.campaignStartsAt = null;
    comercial.campaignEndsAt = null;
    assert.equal(isDailyOfferActive(new Date('2026-11-12T15:00:00-03:00')), true);

    comercial.campaignEndsAt = '2026-11-12T23:59:59-03:00';
    assert.equal(isDailyOfferActive(new Date('2026-11-12T23:59:58-03:00')), true);
    assert.equal(isDailyOfferActive(new Date('2026-11-13T00:00:00-03:00')), false);

    comercial.campaignStartsAt = '2026-11-12T10:00:00-03:00';
    assert.equal(isDailyOfferActive(new Date('2026-11-12T09:59:59-03:00')), false);
    assert.equal(isDailyOfferActive(new Date('2026-11-12T10:00:00-03:00')), true);

    comercial.urgencyEnabled = false;
    assert.equal(isDailyOfferActive(new Date('2026-11-12T12:00:00-03:00')), false);
  } finally {
    comercial.urgencyEnabled = original.urgencyEnabled;
    comercial.campaignStartsAt = original.campaignStartsAt;
    comercial.campaignEndsAt = original.campaignEndsAt;
  }
});

test('popupPremium pricing and difference are computed cleanly in cents and formatted in BRL', () => {
  assert.equal(comercial.basic.priceCents, 1000);
  assert.equal(comercial.premium.priceCents, 2790);
  assert.equal(comercial.popupPremium.priceCents, 1990);
  assert.equal(getPopupUpgradeDiffCents(), 990);

  assert.equal(formatBRL(comercial.basic.priceCents).replace(/\u00a0/g, ' '), 'R$ 10,00');
  assert.equal(formatBRL(comercial.premium.priceCents).replace(/\u00a0/g, ' '), 'R$ 27,90');
  assert.equal(formatBRL(comercial.popupPremium.priceCents).replace(/\u00a0/g, ' '), 'R$ 19,90');
  assert.equal(formatBRL(getPopupUpgradeDiffCents()).replace(/\u00a0/g, ' '), 'R$ 9,90');
});
