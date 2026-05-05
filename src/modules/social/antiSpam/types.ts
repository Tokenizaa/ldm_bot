export interface SpamRiskFactors {
  textRepetition: number; // 0-1
  ctaRepetition: number; // 0-1
  emojiOveruse: number; // count
  domainRepetition: number; // 0-1
  timePattern: number; // 0-1
  hashtagRepetition: number; // count
  accountFrequency: number; // posts per day
  linkCount: number; // count
  consecutivePromos: number; // count
  humanBehaviorScore: number; // -100 to 100
}

export interface SpamRiskScore {
  score: number; // 0-100
  classification: 'safe' | 'moderate' | 'high';
  factors: SpamRiskFactors;
  recommendations: string[];
}

export interface AntiSpamConfig {
  frequency: {
    maxPostsPerDay: number;
    minCooldownMinutes: number;
    idealCooldownMinutes: number;
    groupCooldownHours: number;
    safeGroupCooldownHours: number;
  };
  duplicate: {
    textSimilarityThreshold: number;
    ctaSimilarityThreshold: number;
    maxConsecutiveSimilar: number;
  };
  variation: {
    enabled: boolean;
    variationTypes: string[];
    minDifferencePercent: number;
  };
  links: {
    maxLinksPerPost: number;
    domainRepetitionThreshold: number;
    allowedDomains: string[];
  };
  human: {
    typingSpeedVariation: boolean;
    mouseMovementSimulation: boolean;
    randomDelays: boolean;
    scrollSimulation: boolean;
  };
}

export interface FrequencyCheck {
  canPost: boolean;
  timeUntil?: number; // minutes
  postsToday: number;
  maxPostsPerDay: number;
}

export interface GroupCooldown {
  cooldownActive: boolean;
  timeUntil?: number; // minutes
  lastPostTime?: Date;
  nextAvailableTime?: Date;
}

export interface ContentVariation {
  original: string;
  variation: string;
  variationType: 'offer' | 'question' | 'review' | 'comparison' | 'opinion' | 'alert' | 'discussion' | 'experience';
  differenceScore: number; // 0-1
}

export interface HumanBehaviorMetrics {
  typingSpeed: number; // wpm
  pauseFrequency: number; // pauses per minute
  mouseMovements: number; // movements per minute
  scrollSpeed: number; // pixels per second
  randomDelays: number; // average delay in ms
}

export interface SocialPost {
  id: string;
  content: string;
  variationType: string;
  groupId: string;
  status: 'pending' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'spam_risk' | 'cooldown' | 'manual_review';
  spamRiskScore?: SpamRiskScore;
  scheduledTime?: Date;
  publishedTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    links: string[];
    images: string[];
    hashtags: string[];
    mentions: string[];
    productIds: string[];
  };
  analytics: {
    reach?: number;
    engagement?: number;
    clicks?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
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
  }>;
  spamMetrics: {
    averageRiskScore: number;
    postsRejected: number;
    postsApproved: number;
    cooldownHits: number;
  };
}
