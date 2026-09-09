import type { Product } from '@forge-deals/shared/types';

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
  product: Product;
}

/**
 * Cria os 150 horários do plano. A seleção dos produtos acontece separadamente,
 * permitindo aplicar score e histórico sem misturar regras de calendário.
 */
export function buildMonthlySlots(periodStart: Date): Array<Omit<MonthlyPlanSlot, 'product'>> {
  const slots: Array<Omit<MonthlyPlanSlot, 'product'>> = [];

  for (let dayOffset = 0; dayOffset < MONTHLY_PLAN_DAYS; dayOffset += 1) {
    for (let slot = 0; slot < MONTHLY_POSTS_PER_DAY; slot += 1) {
      const [hour, minute] = MONTHLY_POST_TIMES[slot].split(':').map(Number);
      const scheduledAt = new Date(periodStart);
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
      scheduledAt.setHours(hour, minute, 0, 0);

      slots.push({
        slotIndex: dayOffset * MONTHLY_POSTS_PER_DAY + slot + 1,
        dayOffset,
        scheduledAt: scheduledAt.toISOString(),
        postType: 'promotion'
      });
    }
  }

  return slots;
}
