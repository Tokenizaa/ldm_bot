import { ollamaService } from '../ollama/ollama.service';
import { AffiliateLink } from '../../../types';

export interface OfferCopyRequest {
  product: AffiliateLink;
  copyType: 'offer' | 'question' | 'review' | 'comparison' | 'opinion' | 'alert' | 'discussion' | 'experience';
  tone?: 'technical' | 'friendly' | 'professional' | 'casual';
  maxLength?: number;
  includePrice?: boolean;
  includeBrand?: boolean;
}

export interface OfferCopyResponse {
  copy: string;
  spamRisk: {
    score: number;
    classification: 'safe' | 'moderate' | 'high';
    reasons: string[];
  };
  metadata: {
    model: string;
    generatedAt: string;
    wordCount: number;
    charCount: number;
    hasEmojis: boolean;
    hasUrgency: boolean;
    hasCTA: boolean;
  };
}

export class OfferCopyAgent {
  private readonly defaultTone = 'technical';
  private readonly defaultMaxLength = 150;

  async generateCopy(request: OfferCopyRequest): Promise<OfferCopyResponse> {
    console.log(`🤖 Generating ${request.copyType} copy for: ${request.product.product_name}`);

    try {
      // Gerar copy principal
      const copy = await ollamaService.generateFacebookCopy(
        {
          name: request.product.product_name,
          price: request.product.current_price,
          brand: request.product.brand,
          category: request.product.category,
          features: this.extractFeatures(request.product)
        },
        request.copyType
      );

      // Analisar risco de spam
      const spamRisk = await ollamaService.analyzeSpamRisk(copy);

      // Gerar metadata
      const metadata = this.generateMetadata(copy);

      // Se risco alto, tentar reescrever
      let finalCopy = copy;
      if (spamRisk.classification === 'high') {
        console.log('⚠️ High spam risk detected, rewriting...');
        finalCopy = await ollamaService.rewriteForSafety(copy);
        
        // Reanalisar após rewrite
        const newSpamRisk = await ollamaService.analyzeSpamRisk(finalCopy);
        spamRisk.score = newSpamRisk.score;
        spamRisk.classification = newSpamRisk.classification;
        spamRisk.reasons = newSpamRisk.reasons;
      }

      const response: OfferCopyResponse = {
        copy: finalCopy,
        spamRisk,
        metadata
      };

      console.log(`✅ Copy generated (spam risk: ${spamRisk.score}/100 - ${spamRisk.classification})`);
      return response;

    } catch (error) {
      console.error('❌ Failed to generate copy:', error);
      throw new Error(`Offer copy generation failed: ${error}`);
    }
  }

  async generateMultipleVariations(request: OfferCopyRequest, count: number = 3): Promise<OfferCopyResponse[]> {
    console.log(`🔄 Generating ${count} variations for: ${request.product.product_name}`);

    const variations: OfferCopyResponse[] = [];
    const usedCopies = new Set<string>();

    for (let i = 0; i < count; i++) {
      try {
        // Variar o modelo e temperatura para diversidade
        const models = ['llama3:8b', 'mistral:7b', 'phi3:mini'];
        const model = models[i % models.length];
        
        const copy = await ollamaService.generateFacebookCopy(
          {
            name: request.product.product_name,
            price: request.product.current_price,
            brand: request.product.brand,
            category: request.product.category,
            features: this.extractFeatures(request.product)
          },
          request.copyType
        );

        // Verificar duplicação
        if (usedCopies.has(copy)) {
          console.log(`⚠️ Duplicate copy detected, skipping variation ${i + 1}`);
          continue;
        }

        usedCopies.add(copy);

        const spamRisk = await ollamaService.analyzeSpamRisk(copy);
        const metadata = this.generateMetadata(copy);

        variations.push({
          copy,
          spamRisk,
          metadata
        });

      } catch (error) {
        console.error(`❌ Failed to generate variation ${i + 1}:`, error);
      }
    }

    // Ordenar por menor risco de spam
    variations.sort((a, b) => a.spamRisk.score - b.spamRisk.score);

    console.log(`✅ Generated ${variations.length} unique variations`);
    return variations;
  }

  async optimizeForEngagement(copy: string, targetMetrics: {
    ctr?: number;
    comments?: number;
    shares?: number;
  }): Promise<string> {
    const prompt = `Otimize esta copy para Facebook Groups focando em:
    - CTR: ${targetMetrics.ctr || 'aumentar'}
    - Comentários: ${targetMetrics.comments || 'aumentar'}
    - Shares: ${targetMetrics.shares || 'aumentar'}
    
    Copy original: "${copy}"
    
    REGRAS:
    - Manter mensagem principal
    - Aumentar engajamento natural
    - Adicionar elemento de discussão
    - Não aumentar risco de spam
    - Máximo 150 caracteres`;

    try {
      const optimized = await ollamaService.generateText(prompt, 'mistral:7b', {
        temperature: 0.8,
        num_predict: 150
      });

      // Verificar se a otimização melhorou
      const originalRisk = await ollamaService.analyzeSpamRisk(copy);
      const optimizedRisk = await ollamaService.analyzeSpamRisk(optimized);

      if (optimizedRisk.score <= originalRisk.score + 10) {
        return optimized;
      } else {
        console.log('⚠️ Optimization increased spam risk, keeping original');
        return copy;
      }

    } catch (error) {
      console.error('❌ Failed to optimize copy:', error);
      return copy;
    }
  }

  async generateCTAVariations(baseCopy: string, count: number = 5): Promise<string[]> {
    const prompt = `Gere ${count} variações de CTA para esta copy:
    
    "${baseCopy}"
    
    REGRAS:
    - CTAs leves e naturais
    - Sem "COMPRE AGORA"
    - Sem urgência excessiva
    - Máximo 20 caracteres cada
    - Tom amigável
    
    Retorne em formato de lista numerada.`;

    try {
      const response = await ollamaService.generateText(prompt, 'phi3:mini', {
        temperature: 0.9,
        num_predict: 200
      });

      // Extrair CTAs da resposta
      const lines = response.split('\n').filter(line => line.trim());
      const ctas: string[] = [];

      for (const line of lines) {
        const match = line.match(/^\d+\.\s*(.+)$/);
        if (match) {
          ctas.push(match[1].trim());
        }
      }

      return ctas.slice(0, count);

    } catch (error) {
      console.error('❌ Failed to generate CTA variations:', error);
      
      // Fallback CTAs
      return [
        'Confira as promoções.',
        'Vale a pena dar uma olhada.',
        'Boa oportunidade.',
        'Recomendo verificar.',
        'Interessante oferta.'
      ];
    }
  }

  private extractFeatures(product: AffiliateLink): string[] {
    const features: string[] = [];
    
    // Extrair features do nome do produto
    const name = product.product_name.toLowerCase();
    
    // Detectar características comuns
    if (name.includes('furadeira')) features.push('Furação potente');
    if (name.includes('parafusadeira')) features.push('Parafusamento versátil');
    if (name.includes('serra')) features.push('Corte preciso');
    if (name.includes('lixadeira')) features.push('Acabamento profissional');
    if (name.includes('12v') || name.includes('18v')) features.push('Bateria recarregável');
    if (name.includes('sem fio')) features.push('Mobilidade total');
    if (name.includes('profissional')) features.push('Uso profissional');
    if (name.includes('kit')) features.push('Kit completo');

    // Adicionar marca como feature se existir
    if (product.brand) {
      features.push(`Marca ${product.brand}`);
    }

    // Adicionar categoria como feature
    if (product.category) {
      features.push(`Categoria: ${product.category}`);
    }

    return features;
  }

  private generateMetadata(copy: string): OfferCopyResponse['metadata'] {
    const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(copy);
    const hasUrgency = /imperdível|última|corre|urgente|limitada/i.test(copy);
    const hasCTA = /compre|confira|veja|clique|saiba|garanta/i.test(copy);

    return {
      model: 'llama3:8b', // Será atualizado dinamicamente
      generatedAt: new Date().toISOString(),
      wordCount: copy.split(/\s+/).length,
      charCount: copy.length,
      hasEmojis,
      hasUrgency,
      hasCTA
    };
  }

  async validateCopyQuality(copy: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Verificar comprimento
    if (copy.length > 150) {
      issues.push('Texto muito longo (>150 caracteres)');
      score -= 15;
      recommendations.push('Reduzir para menos de 150 caracteres');
    }

    if (copy.length < 50) {
      issues.push('Texto muito curto (<50 caracteres)');
      score -= 10;
      recommendations.push('Adicionar mais contexto');
    }

    // Verificar emojis
    const emojiCount = (copy.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount > 2) {
      issues.push('Muitos emojis');
      score -= 10;
      recommendations.push('Reduzir para 1-2 emojis no máximo');
    }

    // Verificar urgência
    if (/imperdível|última|corre|urgente|limitada/i.test(copy)) {
      issues.push('Linguagem de urgência excessiva');
      score -= 20;
      recommendations.push('Remover linguagem agressiva');
    }

    // Verificar CTA agressivo
    if (/compre agora|garanta já|não perca/i.test(copy)) {
      issues.push('CTA muito agressivo');
      score -= 15;
      recommendations.push('Usar CTA mais suave');
    }

    // Verificar caps lock
    if (copy === copy.toUpperCase() && copy.length > 10) {
      issues.push('Uso excessivo de CAPS LOCK');
      score -= 10;
      recommendations.push('Usar capitalização normal');
    }

    // Verificar repetição
    const words = copy.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const uniqueWords = new Set(words).size;
    const repetitionRatio = uniqueWords / wordCount;

    if (repetitionRatio < 0.7) {
      issues.push('Alta repetição de palavras');
      score -= 10;
      recommendations.push('Variar vocabulário');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

export const offerCopyAgent = new OfferCopyAgent();
