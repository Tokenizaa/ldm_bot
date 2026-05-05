export { JobNames } from '@forge-deals/shared/jobs';
export type { JobName } from '@forge-deals/shared/jobs';

export type CrawlProductJob = {
  source: 'lojadomecanico';
  categoryUrl?: string;
};

export type PublishFacebookJob = {
  groupId: string;
  post: {
    id: string;
    content: string;
    links?: string[];
  };
};
