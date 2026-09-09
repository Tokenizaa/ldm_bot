export const BrowserConfig = {
  CDP_HOST: 'localhost',
  CDP_DEFAULT_PORT: 9222,
  CDP_PORT_RANGE: [9222, 9230] as const,
  CONNECTION_TIMEOUT: 10_000,
  PAGE_LOAD_TIMEOUT: 30_000,
  ELEMENT_WAIT_TIMEOUT: 10_000,
  NAVIGATION_TIMEOUT: 30_000,
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2_000,
  FACEBOOK_DOMAIN: 'facebook.com',
  LDM_DOMAIN: 'lojadomecanico.com.br',
  DEFAULT_VIEWPORT: { width: 1920, height: 1080 },
  DEFAULT_HEADERS: {
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    DNT: '1',
    'Upgrade-Insecure-Requests': '1'
  }
} as const;

export type BrowserConfigType = typeof BrowserConfig;
