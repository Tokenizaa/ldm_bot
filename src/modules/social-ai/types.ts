export interface SocialPost {
  id: string;
  content: string;
  variationType: 'offer' | 'question' | 'review' | 'comparison' | 'opinion' | 'alert' | 'discussion' | 'experience' | 'video';
  groupId: string;
  status: 'pending' | 'generated' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed' | 'spam_risk' | 'cooldown' | 'manual_review';
  spamRiskScore?: {
    score: number;
    classification: 'safe' | 'moderate' | 'high';
    reasons: string[];
  };
  scheduledTime?: Date;
  publishedTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    links: string[];
    images: string[];
    videos?: string[];
    hashtags: string[];
    mentions: string[];
    productIds: string[];
    opportunityScore?: number;
    groupId: string;
    estimatedEngagement?: number;
  };
  analytics: {
    reach?: number;
    engagement?: number;
    clicks?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    ctr?: number;
  };
  aiGenerated: boolean;
  aiModel?: string;
  humanReviewed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface SocialGroup {
  id: string;
  name: string;
  platform: 'facebook' | 'instagram' | 'telegram';
  memberCount: number;
  category: string;
  lastPostTime?: Date;
  cooldownUntil?: Date;
  postingFrequency: 'low' | 'medium' | 'high';
  engagementRate: number;
  isActive: boolean;
  rules: {
    maxPostsPerDay: number;
    minCooldownHours: number;
    allowedContentTypes: string[];
    restrictedContent: string[];
  };
}

export interface SocialCalendar {
  id: string;
  date: Date;
  posts: ScheduledPost[];
  status: 'draft' | 'approved' | 'active' | 'completed';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledPost {
  id: string;
  post: SocialPost;
  scheduledTime: Date;
  priority: 'high' | 'medium' | 'low';
  window: string;
  estimatedEngagement: number;
  spamRiskScore: number;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  actualPublishTime?: Date;
  actualEngagement?: number;
}

export interface SocialAnalytics {
  date: string;
  postsPublished: number;
  totalReach: number;
  totalEngagement: number;
  totalClicks: number;
  averageCTR: number;
  topPerformingPosts: SocialPost[];
  bestPostingTimes: number[];
  groupPerformance: Array<{
    groupId: string;
    groupName: string;
    posts: number;
    engagement: number;
    reach: number;
    ctr: number;
  }>;
  contentPerformance: Array<{
    contentType: string;
    posts: number;
    avgEngagement: number;
    avgCTR: number;
    avgReach: number;
  }>;
  spamMetrics: {
    averageRiskScore: number;
    postsRejected: number;
    postsApproved: number;
    cooldownHits: number;
    spamViolations: number;
  };
  aiMetrics: {
    totalGenerated: number;
    averageGenerationTime: number;
    modelUsage: Record<string, number>;
    rewriteRate: number;
    approvalRate: number;
  };
}

export interface ContentAgent {
  id: string;
  name: string;
  type: 'offer' | 'community' | 'video' | 'rewriter' | 'spam' | 'scheduler';
  model: string;
  status: 'active' | 'inactive' | 'error';
  lastUsed: Date;
  totalGenerations: number;
  successRate: number;
  averageResponseTime: number;
  config: Record<string, any>;
}

export interface DragDropItem {
  id: string;
  type: 'post' | 'template' | 'draft';
  content: string;
  metadata: any;
  index: number;
}

export interface CalendarView {
  view: 'month' | 'week' | 'day';
  currentDate: Date;
  selectedDate?: Date;
  posts: SocialPost[];
  templates: SocialPost[];
  filters: {
    status: string[];
    contentType: string[];
    groups: string[];
    priority: string[];
  };
}

export interface FacebookPublisher {
  id: string;
  status: 'idle' | 'connecting' | 'connected' | 'posting' | 'error';
  currentPost?: SocialPost;
  progress: {
    step: string;
    percentage: number;
    message: string;
  };
  lastActivity: Date;
  totalPosts: number;
  successRate: number;
  errors: string[];
}

export interface OllamaStatus {
  available: boolean;
  models: string[];
  defaultModel: string;
  lastCheck: Date;
  responseTime: number;
  errors: string[];
}

export interface SocialQueue {
  id: string;
  posts: SocialPost[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  processedAt?: Date;
  results: Array<{
    postId: string;
    success: boolean;
    error?: string;
    publishedAt?: Date;
    engagement?: number;
  }>;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: SocialPost['variationType'];
  template: string;
  variables: string[];
  examples: string[];
  usage: number;
  success: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementMetrics {
  postId: string;
  timestamp: Date;
  type: 'like' | 'comment' | 'share' | 'click' | 'view';
  value: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SocialCommand {
  id: string;
  type: 'generate' | 'schedule' | 'publish' | 'analyze' | 'optimize';
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  executionTime?: number;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  events: {
    postPublished: boolean;
    postFailed: boolean;
    highSpamRisk: boolean;
    lowEngagement: boolean;
    scheduledPost: boolean;
    aiGenerated: boolean;
  };
}

export interface UserPreferences {
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  defaultModel: string;
  autoApprove: boolean;
  notifications: NotificationSettings;
  dashboardLayout: {
    widgets: string[];
    order: string[];
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: {
    ollama: 'online' | 'offline' | 'error';
    database: 'online' | 'offline' | 'error';
    scheduler: 'online' | 'offline' | 'error';
    publisher: 'online' | 'offline' | 'error';
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    queueSize: number;
    activeUsers: number;
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    service: string;
  }>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
