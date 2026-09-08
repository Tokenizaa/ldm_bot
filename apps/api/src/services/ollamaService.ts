import type { SystemConfig } from '../../web/src/types/config';

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
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Ollama generation failed:', error);
      // Fallback: return a simple template-based copy
      return this.generateFallbackCopy(prompt);
    }
  }

  private generateFallbackCopy(prompt: string): string {
    // Extract product info from prompt
    const titleMatch = prompt.match(/Título: (.+)/);
    const priceMatch = prompt.match(/Preço: R\$ ([\d.,]+)/);
    const brandMatch = prompt.match(/Marca: (.+)/);
    const categoryMatch = prompt.match(/Categoria: (.+)/);

    const title = titleMatch?.[1] || 'Produto';
    const price = priceMatch?.[1] || '0';
    const brand = brandMatch?.[1] || '';
    const category = categoryMatch?.[1] || '';

    return `🔥 OFERTA IMPERDÍVEL!

${title}
${brand ? `Marca: ${brand}` : ''}
${category ? `Categoria: ${category}` : ''}

💰 Por apenas R$ ${price}!

✅ Produto original Loja do Mecânico
🚀 Entrega rápida para todo Brasil
🔧 Garantia de fábrica

Não perca tempo, estoque limitado!

#LojaDoMecanico #Oferta #Ferramentas #Promocao`;
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
}