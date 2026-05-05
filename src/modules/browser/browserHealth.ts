import { BrowserConfig } from './browserConfig';
import ChromeConnector from './chromeConnector';
import PortDetector from './portDetector';

export interface HealthStatus {
  isChromeRunning: boolean;
  isCDPAvailable: boolean;
  isConnected: boolean;
  uptime: number;
  memoryUsage: number;
  tabsCount: number;
  lastCheck: Date;
  errors: string[];
}

export class BrowserHealth {
  private static instance: BrowserHealth;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private connector: ChromeConnector;
  private startTime: Date = new Date();
  private status: HealthStatus;

  private constructor() {
    this.connector = ChromeConnector.getInstance();
    this.status = this.initializeStatus();
  }

  static getInstance(): BrowserHealth {
    if (!BrowserHealth.instance) {
      BrowserHealth.instance = new BrowserHealth();
    }
    return BrowserHealth.instance;
  }

  private initializeStatus(): HealthStatus {
    return {
      isChromeRunning: false,
      isCDPAvailable: false,
      isConnected: false,
      uptime: 0,
      memoryUsage: 0,
      tabsCount: 0,
      lastCheck: new Date(),
      errors: []
    };
  }

  async startMonitoring(): Promise<void> {
    console.log('🏥 Iniciando monitoramento de saúde do browser...');
    
    // Parar monitoramento anterior se existir
    this.stopMonitoring();
    
    // Executar check imediato
    await this.performHealthCheck();
    
    // Iniciar checks periódicos
    this.healthCheckInterval = setInterval(
      async () => await this.performHealthCheck(),
      BrowserConfig.HEALTH_CHECK_INTERVAL
    );
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🛑 Monitoramento de saúde parado');
    }
  }

  async performHealthCheck(): Promise<HealthStatus> {
    const previousStatus = { ...this.status };
    this.status.lastCheck = new Date();
    this.status.errors = [];

    try {
      // 1. Verificar se Chrome está rodando
      await this.checkChromeProcess();
      
      // 2. Verificar disponibilidade CDP
      await this.checkCDPAvailability();
      
      // 3. Verificar conexão Playwright
      await this.checkPlaywrightConnection();
      
      // 4. Obter métricas
      await this.updateMetrics();
      
      // Log de mudanças significativas
      this.logStatusChanges(previousStatus);
      
    } catch (error) {
      this.status.errors.push(error instanceof Error ? error.message : String(error));
      console.error('❌ Erro no health check:', error);
      
      // Tentar reconexão automática
      await this.attemptAutoRecovery();
    }

    return this.status;
  }

  private async checkChromeProcess(): Promise<void> {
    try {
      const portDetector = PortDetector.getInstance();
      const instances = await portDetector.detectCDPInstances();
      
      if (instances.length > 0) {
        this.status.isChromeRunning = true;
        this.status.isCDPAvailable = true;
        console.log(`🌐 Chrome ativo em ${instances.length} porta(s): ${instances.map(i => i.port).join(', ')}`);
      } else {
        this.status.isChromeRunning = false;
        this.status.isCDPAvailable = false;
        throw new Error('Nenhuma instância CDP encontrada');
      }
    } catch (error) {
      this.status.isChromeRunning = false;
      this.status.isCDPAvailable = false;
      throw error;
    }
  }

  private async checkCDPAvailability(): Promise<void> {
    if (!this.status.isChromeRunning) {
      this.status.isCDPAvailable = false;
      return;
    }

    try {
      const portDetector = PortDetector.getInstance();
      const instances = await portDetector.detectCDPInstances();
      
      this.status.isCDPAvailable = instances.length > 0;
      console.log(`🔌 CDP disponível com ${instances.length} instância(s)`);
    } catch (error) {
      this.status.isCDPAvailable = false;
      throw error;
    }
  }

  private async checkPlaywrightConnection(): Promise<void> {
    if (!this.status.isCDPAvailable) {
      this.status.isConnected = false;
      return;
    }

    try {
      const connection = await this.connector.getConnection();
      this.status.isConnected = connection.isConnected;
      console.log(`🎭 Playwright conectado: ${this.status.isConnected}`);
    } catch (error) {
      this.status.isConnected = false;
      throw error;
    }
  }

  private async updateMetrics(): Promise<void> {
    if (!this.status.isConnected) {
      this.status.tabsCount = 0;
      this.status.memoryUsage = 0;
      return;
    }

    try {
      // Contar abas
      const tabs = await this.connector.getTabs();
      this.status.tabsCount = tabs.length;
      
      // Calcular uptime
      this.status.uptime = Date.now() - this.startTime.getTime();
      
      // Memory usage (se disponível via CDP)
      try {
        const currentInstance = this.connector.getCurrentInstance();
        if (currentInstance) {
          const portDetector = PortDetector.getInstance();
          const cdpUrl = portDetector.getCDPUrl(currentInstance);
          const response = await fetch(`${cdpUrl}/json/memory`);
          if (response.ok) {
            const memory = await response.json();
            this.status.memoryUsage = memory.size || 0;
          }
        }
      } catch {
        this.status.memoryUsage = 0;
      }
      
      console.log(`📊 Métricas: ${this.status.tabsCount} abas, ${Math.round(this.status.memoryUsage / 1024 / 1024)}MB`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar métricas:', error);
    }
  }

  private logStatusChanges(previous: HealthStatus): void {
    const changes = [];
    
    if (previous.isChromeRunning !== this.status.isChromeRunning) {
      changes.push(`Chrome: ${previous.isChromeRunning} → ${this.status.isChromeRunning}`);
    }
    
    if (previous.isCDPAvailable !== this.status.isCDPAvailable) {
      changes.push(`CDP: ${previous.isCDPAvailable} → ${this.status.isCDPAvailable}`);
    }
    
    if (previous.isConnected !== this.status.isConnected) {
      changes.push(`Playwright: ${previous.isConnected} → ${this.status.isConnected}`);
    }
    
    if (changes.length > 0) {
      console.log(`🔄 Mudanças de status: ${changes.join(', ')}`);
    }
  }

  private async attemptAutoRecovery(): Promise<void> {
    if (!this.status.isChromeRunning) {
      console.log('🚨 Chrome não está rodando. Inicie manualmente com --remote-debugging-port=9222');
      return;
    }

    if (this.status.isChromeRunning && !this.status.isConnected) {
      console.log('🔄 Tentando reconexão automática...');
      try {
        await this.connector.reconnect();
        console.log('✅ Reconexão automática bem-sucedida');
      } catch (error) {
        console.error('❌ Falha na reconexão automática:', error);
      }
    }
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }

  async waitForHealthy(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      await this.performHealthCheck();
      
      if (this.status.isChromeRunning && this.status.isCDPAvailable && this.status.isConnected) {
        console.log('✅ Browser está saudável');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Browser não ficou saudável em ${timeout}ms`);
  }

  getHealthSummary(): string {
    const { isChromeRunning, isCDPAvailable, isConnected, tabsCount, uptime } = this.status;
    
    const uptimeMinutes = Math.floor(uptime / 60000);
    const status = [
      `Chrome: ${isChromeRunning ? '✅' : '❌'}`,
      `CDP: ${isCDPAvailable ? '✅' : '❌'}`,
      `Playwright: ${isConnected ? '✅' : '❌'}`,
      `Abas: ${tabsCount}`,
      `Uptime: ${uptimeMinutes}min`
    ];
    
    return status.join(' | ');
  }
}

export default BrowserHealth;
