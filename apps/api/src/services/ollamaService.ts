import type { SystemConfig } from '@forge-deals/shared/types/config';

export class OllamaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaUnavailableError';
  }
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: SystemConfig) {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = config.ollama.activeModel || 'llama3:8b';
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 500
          }
        })
      });

      if (!response.ok) {
        throw new OllamaUnavailableError(`Ollama error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { response?: unknown };
      if (typeof data.response !== 'string' || !data.response.trim()) {
        throw new OllamaUnavailableError('Ollama retornou uma resposta vazia ou inválida');
      }

      return data.response.trim();
    } catch (error) {
      console.error('Ollama generation failed:', error);
      if (error instanceof OllamaUnavailableError) throw error;
      throw new OllamaUnavailableError('Não foi possível conectar ao Ollama');
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new OllamaUnavailableError(`Ollama error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json() as { models?: Array<{ name?: unknown }> };
      return Array.isArray(data.models)
        ? data.models.flatMap((model) => typeof model.name === 'string' ? [model.name] : [])
        : [];
    } catch (error) {
      console.error('Ollama model listing failed:', error);
      if (error instanceof OllamaUnavailableError) throw error;
      throw new OllamaUnavailableError('Não foi possível conectar ao Ollama');
    }
  }
}
