import { AntiSpamConfig, HumanBehaviorMetrics } from './types';

export class HumanBehavior {
  private config: AntiSpamConfig['human'];
  private behaviorHistory: HumanBehaviorMetrics[] = [];

  constructor(config: AntiSpamConfig['human']) {
    this.config = config;
    this.loadBehaviorHistory();
  }

  async simulateHumanBehavior(page: any): Promise<void> {
    if (!this.config.typingSpeedVariation && !this.config.mouseMovementSimulation && !this.config.randomDelays) {
      return;
    }

    try {
      // 1. Simular movimento natural do mouse
      if (this.config.mouseMovementSimulation) {
        await this.simulateMouseMovement(page);
      }

      // 2. Simular digitação humana com variação de velocidade
      if (this.config.typingSpeedVariation) {
        await this.simulateTypingBehavior(page);
      }

      // 3. Adicionar delays aleatórios humanos
      if (this.config.randomDelays) {
        await this.addRandomDelays(page);
      }

      // 4. Simular scroll natural
      if (this.config.scrollSimulation) {
        await this.simulateNaturalScroll(page);
      }

      // 5. Simular pausas de pensamento
      await this.simulateThinkingPauses(page);

      // Registrar métricas
      await this.recordBehaviorMetrics(page);

    } catch (error) {
      console.warn('Erro ao simular comportamento humano:', error);
    }
  }

  private async simulateMouseMovement(page: any): Promise<void> {
    try {
      // Movimento do mouse em padrão aleatório
      const viewport = page.viewportSize();
      if (!viewport) return;

      const movements = [
        { x: Math.random() * viewport.width, y: Math.random() * viewport.height },
        { x: Math.random() * viewport.width, y: Math.random() * viewport.height },
        { x: Math.random() * viewport.width, y: Math.random() * viewport.height }
      ];

      for (const movement of movements) {
        await page.mouse.move(movement.x, movement.y, { steps: 10 });
        await this.randomDelay(100, 500);
      }

      // Movimento suave para elemento alvo (se existir)
      const targetElement = await page.locator('textarea, input[type="text"]').first();
      if (await targetElement.count() > 0) {
        const box = await targetElement.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
        }
      }
    } catch (error) {
      // Ignorar erros de movimento do mouse
    }
  }

  private async simulateTypingBehavior(page: any): Promise<void> {
    try {
      // Simular variação na velocidade de digitação
      const typingSpeed = this.getRandomTypingSpeed(); // WPM
      const avgCharTime = 60000 / (typingSpeed * 5); // ms por caractere

      // Encontrar campo de texto para simular digitação
      const textArea = await page.locator('textarea').first();
      if (await textArea.count() > 0) {
        await textArea.focus();
        
        // Simular digitação de texto de exemplo
        const sampleText = 'Verificando o conteúdo...';
        for (const char of sampleText) {
          await page.keyboard.type(char);
          
          // Variação no tempo de digitação
          const charTime = avgCharTime * this.getRandomSpeedVariation();
          await this.randomDelay(charTime * 0.5, charTime * 1.5);
          
          // Pequena chance de pausa (como se estivesse pensando)
          if (Math.random() < 0.1) {
            await this.randomDelay(500, 2000);
          }
        }
        
        // Limpar texto digitado
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
      }
    } catch (error) {
      // Ignorar erros de digitação
    }
  }

  private async simulateNaturalScroll(page: any): Promise<void> {
    try {
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      
      if (scrollHeight <= viewportHeight) return;

      // Scroll suave e natural
      const scrollSteps = 3;
      const scrollDistance = (scrollHeight - viewportHeight) / scrollSteps;

      for (let i = 0; i < scrollSteps; i++) {
        await page.evaluate((distance) => {
          window.scrollBy({ top: distance, behavior: 'smooth' });
        }, scrollDistance);
        
        await this.randomDelay(1000, 3000); // Pausa para "ler"
      }

      // Scroll de volta para o topo
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

    } catch (error) {
      // Ignorar erros de scroll
    }
  }

  private async addRandomDelays(page: any): Promise<void> {
    // Delays aleatórios entre ações
    await this.randomDelay(200, 1000);
    
    // Pequenos movimentos do mouse durante delays
    if (Math.random() < 0.3) {
      await this.simulateMouseMovement(page);
    }
    
    // Delay adicional
    await this.randomDelay(100, 500);
  }

  private async simulateThinkingPauses(page: any): Promise<void> {
    // Pausas que simulam tempo de pensamento
    const thinkingTimes = [800, 1200, 2000, 3000, 5000];
    const thinkingTime = thinkingTimes[Math.floor(Math.random() * thinkingTimes.length)];
    
    // Durante a pausa, movimentos sutis do mouse
    const mouseMovements = Math.floor(thinkingTime / 1000);
    
    for (let i = 0; i < mouseMovements; i++) {
      await this.randomDelay(800, 1200);
      
      if (Math.random() < 0.4) {
        const viewport = page.viewportSize();
        if (viewport) {
          const x = Math.random() * viewport.width;
          const y = Math.random() * viewport.height;
          await page.mouse.move(x, y, { steps: 5 });
        }
      }
    }
  }

  private getRandomTypingSpeed(): number {
    // Velocidade de digitação humana: 40-80 WPM
    const minSpeed = 40;
    const maxSpeed = 80;
    return Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
  }

  private getRandomSpeedVariation(): number {
    // Variação de velocidade: 0.5x a 1.5x
    return 0.5 + (Math.random() * 1.0);
  }

  private randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async recordBehaviorMetrics(page: any): Promise<void> {
    try {
      const metrics: HumanBehaviorMetrics = {
        typingSpeed: this.getRandomTypingSpeed(),
        pauseFrequency: Math.random() * 5, // 0-5 pausas por minuto
        mouseMovements: Math.floor(Math.random() * 20) + 5, // 5-25 movimentos por minuto
        scrollSpeed: Math.random() * 500 + 100, // 100-600 pixels por segundo
        randomDelays: Math.random() * 1000 + 200 // 200-1200ms médios
      };

      this.behaviorHistory.push(metrics);
      
      // Manter apenas últimas 50 medições
      if (this.behaviorHistory.length > 50) {
        this.behaviorHistory = this.behaviorHistory.slice(-50);
      }

      this.saveBehaviorHistory();
    } catch (error) {
      console.warn('Erro ao registrar métricas de comportamento:', error);
    }
  }

  async analyzeBehavior(metadata: any): Promise<number> {
    // Analisar se o comportamento parece humano
    // Retorna um score de -100 (muito robótico) a 100 (muito humano)
    
    let humanScore = 50; // Base neutra

    // Fator 1: Variação de tempo entre ações
    if (metadata.actionIntervals) {
      const intervals = metadata.actionIntervals;
      const variance = this.calculateVariance(intervals);
      const avgInterval = intervals.reduce((sum: number, val: number) => sum + val, 0) / intervals.length;
      
      // Alta variação é bom (comportamento humano)
      const variationScore = Math.min(50, (variance / avgInterval) * 100);
      humanScore += variationScore;
    }

    // Fator 2: Padrões de mouse
    if (metadata.mouseMovements) {
      const movementPattern = this.analyzeMousePattern(metadata.mouseMovements);
      humanScore += movementPattern;
    }

    // Fator 3: Padrões de digitação
    if (metadata.typingPattern) {
      const typingScore = this.analyzeTypingPattern(metadata.typingPattern);
      humanScore += typingScore;
    }

    return Math.max(-100, Math.min(100, humanScore));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private analyzeMousePattern(mouseMovements: any[]): number {
    // Analisar se os movimentos do mouse parecem naturais
    if (mouseMovements.length < 2) return 0;

    let naturalScore = 0;
    
    // Verificar movimentos não-lineares
    for (let i = 1; i < mouseMovements.length; i++) {
      const prev = mouseMovements[i - 1];
      const curr = mouseMovements[i];
      
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Movimentos muito retos são suspeitos
      if (distance > 50 && (Math.abs(dx) < 5 || Math.abs(dy) < 5)) {
        naturalScore -= 10;
      } else {
        naturalScore += 5;
      }
    }

    return Math.max(-50, Math.min(50, naturalScore));
  }

  private analyzeTypingPattern(typingPattern: any): number {
    // Analisar se o padrão de digitação parece humano
    if (!typingPattern.keyIntervals) return 0;

    const intervals = typingPattern.keyIntervals;
    let humanScore = 0;

    // Verificar variação nos tempos de digitação
    const variance = this.calculateVariance(intervals);
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // Baixa variação é suspeita (muito robótico)
    if (variance < avgInterval * 0.1) {
      humanScore -= 30;
    } else {
      humanScore += 20;
    }

    // Verificar pausas naturais
    const longPauses = intervals.filter(interval => interval > avgInterval * 3).length;
    if (longPauses > 0 && longPauses < intervals.length * 0.2) {
      humanScore += 15;
    }

    return Math.max(-50, Math.min(50, humanScore));
  }

  getBehaviorReport(): {
    totalRecords: number;
    averageTypingSpeed: number;
    averageMouseMovements: number;
    averageScrollSpeed: number;
    averageRandomDelays: number;
    humanBehaviorScore: number;
  } {
    if (this.behaviorHistory.length === 0) {
      return {
        totalRecords: 0,
        averageTypingSpeed: 0,
        averageMouseMovements: 0,
        averageScrollSpeed: 0,
        averageRandomDelays: 0,
        humanBehaviorScore: 50
      };
    }

    const totalRecords = this.behaviorHistory.length;
    const averageTypingSpeed = this.behaviorHistory.reduce((sum, m) => sum + m.typingSpeed, 0) / totalRecords;
    const averageMouseMovements = this.behaviorHistory.reduce((sum, m) => sum + m.mouseMovements, 0) / totalRecords;
    const averageScrollSpeed = this.behaviorHistory.reduce((sum, m) => sum + m.scrollSpeed, 0) / totalRecords;
    const averageRandomDelays = this.behaviorHistory.reduce((sum, m) => sum + m.randomDelays, 0) / totalRecords;

    // Calcular score geral de comportamento humano
    const humanBehaviorScore = this.calculateOverallHumanScore();

    return {
      totalRecords,
      averageTypingSpeed,
      averageMouseMovements,
      averageScrollSpeed,
      averageRandomDelays,
      humanBehaviorScore
    };
  }

  private calculateOverallHumanScore(): number {
    if (this.behaviorHistory.length === 0) return 50;

    let score = 50; // Base neutra

    // Fatores positivos
    score += this.behaviorHistory.length > 10 ? 10 : 0; // Histórico suficiente
    score += this.config.typingSpeedVariation ? 15 : 0;
    score += this.config.mouseMovementSimulation ? 15 : 0;
    score += this.config.randomDelays ? 15 : 0;
    score += this.config.scrollSimulation ? 10 : 0;

    return Math.max(0, Math.min(100, score));
  }

  private loadBehaviorHistory(): void {
    try {
      const stored = localStorage.getItem('forgeDeals_human_behavior');
      if (stored) {
        this.behaviorHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico de comportamento:', error);
    }
  }

  private saveBehaviorHistory(): void {
    try {
      localStorage.setItem('forgeDeals_human_behavior', JSON.stringify(this.behaviorHistory));
    } catch (error) {
      console.warn('Erro ao salvar histórico de comportamento:', error);
    }
  }

  clearHistory(): void {
    this.behaviorHistory = [];
    this.saveBehaviorHistory();
  }
}
