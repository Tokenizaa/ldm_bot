const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  // Config
  getConfig: () => request<{ success: boolean; data: any }>('/config'),
  saveConfig: (config: any) => request<{ success: boolean; data: any }>('/config', {
    method: 'PUT',
    body: JSON.stringify(config)
  }),
  updateConfig: (partial: any) => request<{ success: boolean; data: any }>('/config', {
    method: 'PATCH',
    body: JSON.stringify(partial)
  }),
  getDefaults: () => request<{ success: boolean; data: any }>('/config/defaults'),

  // Crawler
  runCrawler: () => request<{ success: boolean; data: any }>('/crawler/run', { method: 'POST' }),
  getCategories: () => request<{ success: boolean; data: any }>('/crawler/categories'),
  testCategory: (url: string) => request<{ success: boolean; data: any }>('/crawler/test-category', {
    method: 'POST',
    body: JSON.stringify({ url })
  }),

  // Facebook
  getGroups: () => request<{ success: boolean; data: any }>('/facebook/groups'),
  publishToFacebook: (content: { text: string; link: string; imageUrl?: string }, groupName: string) => 
    request<{ success: boolean; data: any }>('/facebook/publish', {
      method: 'POST',
      body: JSON.stringify({ content, groupName })
    }),
  testFacebookConnection: () => request<{ success: boolean; data: any }>('/facebook/test-connection', { method: 'POST' }),

  // Ollama
  getModels: () => request<{ success: boolean; data: string[] }>('/ollama/models'),
  generateCopy: (product: any) => request<{ success: boolean; data: any }>('/ollama/generate', {
    method: 'POST',
    body: JSON.stringify({ product })
  }),
  testOllama: () => request<{ success: boolean; data: any }>('/ollama/test', { method: 'POST' }),

  // Analytics
  getOverview: () => request<{ success: boolean; data: any }>('/analytics/overview'),
  getProductsAnalytics: () => request<{ success: boolean; data: any }>('/analytics/products'),
  getOperational: () => request<{ success: boolean; data: any }>('/analytics/operational')
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