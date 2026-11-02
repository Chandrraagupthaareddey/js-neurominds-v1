import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserStubs } from '../helpers/browser-stubs.js';

let ob, BOOKING;
before(async () => {
  installBrowserStubs({ hostname: 'localhost' });
  ob = await import('../../public-site/assets/js/own-booking.js');
  ({ BOOKING } = await import('../../shared/content.js'));
});

test('booking settings ship DISABLED by default (partner mode, no payments)', () => {
  assert.equal(BOOKING.mode, 'partner');
  assert.equal(BOOKING.own_booking_enabled, false);
  assert.equal(BOOKING.payments.enabled, false);
  assert.ok(Array.isArray(BOOKING.own.slots) && BOOKING.own.slots.length > 0);
});

test('availableDates skips closed weekdays and respects days_ahead', () => {
  const from = new Date('2026-11-02T09:00:00'); // Monday
  const dates = ob.availableDates({ days_ahead: 7, closed_weekdays: ['Sunday'] }, from);
  assert.equal(dates.length, 6);
  assert.ok(!dates.includes('2026-11-08'), 'Sunday excluded');
  assert.equal(dates[0], '2026-11-02');
});

test('slotsFor hides already-passed slots today only', () => {
  const own = { slots: ['10:00', '16:00', '18:30'] };
  const now = new Date('2026-11-02T15:45:00');
  assert.deepEqual(ob.slotsFor(own, '2026-11-02', now), ['18:30'], '16:00 is within the 30-min buffer');
  assert.deepEqual(ob.slotsFor(own, '2026-11-03', now), ['10:00', '16:00', '18:30']);
});

test('fees, references, UPI links and method filtering', () => {
  const own = { consultation_fee: 800, followup_fee: 500 };
  assert.equal(ob.feeFor(own, 'New consultation'), 800);
  assert.equal(ob.feeFor(own, 'Follow-up'), 500);
  assert.match(ob.makeReference(new Date('2026-11-02T10:00:00')), /^JSNM-20261102-[A-Z0-9]{4}$/);
  const link = ob.upiLink({ upi_id: 'clinic@okaxis', payee_name: 'JS Neurominds' }, 800, 'JSNM-1 Test');
  assert.ok(link.startsWith('upi://pay?') && link.includes('pa=clinic%40okaxis') && link.includes('am=800') && link.includes('cu=INR'));
  const methods = ob.enabledMethods({ methods: [
    { id: 'upi', type: 'upi', enabled: true, upi_id: '', order: 1 },           // enabled but not configured → hidden
    { id: 'qr', type: 'qr', enabled: true, image: '/assets/img/qr.png', order: 3 },
    { id: 'rzp', type: 'link', enabled: true, url: 'https://rzp.io/l/x', order: 2 },
    { id: 'off', type: 'link', enabled: false, url: 'https://x', order: 0 }
  ] });
  assert.deepEqual(methods.map((m) => m.id), ['rzp', 'qr']);
});

test('WhatsApp hand-off message contains the essentials and no HTML', () => {
  const msg = ob.whatsappMessage({ clinic_short: 'JS Neurominds' }, { reference: 'JSNM-1', name: 'A', mobile: '9000000001', date: '2026-11-03', slot: '10:30', visit_type: 'New', mode: 'Clinic', fee: 800 }, 'UPI');
  assert.ok(msg.includes('JSNM-1') && msg.includes('9000000001') && msg.includes('10:30') && msg.includes('Payment: done via UPI'));
  assert.ok(!/[<>]/.test(msg));
});
