export interface OllamaConfig {
  baseUrl: string;
  defaultModel: string;
  timeout: number;
}

export class OllamaService {
  private config: OllamaConfig;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3:8b',
      timeout: 30000,
      ...config
    };
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || this.config.defaultModel, prompt, stream: false }),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) throw new Error(`OLLAMA HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.response) throw new Error('OLLAMA incomplete response');
    return String(data.response).trim();
  }
}

export const ollamaService = new OllamaService();
