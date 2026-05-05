export const QueueNames = {
  crawlerQueue: 'crawlerQueue',
  publishQueue: 'publishQueue',
  aiQueue: 'aiQueue',
  analyticsQueue: 'analyticsQueue',
  retryQueue: 'retryQueue',
  deadLetterQueue: 'deadLetterQueue'
} as const;

export type QueueName = typeof QueueNames[keyof typeof QueueNames];

