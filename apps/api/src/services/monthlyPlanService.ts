import { getSupabaseAdmin } from './supabaseAdmin.js';
import {
  buildMonthlySlots,
  MONTHLY_PLAN_DAYS,
  MONTHLY_PLAN_TIMEZONE,
  MONTHLY_PLAN_TOTAL_POSTS,
  MONTHLY_POSTS_PER_DAY
} from '@forge-deals/shared';

const DEFAULT_GROUP_ID = '792906181765134';
const DEFAULT_GROUP_NAME = 'A Loja Do Mecânico';

export interface CreateMonthlyPlanInput {
  periodStart: string;
  groupId?: string;
  groupName?: string;
}

export async function createMonthlyPlan(input: CreateMonthlyPlanInput) {
  const periodStart = new Date(input.periodStart);
  if (Number.isNaN(periodStart.getTime())) throw new Error('periodStart inválido');

  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + MONTHLY_PLAN_DAYS - 1);

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('period_start', periodStart.toISOString().slice(0, 10))
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data: plan, error: planError } = await supabase
    .from('monthly_plans')
    .insert({
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      timezone: MONTHLY_PLAN_TIMEZONE,
      posts_per_day: MONTHLY_POSTS_PER_DAY,
      total_posts: MONTHLY_PLAN_TOTAL_POSTS,
      status: 'draft'
    })
    .select('*')
    .single();

  if (planError) throw planError;

  const slots = buildMonthlySlots(periodStart);
  const rows = slots.map((slot) => ({
    plan_id: plan.id,
    group_id: input.groupId ?? DEFAULT_GROUP_ID,
    group_name: input.groupName ?? DEFAULT_GROUP_NAME,
    content: '',
    link: null,
    image_url: null,
    scheduled_at: slot.scheduledAt,
    status: 'draft',
    affiliate_link_id: null,
    slot_index: slot.slotIndex,
    post_type: slot.postType,
    attempts: 0
  }));

  const { error: postsError } = await supabase.from('posts').insert(rows);
  if (postsError) throw postsError;

  return plan;
}

export async function getMonthlyPlan(planId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*, posts(*)')
    .eq('id', planId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
