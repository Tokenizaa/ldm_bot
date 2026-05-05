export const JobNames = {
  crawlProduct: 'crawl-product',
  publishFacebook: 'publish-facebook'
} as const;

export type JobName = typeof JobNames[keyof typeof JobNames];

