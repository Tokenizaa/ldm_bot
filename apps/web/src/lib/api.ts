const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

export const api = {
  getConfig: () => request<{ success: boolean; data: any }>('/config'),
  saveConfig: (config: any) => request<{ success: boolean; data: any }>('/config', { method: 'PUT', body: JSON.stringify(config) }),
  updateConfig: (partial: any) => request<{ success: boolean; data: any }>('/config', { method: 'PATCH', body: JSON.stringify(partial) }),
  getDefaults: () => request<{ success: boolean; data: any }>('/config/defaults'),
  runCrawler: () => request<{ success: boolean; data: any }>('/crawler/run', { method: 'POST' }),
  getCategories: () => request<{ success: boolean; data: any }>('/crawler/categories'),
  testCategory: (url: string) => request<{ success: boolean; data: any }>('/crawler/test-category', { method: 'POST', body: JSON.stringify({ url }) }),
  getGroups: () => request<{ success: boolean; data: any }>('/facebook/groups'),
  publishToFacebook: (content: { text: string; link: string; imageUrl?: string }, groupName: string) => request<{ success: boolean; data: any }>('/facebook/publish', { method: 'POST', body: JSON.stringify({ content, groupName }) }),
  testFacebookConnection: () => request<{ success: boolean; data: any }>('/facebook/test-connection', { method: 'POST' }),
  getModels: () => request<{ success: boolean; data: string[] }>('/ollama/models'),
  generateCopy: (product: any) => request<{ success: boolean; data: any }>('/ollama/generate', { method: 'POST', body: JSON.stringify({ product }) }),
  testOllama: () => request<{ success: boolean; data: any }>('/ollama/test', { method: 'POST' }),
  getOverview: () => request<{ success: boolean; data: any }>('/analytics/overview'),
  getProductsAnalytics: () => request<{ success: boolean; data: any }>('/analytics/products'),
  getOperational: () => request<{ success: boolean; data: any }>('/analytics/operational'),

  // Monthly planner
  listMonthlyPlans: (limit = 12) => request<{ success: boolean; data: MonthlyPlan[] }>(`/monthly-plans?limit=${limit}`),
  getMonthlyPlan: (id: string) => request<{ success: boolean; data: MonthlyPlan }>(`/monthly-plans/${id}`),
  createMonthlyPlan: (periodStart: string, groupId?: string, groupName?: string) => request<{ success: boolean; data: MonthlyPlan }>(`/monthly-plans`, {
    method: 'POST',
    body: JSON.stringify({ periodStart, ...(groupId ? { groupId } : {}), ...(groupName ? { groupName } : {}) })
  }),
  fillMonthlyPlan: (id: string) => request<{ success: boolean; data: MonthlyPlan }>(`/monthly-plans/${id}/fill`, { method: 'POST' }),
  generateMonthlyPlan: (id: string) => request<{ success: boolean; data: MonthlyPlan }>(`/monthly-plans/${id}/generate`, { method: 'POST' }),
  scheduleMonthlyPlanFacebook: (id: string) => request<{ success: boolean; data: MonthlyPlan }>(`/monthly-plans/${id}/schedule-facebook`, { method: 'POST' })
};

export type MonthlyPost = {
  id: string;
  plan_id: string;
  group_id: string;
  group_name: string;
  content: string;
  link: string | null;
  image_url: string | null;
  scheduled_at: string;
  status: string;
  affiliate_link_id: string | null;
  slot_index: number;
  post_type: string;
  attempts: number;
  published_at?: string | null;
  facebook_post_id?: string | null;
  facebook_permalink?: string | null;
  last_error?: string | null;
};

export type MonthlyPlan = {
  id: string;
  period_start: string;
  period_end: string;
  timezone: string;
  posts_per_day: number;
  total_posts: number;
  status: string;
  created_at: string;
  updated_at?: string;
  posts?: MonthlyPost[];
};

export type SystemConfig = {
  facebook: {
    postsPerDay: number;
    delayBetweenPosts: number;
    activeHours: number[];
    activeGroups: Array<{ id: string; name: string; limit: number; active: boolean }>;
    defaultCTA: string;
    mode: 'safe' | 'aggressive';
    humanizationLevel: number;
  };
  ollama: {
    activeModel: string;
    temperature: number;
    maxTokens: number;
    copyStyle: 'casual' | 'professional' | 'enthusiastic' | 'educational';
    useEmojis: boolean;
    includeCTA: boolean;
    writingTone: 'direct' | 'friendly' | 'technical' | 'promotional';
  };
  crawler: {
    activeCategories: Array<{ id: string; name: string; url: string; priority: number }>;
    maxProducts: number;
    scrapingDelay: number;
    minScore: number;
    priorityCategories: string[];
  };
  planning: {
    promotionalPosts: number;
    educationalPosts: number;
    engagementPosts: number;
    institutionalPosts: number;
    totalDailyPosts: number;
    rotationStrategy: 'balanced' | 'promotion-focused' | 'engagement-focused';
  };
  system: {
    autoStart: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    backupEnabled: boolean;
    emergencyStop: boolean;
    cdpPort: number;
  };
};