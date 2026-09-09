export interface HumanBehaviorConfig {
  typingSpeedVariation?: boolean;
  mouseMovementSimulation?: boolean;
  randomDelays?: boolean;
  scrollSimulation?: boolean;
}

export class HumanBehavior {
  constructor(private readonly config: HumanBehaviorConfig = {}) {}

  async simulateHumanBehavior(): Promise<void> {
    if (!this.config.typingSpeedVariation && !this.config.mouseMovementSimulation && !this.config.randomDelays) {
      return;
    }

    if (this.config.mouseMovementSimulation) await this.randomDelay(50, 250);
    if (this.config.randomDelays) await this.randomDelay(150, 700);
    if (this.config.scrollSimulation) await this.randomDelay(100, 400);
  }

  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
