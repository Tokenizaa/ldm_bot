import { LojaDoMecanicoCrawler, runLojaDoMecanicoCrawler } from '../crawlers/LojaDoMecanicoCrawler';
import { affiliateLinkService } from '../services/affiliateLinkService';

export interface CrawlerWorkerConfig {
  intervalMinutes: number;
  autoStart: boolean;
  headless: boolean;
}

export class CrawlerWorker {
  private interval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private config: CrawlerWorkerConfig;
  private stats: {
    lastRun: Date | null;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastError: string | null;
  } = {
    lastRun: null,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    lastError: null
  };

  constructor(config: CrawlerWorkerConfig) {
    this.config = {
      intervalMinutes: 30, // Default: 30 minutos
      autoStart: false,
      headless: true,
      ...config
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Crawler worker já está em execução');
      return;
    }

    console.log('🚀 Iniciando crawler worker...');
    this.isRunning = true;

    // Executar imediatamente se autoStart
    if (this.config.autoStart) {
      await this.runCrawler();
    }

    // Configurar execução periódica
    this.interval = setInterval(async () => {
      if (this.isRunning) {
        await this.runCrawler();
      }
    }, this.config.intervalMinutes * 60 * 1000);

    console.log(`✅ Crawler worker iniciado - Executando a cada ${this.config.intervalMinutes} minutos`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Crawler worker não está em execução');
      return;
    }

    console.log('🛑 Parando crawler worker...');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('✅ Crawler worker parado');
  }

  private async runCrawler(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Executando crawler...');
      this.stats.lastRun = new Date();
      this.stats.totalRuns++;

      try {
        const result = await runLojaDoMecanicoCrawler();
        
        if (result.success) {
          this.stats.successfulRuns++;
          this.stats.lastError = null;
          console.log(`✅ Crawler executado com sucesso - ${result.products.length} produtos processados`);
        } else {
          this.stats.failedRuns++;
          this.stats.lastError = result.error || 'Erro desconhecido';
          console.error(`❌ Crawler falhou: ${this.stats.lastError}`);
        }

      } catch (error) {
        this.stats.failedRuns++;
        this.stats.lastError = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`❌ Erro na execução do crawler: ${this.stats.lastError}`);
      }
    }
  }

  async runOnce(): Promise<void> {
    console.log('🔥 Executando crawler manualmente...');
    await this.runCrawler();
  }

  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      intervalMinutes: this.config.intervalMinutes,
      successRate: this.stats.totalRuns > 0 
        ? (this.stats.successfulRuns / this.stats.totalRuns) * 100 
        : 0
    };
  }

  async getStatus(): Promise<{
    status: 'running' | 'stopped' | 'error';
    lastRun: Date | null;
    nextRun: Date | null;
    stats: typeof this.stats;
  }> {
    const nextRun = this.isRunning && this.interval && this.stats.lastRun
      ? new Date(this.stats.lastRun.getTime() + this.config.intervalMinutes * 60 * 1000)
      : null;

    return {
      status: this.isRunning ? 'running' : 'stopped',
      lastRun: this.stats.lastRun,
      nextRun,
      stats: this.stats
    };
  }

  async updateConfig(newConfig: Partial<CrawlerWorkerConfig>): Promise<void> {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      await this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning) {
      await this.start();
    }

    console.log('⚙️ Configuração do crawler atualizada');
  }
}

// Worker singleton global
let crawlerWorker: CrawlerWorker | null = null;

export function getCrawlerWorker(): CrawlerWorker {
  if (!crawlerWorker) {
    crawlerWorker = new CrawlerWorker({
      intervalMinutes: 30,
      autoStart: false,
      headless: process.env.NODE_ENV === 'production'
    });
  }
  return crawlerWorker;
}

// API endpoint para controle do crawler
export async function startCrawlerWorker(): Promise<void> {
  const worker = getCrawlerWorker();
  await worker.start();
}

export async function stopCrawlerWorker(): Promise<void> {
  const worker = getCrawlerWorker();
  await worker.stop();
}

export async function runCrawlerOnce(): Promise<{ success: boolean; products: AffiliateLink[]; error?: string }> {
  const worker = getCrawlerWorker();
  await worker.runOnce();
  // Return dummy result for now
  return { success: true, products: [], error: undefined };
}

export async function getCrawlerStatus() {
  const worker = getCrawlerWorker();
  return await worker.getStatus();
}

export async function getCrawlerStats() {
  const worker = getCrawlerWorker();
  return worker.getStats();
}
