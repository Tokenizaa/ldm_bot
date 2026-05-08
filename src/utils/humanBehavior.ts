import { AntiSpamConfig } from './types';

export class HumanBehavior {
  private config: AntiSpamConfig['human'];

  constructor(config: AntiSpamConfig['human']) {
    this.config = config;
  }

  async simulateHumanBehavior(page: any): Promise<void> {
    if (!this.config.typingSpeedVariation && !this.config.mouseMovementSimulation && !this.config.randomDelays) return;

    try {
      if (this.config.mouseMovementSimulation) {
        await this.randomDelay(50, 250);
      }
      if (this.config.randomDelays) {
        await this.randomDelay(150, 700);
      }
      if (this.config.scrollSimulation) {
        await this.randomDelay(100, 400);
      }
    } catch {
      // best-effort only; automation should not fail because of humanization layer
    }
  }

  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

