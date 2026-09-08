export const BrowserConfig = {
  // Configuração CDP
  CDP_HOST: 'localhost',
  CDP_DEFAULT_PORT: 9222,
  CDP_PORT_RANGE: [9222, 9230],

  // Timeouts
  CONNECTION_TIMEOUT: 10000,
  PAGE_LOAD_TIMEOUT: 30000,
  ELEMENT_WAIT_TIMEOUT: 10000,
  NAVIGATION_TIMEOUT: 30000,

  // Reconexão
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
  HEALTH_CHECK_INTERVAL: 5000,

  // Abas
  MAX_TABS: 10,
  TAB_CLEANUP_THRESHOLD: 8,

  // Sessões
  FACEBOOK_DOMAIN: 'facebook.com',
  LDM_DOMAIN: 'lojadomecanico.com.br',

  // User Agents
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Viewport
  DEFAULT_VIEWPORT: {
    width: 1920,
    height: 1080
  },

  // Headers
  DEFAULT_HEADERS: {
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
};

export type BrowserConfigType = typeof BrowserConfig;

