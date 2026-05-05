// Export all browser modules for easy import

// Legacy modules (mantidos para compatibilidade)
export { default as BrowserHealth } from './browserHealth';
export { default as CDPManager } from './cdpManager';

// NOVO: ForgeDeals Professional Architecture
export { 
  ForgeBrowserManager, 
  forgeBrowser,
  type ForgeBrowserConfig,
  type BrowserHealthStatus,
  type SessionValidationResult 
} from './ForgeBrowserManager';

export { FacebookSessionValidator } from './FacebookSessionValidator';
export { 
  ForgeWorker, 
  type Job, 
  type JobResult 
} from './ForgeWorker';

// Export types (legacy)
export type { HealthStatus } from './browserHealth';
export type { CDPCommand, CDPResponse, TargetInfo } from './cdpManager';
