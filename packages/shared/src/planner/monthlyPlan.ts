export const MONTHLY_POST_TIMES = ['09:00', '11:00', '14:00', '17:00', '20:00'] as const;
export const MONTHLY_POSTS_PER_DAY = MONTHLY_POST_TIMES.length;
export const MONTHLY_PLAN_DAYS = 30;
export const MONTHLY_PLAN_TOTAL_POSTS = MONTHLY_PLAN_DAYS * MONTHLY_POSTS_PER_DAY;
export const MONTHLY_PLAN_TIMEZONE = 'America/Sao_Paulo';

export type MonthlyPostType = 'promotion';

export interface MonthlyPlanSlot {
  slotIndex: number;
  dayOffset: number;
  scheduledAt: string;
  postType: MonthlyPostType;
}

/**
 * Brazil/Sao_Paulo is UTC-03:00 for the current business rule (no DST).
 * Build timestamps explicitly in UTC instead of relying on the API server's
 * local timezone, which could differ between development and production.
 */
export function buildMonthlySlots(periodStart: Date): MonthlyPlanSlot[] {
  const slots: MonthlyPlanSlot[] = [];
  const startYear = periodStart.getUTCFullYear();
  const startMonth = periodStart.getUTCMonth();
  const startDay = periodStart.getUTCDate();

  for (let dayOffset = 0; dayOffset < MONTHLY_PLAN_DAYS; dayOffset += 1) {
    const date = new Date(Date.UTC(startYear, startMonth, startDay + dayOffset));

    for (let slot = 0; slot < MONTHLY_POSTS_PER_DAY; slot += 1) {
      const time = MONTHLY_POST_TIMES[slot];
      if (!time) throw new Error(`Horário de slot inválido no índice ${slot}`);
      const [hourValue, minuteValue] = time.split(':').map(Number);
      if (hourValue === undefined || minuteValue === undefined) throw new Error(`Horário de slot inválido: ${time}`);
      // Sao Paulo 09:00 local == 12:00 UTC under the project's fixed UTC-03 rule.
      const scheduledAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hourValue + 3, minuteValue, 0, 0));
      slots.push({ slotIndex: dayOffset * MONTHLY_POSTS_PER_DAY + slot + 1, dayOffset, scheduledAt: scheduledAt.toISOString(), postType: 'promotion' });
    }
  }
  return slots;
}
