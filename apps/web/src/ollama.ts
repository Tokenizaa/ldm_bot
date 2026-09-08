export interface OllamaConfig {
  baseUrl: string;
  defaultModel: string;
  timeout: number;
}

export interface ContentRequest {
  product: any;
  postType: 'promotion' | 'educational' | 'engagement' | 'institutional';
  template?: string;
  maxLength?: number;
}

export class OllamaService {
  private config: OllamaConfig;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3:8b',
      timeout: 90000,
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

  async generateCopy(product: any): Promise<string> {
    const prompt = `
Crie uma copy curta e atrativa para este produto da Loja do Mecânico:

Título: ${product.title}
Preço: R$ ${product.price}
Marca: ${product.brand}
Categoria: ${product.category}

A copy deve:
- Ser curta (máximo 200 caracteres)
- Ser atrativa para mecânicos
- Destacar o valor/benefício
- Incluir call-to-action sutil

Responda apenas com a copy, sem explicações.
`;

    return await this.generateText(prompt);
  }

  /**
   * Gera conteúdo baseado no tipo de post e template
   */
  async generateContent(request: ContentRequest): Promise<string> {
    const { product, postType, template, maxLength } = request;

    // Se não fornecer template, usar prompt padrão baseado no tipo
    const prompt = template || this.getDefaultPrompt(postType);

    // Substituir placeholders do produto
    const formattedPrompt = this.formatPrompt(prompt, product);

    // Gerar conteúdo
    const content = await this.generateText(formattedPrompt);

    // Validar e ajustar comprimento se necessário
    return this.validateContent(content, maxLength);
  }

  /**
   * Retorna prompt padrão para cada tipo de post
   */
  private getDefaultPrompt(postType: string): string {
    const prompts = {
      promotion: `Crie uma copy promocional atraente para este produto da Loja do Mecânico:

Título: {title}
Preço: R$ {price}
Marca: {brand}
Categoria: {category}

A copy deve:
- Ser curta e direta (máximo 150 caracteres)
- Destacar o valor/benefício principal
- Incluir call-to-action claro
- Usar linguagem de promoção
- Ter 1-2 emojis relevantes

Responda apenas com a copy, sem explicações.`,

      educational: `Crie conteúdo educativo sobre esta ferramenta:

Título: {title}
Categoria: {category}
Marca: {brand}

O conteúdo deve:
- Dar uma dica útil relacionada ao produto
- Explicar benefício de forma simples
- Máximo 180 caracteres
- Tom de especialista amigável
- 1 emoji educacional

Responda apenas com o conteúdo.`,

      engagement: `Crie pergunta de engajamento sobre {title}:

Produto: {title}
Categoria: {category}
Marca: {brand}

Formato:
- Pergunta aberta
- Relacionada ao produto/usuário
- Máximo 100 caracteres
- Incentivar comentários
- 1 emoji de interação

Responda apenas com a pergunta.`,

      institutional: `Crie conteúdo institucional sobre {title}:

Produto: {title}
Marca: {brand}
Categoria: {category}

O conteúdo deve:
- Valorizar a marca/produto
- Transmitir confiança/qualidade
- Máximo 140 caracteres
- Tom profissional
- 1 emoji de confiança

Responda apenas com o conteúdo.`
    };

    return prompts[postType as keyof typeof prompts] || prompts.promotion;
  }

  /**
   * Substitui placeholders no prompt
   */
  private formatPrompt(prompt: string, product: any): string {
    let formatted = prompt;

    formatted = formatted.replace(/{title}/g, product.title || '');
    formatted = formatted.replace(/{price}/g, product.price ? `R$ ${product.price}` : '');
    formatted = formatted.replace(/{brand}/g, product.brand || '');
    formatted = formatted.replace(/{category}/g, product.category || '');
    formatted = formatted.replace(/{link}/g, product.affiliate_url || '');
    formatted = formatted.replace(/{description}/g, product.description || '');
    formatted = formatted.replace(/{specs}/g, product.technical_specs || '');

    return formatted;
  }

  /**
   * Valida e ajusta conteúdo conforme comprimento máximo
   */
  private validateContent(content: string, maxLength?: number): string {
    let cleaned = content.trim();

    // Remover aspas se existirem
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    // Ajustar comprimento se necessário
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength - 3) + '...';
    }

    return cleaned;
  }

  /**
   * Gera múltiplas opções de conteúdo
   */
  async generateMultipleOptions(request: ContentRequest, options: number = 3): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < options; i++) {
      try {
        const content = await this.generateContent(request);
        if (content && !results.includes(content)) {
          results.push(content);
        }
      } catch (error) {
        console.error(`Erro ao gerar opção ${i + 1}:`, error);
      }
    }

    return results;
  }

  /**
   * Testa conectividade com Ollama
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Retorna configuração atual
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }
}

export const ollamaService = new OllamaService();
