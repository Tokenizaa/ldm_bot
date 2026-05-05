export interface OllamaConfig {
  baseUrl: string;
  models: {
    llama3: string;
    mistral: string;
    deepseek: string;
    phi: string;
  };
  defaultModel: string;
  timeout: number;
  retries: number;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    num_predict?: number;
  };
}

export class OllamaService {
  private config: OllamaConfig;
  private isAvailable: boolean = false;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      models: {
        llama3: 'llama3:8b',
        mistral: 'mistral:7b',
        deepseek: 'deepseek-coder:6.7b',
        phi: 'phi3:mini'
      },
      defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3:8b',
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      this.isAvailable = response.ok;
      
      if (this.isAvailable) {
        console.log('✅ OLLAMA service available');
      } else {
        console.warn('⚠️ OLLAMA service not available');
      }
      
      return this.isAvailable;
    } catch (error) {
      console.error('❌ OLLAMA service check failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async generateText(prompt: string, model?: string, options?: OllamaRequest['options']): Promise<string> {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }

    if (!this.isAvailable) {
      throw new Error('OLLAMA service not available');
    }

    const request: OllamaRequest = {
      model: model || this.config.defaultModel,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        num_predict: 500,
        ...options
      }
    };

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(`🤖 Generating text with ${request.model} (attempt ${attempt}/${this.config.retries})`);
        
        const response = await fetch(`${this.config.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: OllamaResponse = await response.json();
        
        if (data.done && data.response) {
          console.log(`✅ Text generated successfully (${data.total_duration}ms)`);
          return data.response.trim();
        } else {
          throw new Error('Incomplete response from OLLAMA');
        }

      } catch (error) {
        console.error(`❌ OLLAMA generation attempt ${attempt} failed:`, error);
        
        if (attempt === this.config.retries) {
          throw new Error(`Failed to generate text after ${this.config.retries} attempts: ${error}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Unexpected error in OLLAMA generation');
  }

  async generateFacebookCopy(productData: {
    name: string;
    price: number;
    brand?: string;
    category?: string;
    features?: string[];
  }, copyType: 'offer' | 'question' | 'review' | 'comparison' | 'opinion' | 'alert' | 'discussion' | 'experience'): Promise<string> {
    const prompts = {
      offer: `Gere uma copy de oferta natural para Facebook Groups sobre o produto "${productData.name}" por R$${productData.price}. 
        Marca: ${productData.brand || 'N/A'}
        Categoria: ${productData.category || 'N/A'}
        Features: ${productData.features?.join(', ') || 'N/A'}
        
        REGRAS:
        - Tom técnico e amigável
        - Sem clickbait ou urgência excessiva
        - Parecer recomendação humana
        - Evitar "COMPRE AGORA", "IMPERDÍVEL", "ÚLTIMA CHANCE"
        - Incluir contexto humano
        - Máximo 150 caracteres
        - 1-2 emojis no máximo`,
        
      question: `Crie uma pergunta engajadora para Facebook Groups sobre "${productData.name}".
        Preço: R$${productData.price}
        Marca: ${productData.brand || 'N/A'}
        
        REGRAS:
        - Gerar discussão real
        - Não parecer venda
        - Tom curioso e técnico
        - Máximo 100 caracteres`,
        
      review: `Escreva um review breve e autêntico sobre "${productData.name}".
        Preço: R$${productData.price}
        Features: ${productData.features?.join(', ') || 'N/A'}
        
        REGRAS:
        - Tom de experiência real
        - Foco em benefícios
        - Sem exageros
        - Máximo 120 caracteres`,
        
      comparison: `Crie um comparativo técnico com "${productData.name}".
        Preço: R$${productData.price}
        Marca: ${productData.brand || 'N/A'}
        
        REGRAS:
        - Comparar com alternativas
        - Tom analítico
        - Foco em valor
        - Máximo 130 caracteres`,
        
      opinion: `Dê uma opinião técnica sobre "${productData.name}".
        Preço: R$${productData.price}
        
        REGRAS:
        - Tom especializado
        - Baseado em valor
        - Sem agressividade
        - Máximo 100 caracteres`,
        
      alert: `Crie um alerta de preço sutil sobre "${productData.name}".
        Preço: R$${productData.price}
        
        REGRAS:
        - Sem urgência extrema
        - Tom informativo
        - Máximo 80 caracteres`,
        
      discussion: `Inicie uma discussão técnica sobre "${productData.name}".
        Categoria: ${productData.category || 'N/A'}
        
        REGRAS:
        - Foco em uso prático
        - Pergunta aberta
        - Tom colaborativo
        - Máximo 120 caracteres`,
        
      experience: `Compartilhe uma experiência com "${productData.name}".
        Preço: R$${product.price}
        
        REGRAS:
        - Tom pessoal
        - Foco em resultado
        - Máximo 110 caracteres`
    };

    const prompt = prompts[copyType];
    if (!prompt) {
      throw new Error(`Invalid copy type: ${copyType}`);
    }

    return await this.generateText(prompt, this.config.models.llama3, {
      temperature: 0.8,
      top_p: 0.9,
      num_predict: 200
    });
  }

  async rewriteForSafety(originalText: string): Promise<string> {
    const prompt = `Reescreva este texto para ser mais seguro e menos spammy:
    
    Texto original: "${originalText}"
    
    REGRAS:
    - Manter mensagem principal
    - Reduzir urgência
    - Remover excesso de emojis
    - Evitar caps lock
    - Tornar mais natural
    - Máximo 150 caracteres
    - Tom profissional mas amigável`;

    return await this.generateText(prompt, this.config.models.mistral, {
      temperature: 0.7,
      num_predict: 150
    });
  }

  async analyzeSpamRisk(content: string): Promise<{
    score: number;
    classification: 'safe' | 'moderate' | 'high';
    reasons: string[];
  }> {
    const prompt = `Analise o risco de spam deste conteúdo para Facebook Groups:
    
    "${content}"
    
    Avalie (0-100):
    - Uso de urgência excessiva
    - Repetição de palavras
    - Linguagem agressiva
    - Excesso de emojis
    - Padrões de spam
    
    Retorne JSON:
    {
      "score": 0-100,
      "classification": "safe|moderate|high",
      "reasons": ["razão1", "razão2"]
    }`;

    try {
      const response = await this.generateText(prompt, this.config.models.deepseek, {
        temperature: 0.3,
        num_predict: 200
      });

      // Tentar parsear JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(0, Math.min(100, parsed.score || 0)),
          classification: parsed.classification || 'moderate',
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons : []
        };
      }
    } catch (error) {
      console.warn('Failed to parse spam risk analysis:', error);
    }

    // Fallback analysis
    const spamIndicators = [
      /imperdível/i,
      /última chance/i,
      /compre agora/i,
      /corre/i,
      /🔥{3,}/,
      /[A-Z]{5,}/
    ];

    let score = 0;
    const reasons: string[] = [];

    spamIndicators.forEach(indicator => {
      if (indicator.test(content)) {
        score += 20;
        reasons.push(`Contém padrão spam: ${indicator.source}`);
      }
    });

    if (content.length > 200) {
      score += 10;
      reasons.push('Texto muito longo');
    }

    const classification = score <= 30 ? 'safe' : score <= 60 ? 'moderate' : 'high';

    return { score, classification, reasons };
  }

  async generateVideoScript(productData: {
    name: string;
    price: number;
    features?: string[];
  }): Promise<{
    hook: string;
    script: string;
    cta: string;
  }> {
    const prompt = `Gere um roteiro curto para vídeo sobre "${productData.name}" (R$${productData.price}).
    Features: ${productData.features?.join(', ') || 'N/A'}
    
    Estrutura:
    1. Hook (atenção inicial - 15 chars)
    2. Script (corpo - 100 chars)
    3. CTA (leve - 20 chars)
    
    REGRAS:
    - Tom técnico e autêntico
    - Sem exageros
    - Foco em valor real
    - Natural para Facebook
    
    Retorne JSON:
    {
      "hook": "texto",
      "script": "texto", 
      "cta": "texto"
    }`;

    try {
      const response = await this.generateText(prompt, this.config.models.phi, {
        temperature: 0.8,
        num_predict: 200
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse video script:', error);
    }

    // Fallback
    return {
      hook: `Testei esta ${productData.name}`,
      script: `Ótima ferramenta por R$${productData.price}. Vale o investimento.`,
      cta: 'Confira as promoções.'
    };
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      const data = await response.json();
      
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return Object.values(this.config.models);
    }
  }

  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  async testConnection(): Promise<{ success: boolean; models: string[]; error?: string }> {
    try {
      const models = await this.getAvailableModels();
      return { success: true, models };
    } catch (error) {
      return { 
        success: false, 
        models: [], 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
export const ollamaService = new OllamaService();
