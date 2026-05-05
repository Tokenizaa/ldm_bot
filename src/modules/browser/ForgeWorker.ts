import { Page, BrowserContext } from 'playwright';
import { ForgeBrowserManager, BrowserHealthStatus } from './ForgeBrowserManager';
import { FacebookSessionValidator } from './FacebookSessionValidator';

/**
 * Worker profissional para automação ForgeDeals
 * Gerencia jobs de forma isolada e segura
 */
export interface Job {
  id: string;
  type: 'scrape' | 'post' | 'validate';
  platform: 'facebook' | 'loja-do-mecanico' | string;
  url?: string;
  data?: Record<string, unknown>;
  priority: 'high' | 'medium' | 'low';
  maxRetries: number;
  timeoutMs: number;
}

export interface JobResult {
  jobId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
  screenshots: string[];
  logs: string[];
  retryCount: number;
}

export class ForgeWorker {
  private browserManager: ForgeBrowserManager;
  private fbValidator: FacebookSessionValidator;
  private currentJob: Job | null = null;
  private isRunning = false;
  private jobLock = false;

  constructor() {
    this.browserManager = ForgeBrowserManager.getInstance();
    this.fbValidator = new FacebookSessionValidator();
  }

  /**
   * Inicializa worker e conecta ao browser
   */
  async initialize(): Promise<void> {
    console.log('🚀 Inicializando ForgeWorker...');
    
    // Conectar ao Chrome CDP
    const { page } = await this.browserManager.connect();
    
    // Configurar validador
    this.fbValidator.setPage(page);
    
    // Validar sessão Facebook
    console.log('🔍 Validando sessão Facebook...');
    const session = await this.fbValidator.validate();
    
    if (!session.isValid) {
      throw new Error(`Sessão Facebook inválida: ${session.issues?.join(', ')}`);
    }
    
    console.log('✅ ForgeWorker inicializado');
    console.log(`   👤 Usuário: ${session.userInfo?.name || 'N/A'}`);
  }

  /**
   * Executa um job de forma segura
   */
  async executeJob(job: Job): Promise<JobResult> {
    if (this.jobLock) {
      throw new Error('Job já em execução');
    }

    this.jobLock = true;
    this.currentJob = job;
    
    const startTime = Date.now();
    const screenshots: string[] = [];
    const logs: string[] = [];
    let retryCount = 0;

    console.log(`▶️ Iniciando job ${job.id} (${job.type})`);

    try {
      // Aguardar browser saudável
      await this.browserManager.waitForHealthy(10000);
      
      const { page } = this.browserManager.getInstances();
      if (!page) {
        throw new Error('Página não disponível');
      }

      // Executar job com retry
      let result: unknown;
      let success = false;
      let error: string | undefined;

      while (retryCount <= job.maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`🔄 Retry ${retryCount}/${job.maxRetries}...`);
            await new Promise(r => setTimeout(r, 2000 * retryCount));
          }

          result = await this.runJobLogic(job, page);
          success = true;
          break;

        } catch (err) {
          error = err instanceof Error ? err.message : String(err);
          console.error(`❌ Tentativa ${retryCount + 1} falhou:`, error);
          
          // Tirar screenshot do erro
          try {
            const ss = await this.browserManager.takeScreenshot(`error-${job.id}-retry${retryCount}`);
            screenshots.push(ss);
          } catch {
            // Ignora erro de screenshot
          }

          retryCount++;
          
          if (retryCount > job.maxRetries) {
            throw err;
          }
        }
      }

      const duration = Date.now() - startTime;

      console.log(`✅ Job ${job.id} concluído em ${duration}ms`);

      return {
        jobId: job.id,
        success,
        data: result,
        error: success ? undefined : error,
        duration,
        screenshots,
        logs,
        retryCount: retryCount - 1
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Job ${job.id} falhou:`, errorMsg);

      return {
        jobId: job.id,
        success: false,
        error: errorMsg,
        duration,
        screenshots,
        logs,
        retryCount
      };

    } finally {
      this.jobLock = false;
      this.currentJob = null;
    }
  }

  /**
   * Lógica específica de cada tipo de job
   */
  private async runJobLogic(job: Job, page: Page): Promise<unknown> {
    switch (job.type) {
      case 'scrape':
        return this.runScrapeJob(job, page);
      
      case 'post':
        return this.runPostJob(job, page);
      
      case 'validate':
        return this.runValidateJob(job, page);
      
      default:
        throw new Error(`Tipo de job desconhecido: ${job.type}`);
    }
  }

  /**
   * Job de scraping
   */
  private async runScrapeJob(job: Job, page: Page): Promise<unknown> {
    if (!job.url) {
      throw new Error('URL não fornecida para job de scrape');
    }

    console.log(`🔍 Scraping: ${job.url}`);
    
    await page.goto(job.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Extrair dados básicos
    const data = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
    });

    return data;
  }

  /**
   * Job de postagem
   */
  private async runPostJob(job: Job, page: Page): Promise<unknown> {
    if (!job.url) {
      throw new Error('URL não fornecida para job de post');
    }

    console.log(`📝 Postando em: ${job.url}`);
    
    // Validar acesso ao grupo
    const groupAccess = await this.fbValidator.validateGroupAccess(job.url);
    
    if (!groupAccess.accessible) {
      throw new Error(`Grupo não acessível: ${groupAccess.issues?.join(', ')}`);
    }
    
    if (!groupAccess.canPost) {
      throw new Error('Não é possível postar neste grupo');
    }

    // Implementar lógica de postagem aqui
    // Por enquanto, apenas retorna informações do grupo
    return {
      groupAccess,
      message: 'Postagem simulada - implementar lógica real'
    };
  }

  /**
   * Job de validação
   */
  private async runValidateJob(job: Job, page: Page): Promise<unknown> {
    console.log('🔍 Executando validações...');
    
    const validations = {
      facebook: await this.fbValidator.validate(),
      health: this.browserManager.getHealthStatus(),
      blocks: await this.fbValidator.checkForBlocks()
    };

    return validations;
  }

  /**
   * Obtém status atual
   */
  getStatus(): {
    isRunning: boolean;
    hasJobLock: boolean;
    currentJob: Job | null;
    health: BrowserHealthStatus | null;
  } {
    return {
      isRunning: this.isRunning,
      hasJobLock: this.jobLock,
      currentJob: this.currentJob,
      health: this.browserManager.getHealthStatus()
    };
  }

  /**
   * Para o worker
   */
  async stop(): Promise<void> {
    console.log('🛑 Parando ForgeWorker...');
    this.isRunning = false;
    await this.browserManager.disconnect();
    console.log('✅ ForgeWorker parado');
  }
}
