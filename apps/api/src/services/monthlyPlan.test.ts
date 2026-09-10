import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMonthlySlots,
  MONTHLY_PLAN_TOTAL_POSTS,
  MONTHLY_POST_TIMES,
} from '@forge-deals/shared';

test('monthly planner creates exactly 150 slots with the fixed daily schedule', () => {
  const slots = buildMonthlySlots(new Date('2026-09-01T00:00:00.000Z'));

  assert.equal(slots.length, MONTHLY_PLAN_TOTAL_POSTS);
  assert.equal(MONTHLY_PLAN_TOTAL_POSTS, 150);
  assert.deepEqual(slots.slice(0, 5).map((slot) => slot.scheduledAt), [
    '2026-09-01T12:00:00.000Z',
    '2026-09-01T14:00:00.000Z',
    '2026-09-01T17:00:00.000Z',
    '2026-09-01T20:00:00.000Z',
    '2026-09-01T23:00:00.000Z',
  ]);
  assert.equal(slots[0]?.slotIndex, 1);
  assert.equal(slots.at(-1)?.slotIndex, 150);
  assert.equal(MONTHLY_POST_TIMES.join(','), '09:00,11:00,14:00,17:00,20:00');
});

test('monthly planner keeps slots one calendar day apart', () => {
  const slots = buildMonthlySlots(new Date('2026-12-15T00:00:00.000Z'));
  const firstDay = slots.slice(0, 5).map((slot) => slot.scheduledAt.slice(0, 10));
  const secondDay = slots.slice(5, 10).map((slot) => slot.scheduledAt.slice(0, 10));

  assert.deepEqual(firstDay, Array(5).fill('2026-12-15'));
  assert.deepEqual(secondDay, Array(5).fill('2026-12-16'));
});
