export interface FacebookConfig {
  postsPerDay: number;
  delayBetweenPosts: number; // minutos
  activeHours: number[];
  activeGroups: Array<{
    id: string;
    name: string;
    limit: number;
    active: boolean;
  }>;
  defaultCTA: string;
  mode: 'safe' | 'aggressive';
  humanizationLevel: number;
}

export interface OllamaConfig {
  activeModel: string;
  temperature: number;
  maxTokens: number;
  copyStyle: 'casual' | 'professional' | 'enthusiastic' | 'educational';
  useEmojis: boolean;
  includeCTA: boolean;
  writingTone: 'direct' | 'friendly' | 'technical' | 'promotional';
}

export interface CrawlerConfig {
  email?: string;
  password?: string;
  activeCategories: Array<{
    id: string;
    name: string;
    url: string;
    priority: number;
  }>;
  maxProducts: number;
  scrapingDelay: number;
  minScore: number;
  priorityCategories: string[];
}

export interface PlanningConfig {
  promotionalPosts: number;
  educationalPosts: number;
  engagementPosts: number;
  institutionalPosts: number;
  totalDailyPosts: number;
  rotationStrategy: 'balanced' | 'promotion-focused' | 'engagement-focused';
}

export interface SystemConfig {
  facebook: FacebookConfig;
  ollama: OllamaConfig;
  crawler: CrawlerConfig;
  planning: PlanningConfig;
  system: {
    autoStart: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    backupEnabled: boolean;
    emergencyStop: boolean;
    cdpPort: number;
  };
}

export const DEFAULT_CONFIG: SystemConfig = {
  facebook: {
    postsPerDay: 10,
    delayBetweenPosts: 120,
    activeHours: [9, 13, 17, 20],
    activeGroups: [
      { id: '792906181765134', name: 'A Loja Do Mecânico', limit: 5, active: true }
    ],
    defaultCTA: 'Confira esta oferta! 👉',
    mode: 'safe',
    humanizationLevel: 75
  },
  ollama: {
    activeModel: 'llama3:8b',
    temperature: 0.7,
    maxTokens: 150,
    copyStyle: 'enthusiastic',
    useEmojis: true,
    includeCTA: true,
    writingTone: 'promotional'
  },
  crawler: {
    activeCategories: [
      { id: 'maquinas-eletricas', name: 'Ferramentas Elétricas', url: 'https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas', priority: 1 },
      { id: 'ferramentas-manuais', name: 'Ferramentas Manuais', url: 'https://www.lojadomecanico.com.br/categorias/2/ferramentas-manuais-para-oficinas', priority: 2 }
    ],
    maxProducts: 10,
    scrapingDelay: 2,
    minScore: 30,
    priorityCategories: ['maquinas-eletricas']
  },
  planning: {
    promotionalPosts: 4,
    educationalPosts: 3,
    engagementPosts: 2,
    institutionalPosts: 1,
    totalDailyPosts: 10,
    rotationStrategy: 'balanced'
  },
  system: {
    autoStart: false,
    logLevel: 'info',
    backupEnabled: true,
    emergencyStop: true,
    cdpPort: 9222
  }
};
