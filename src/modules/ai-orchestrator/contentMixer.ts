import { OllamaService } from '../social-ai/ollama/ollama.service';
import { Product } from '../../types';

export interface ContentMix {
  offer: number;
  interaction: number;
  review: number;
  branding: number;
}

export interface ContentTemplate {
  id: string;
  type: 'offer' | 'interaction' | 'review' | 'branding';
  persona: string;
  template: string;
  variables: string[];
  cta_type: string;
  engagement_prediction: number;
  spam_risk: number;
  humanization_score: number;
}

export interface GeneratedContent {
  id: string;
  type: 'offer' | 'interaction' | 'review' | 'branding';
  persona: string;
  content: string;
  product_id?: string;
  cta: string;
  hashtags: string[];
  engagement_prediction: number;
  spam_risk: number;
  humanization_score: number;
  diversity_score: number;
  saturation_score: number;
  ai_confidence: number;
  created_at: string;
}

export class ContentMixer {
  private ollamaService: OllamaService;
  private templates: ContentTemplate[];
  private recentContent: GeneratedContent[];
  private saturationTracker: Map<string, number>;

  constructor() {
    this.ollamaService = new OllamaService();
    this.templates = [];
    this.recentContent = [];
    this.saturationTracker = new Map();
    this.initializeTemplates();
  }

  /**
   * Inicializa templates base para cada tipo de conteúdo e persona
   */
  private initializeTemplates(): void {
    const personas = [
      'tecnico_profissional',
      'mecanico_raiz', 
      'especialista_bosch',
      'cacador_promocoes',
      'review_honesto',
      'influenciador_ferramentas'
    ];

    const baseTemplates = {
      offer: [
        {
          template: "🔥 OFERTA IMPERDÍVEL! {product_name} por apenas R${price}! 🎯 Desconto de {discount}% - Aproveite agora! {affiliate_link}",
          variables: ['product_name', 'price', 'discount', 'affiliate_link'],
          cta_type: 'direct_offer',
          engagement_prediction: 75,
          spam_risk: 25,
          humanization_score: 60
        },
        {
          template: "⚡ Promoção relâmpago! {product_name} com super desconto! De R${old_price} por apenas R${price}! 🛒 {affiliate_link}",
          variables: ['product_name', 'old_price', 'price', 'affiliate_link'],
          cta_type: 'price_comparison',
          engagement_prediction: 80,
          spam_risk: 30,
          humanization_score: 65
        }
      ],
      interaction: [
        {
          template: "🤔 Mecânicos, qual ferramenta não pode faltar na sua oficina? Compartilhe nos comentários! 👇 #Ferramentas #Oficina",
          variables: [],
          cta_type: 'question_engagement',
          engagement_prediction: 85,
          spam_risk: 5,
          humanization_score: 90
        },
        {
          template: "✨ Qual a maior dificuldade que você enfrenta com {category}? Troque experiências com a gente! 💬 {affiliate_link}",
          variables: ['category'],
          cta_type: 'problem_solving',
          engagement_prediction: 78,
          spam_risk: 8,
          humanization_score: 85
        }
      ],
      review: [
        {
          template: "⭐ Review: {product_name} - {key_feature} incrível! Testamos e aprovamos! 📈 Nota: {rating}/10 {affiliate_link}",
          variables: ['product_name', 'key_feature', 'rating', 'affiliate_link'],
          cta_type: 'product_review',
          engagement_prediction: 70,
          spam_risk: 15,
          humanization_score: 75
        },
        {
          template: "🔧 Análise completa: {product_name} vale a pena? {pros} ✅ | {cons} ❌ Verdict: {verdict} {affiliate_link}",
          variables: ['product_name', 'pros', 'cons', 'verdict', 'affiliate_link'],
          cta_type: 'detailed_review',
          engagement_prediction: 82,
          spam_risk: 12,
          humanization_score: 80
        }
      ],
      branding: [
        {
          template: "🚀 Na ForgeDeals, conectamos você com as melhores ferramentas! Qualidade e confiança em cada oferta! ✨ #ForgeDeals #Parceiro",
          variables: [],
          cta_type: 'brand_awareness',
          engagement_prediction: 45,
          spam_risk: 3,
          humanization_score: 70
        },
        {
          template: "💪 Nossa missão: ajudar mecânicos e profissionais a encontrar as melhores ferramentas! Conte com a gente! 🤝 {affiliate_link}",
          variables: ['affiliate_link'],
          cta_type: 'mission_statement',
          engagement_prediction: 50,
          spam_risk: 5,
          humanization_score: 85
        }
      ]
    };

    // Gerar templates para cada persona
    personas.forEach(persona => {
      Object.entries(baseTemplates).forEach(([type, templates]) => {
        templates.forEach((template, index) => {
          this.templates.push({
            id: `${type}_${persona}_${index}`,
            type: type as any,
            persona,
            template: this.adaptTemplateToPersona(template.template, persona),
            variables: template.variables,
            cta_type: template.cta_type,
            engagement_prediction: template.engagement_prediction,
            spam_risk: template.spam_risk,
            humanization_score: template.humanization_score
          });
        });
      });
    });
  }

  /**
   * Adapta template para a persona específica
   */
  private adaptTemplateToPersona(template: string, persona: string): string {
    const personaAdaptations: Record<string, Record<string, string>> = {
      tecnico_profissional: {
        'OFERTA IMPERDÍVEL': 'OPORTUNIDADE TÉCNICA',
        'super desconto': 'condição especial',
        'aproveite agora': 'recomendado para profissionais',
        '🔥': '⚙️',
        '🎯': '📊'
      },
      mecanico_raiz: {
        'OFERTA IMPERDÍVEL': 'NEGÓCIO DA RUAA',
        'super desconto': 'preço bom mesmo',
        'aproveite agora': 'corre lá',
        '🔥': '🔧',
        '🎯': '💰'
      },
      especialista_bosch: {
        'OFERTA IMPERDÍVEL': 'EXCLUSIVIDADE BOSCH',
        'super desconto': 'investimento inteligente',
        'aproveite agora': 'qualidade Bosch',
        '🔥': '🔋',
        '🎯': '🏆'
      },
      cacador_promocoes: {
        'OFERTA IMPERDÍVEL': 'PROMOÇÃO CAÇADA!',
        'super desconto': 'MELHOR PREÇO',
        'aproveite agora': 'CORRE! ÚLTIMAS UNIDADES!',
        '🔥': '🏃‍♂️',
        '🎯': '🎯'
      },
      review_honesto: {
        'OFERTA IMPERDÍVEL': 'ANÁLISE: Vale a pena?',
        'super desconto': 'preço justo',
        'aproveite agora': 'veredito: recomendado',
        '🔥': '📋',
        '🎯': '⭐'
      },
      influenciador_ferramentas: {
        'OFERTA IMPERDÍVEL': 'HYPE DO MÊS!',
        'super desconto': 'PREÇO INCRÍVEL!',
        'aproveite agora': 'TENDENCIA DO MOMENTO!',
        '🔥': '✨',
        '🎯': '📱'
      }
    };

    const adaptations = personaAdaptations[persona] || {};
    let adaptedTemplate = template;

    Object.entries(adaptations).forEach(([original, replacement]) => {
      adaptedTemplate = adaptedTemplate.replace(new RegExp(original, 'g'), replacement);
    });

    return adaptedTemplate;
  }

  /**
   * Geração automática de conteúdo baseado no mix
   */
  async generateContentBatch(
    contentMix: ContentMix,
    products: Product[],
    targetCount: number
  ): Promise<GeneratedContent[]> {
    const generatedContent: GeneratedContent[] = [];

    // Calcular quantidades por tipo
    const quantities = {
      offer: Math.ceil((contentMix.offer / 100) * targetCount),
      interaction: Math.ceil((contentMix.interaction / 100) * targetCount),
      review: Math.ceil((contentMix.review / 100) * targetCount),
      branding: Math.ceil((contentMix.branding / 100) * targetCount)
    };

    // Gerar conteúdo para cada tipo
    for (const [type, quantity] of Object.entries(quantities)) {
      for (let i = 0; i < quantity && generatedContent.length < targetCount; i++) {
        const content = await this.generateSingleContent(type as any, products);
        if (content) {
          generatedContent.push(content);
        }
      }
    }

    // Adicionar à memória e calcular scores
    generatedContent.forEach(content => {
      this.addToRecentContent(content);
      this.updateSaturationScores(content);
    });

    return generatedContent;
  }

  /**
   * Geração de conteúdo individual
   */
  private async generateSingleContent(
    type: 'offer' | 'interaction' | 'review' | 'branding',
    products: Product[]
  ): Promise<GeneratedContent | null> {
    // Selecionar template adequado
    const availableTemplates = this.templates.filter(t => t.type === type);
    if (availableTemplates.length === 0) return null;

    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    // Preparar variáveis
    let variables: Record<string, string> = {};
    
    if (type === 'offer' && products.length > 0) {
      const product = this.selectOptimalProduct(products, type);
      if (product) {
        variables = {
          product_name: product.title,
          price: product.price.toString(),
          old_price: product.old_price?.toString() || product.price.toString(),
          discount: product.discount.toString(),
          affiliate_link: product.affiliate_url,
          brand: product.brand,
          category: product.category
        };
      }
    } else if (type === 'review' && products.length > 0) {
      const product = this.selectOptimalProduct(products, type);
      if (product) {
        const reviewData = await this.generateReviewData(product);
        variables = {
          product_name: product.title,
          key_feature: reviewData.key_feature,
          rating: reviewData.rating,
          pros: reviewData.pros,
          cons: reviewData.cons,
          verdict: reviewData.verdict,
          affiliate_link: product.affiliate_url
        };
      }
    } else if (type === 'interaction') {
      variables = {
        category: this.getRandomCategory()
      };
    }

    // Gerar conteúdo com IA se necessário
    let finalContent = template.template;
    
    if (type === 'offer' || type === 'review') {
      // Usar IA para refinar o conteúdo
      finalContent = await this.refineContentWithAI(finalContent, variables, template.persona, type);
    } else {
      // Substituir variáveis simples
      Object.entries(variables).forEach(([key, value]) => {
        finalContent = finalContent.replace(new RegExp(`{${key}}`, 'g'), value);
      });
    }

    // Gerar hashtags
    const hashtags = await this.generateHashtags(type, variables, template.persona);

    // Calcular scores
    const scores = await this.calculateContentScores(finalContent, type, template.persona);

    return {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      persona: template.persona,
      content: finalContent,
      product_id: variables.product_id,
      cta: this.extractCTA(finalContent),
      hashtags,
      engagement_prediction: scores.engagement,
      spam_risk: scores.spam,
      humanization_score: scores.humanization,
      diversity_score: scores.diversity,
      saturation_score: scores.saturation,
      ai_confidence: scores.confidence,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Refinamento de conteúdo com IA
   */
  private async refineContentWithAI(
    template: string,
    variables: Record<string, string>,
    persona: string,
    type: string
  ): Promise<string> {
    const prompt =`
Refine este conteúdo para redes sociais:

TEMPLATE BASE: ${template}
VARIÁVEIS: ${JSON.stringify(variables)}
PERSONA: ${persona}
TIPO: ${type}

Regras:
- Máximo 280 caracteres
- Tom adequado à persona
- Natural e humano
- Incluir CTA sutil
- Evitar spam

Retorne apenas o conteúdo refinado, sem JSON.
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim().substring(0, 280);
    } catch (error) {
      console.error('Error refining content with AI:', error);
      // Fallback para substituição simples
      let refined = template;
      Object.entries(variables).forEach(([key, value]) => {
        refined = refined.replace(new RegExp(`{${key}}`, 'g'), value);
      });
      return refined;
    }
  }

  /**
   * Geração de hashtags com IA
   */
  private async generateHashtags(
    type: string,
    variables: Record<string, string>,
    persona: string
  ): Promise<string[]> {
    const baseHashtags = {
      offer: ['#Ofertas', '#Promoções', '#Ferramentas', '#Desconto'],
      interaction: ['#Mecânica', '#Ferramentas', '#Oficina', '#Dúvidas'],
      review: ['#Review', '#Análise', '#Testado', '#Aprovado'],
      branding: ['#ForgeDeals', '#Parceiro', '#Qualidade', '#Confiança']
    };

    let hashtags = [...baseHashtags[type as keyof typeof baseHashtags]];

    // Adicionar hashtags específicas do produto/categoria
    if (variables.category) {
      hashtags.push(`#${variables.category.replace(/\s+/g, '')}`);
    }
    if (variables.brand) {
      hashtags.push(`#${variables.brand.replace(/\s+/g, '')}`);
    }

    // Adicionar hashtags da persona
    const personaHashtags: Record<string, string[]> = {
      tecnico_profissional: ['#Profissional', '#Técnico'],
      mecanico_raiz: ['#MecânicoRaiz', '#PovodaOficina'],
      especialista_bosch: ['#Bosch', '#Qualidade'],
      cacador_promocoes: ['#Caçador', '#Promoção'],
      review_honesto: ['#Honesto', '#Verdade'],
      influenciador_ferramentas: ['#Tendência', '#Influenciador']
    };

    hashtags.push(...(personaHashtags[persona] || []));

    // Limitar a 5 hashtags
    return hashtags.slice(0, 5);
  }

  /**
   * Cálculo completo de scores do conteúdo
   */
  private async calculateContentScores(
    content: string,
    type: string,
    persona: string
  ): Promise<any> {
    const prompt =`
Analise este conteúdo para redes sociais:

CONTEÚDO: "${content}"
TIPO: ${type}
PERSONA: ${persona}

Retorne JSON com scores:
{
  "engagement": 0-100,
  "spam": 0-100,
  "humanization": 0-100,
  "diversity": 0-100,
  "saturation": 0-100,
  "confidence": 0-100,
  "suggestions": ["sugestão1", "sugestão2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error calculating content scores:', error);
      return {
        engagement: 70,
        spam: 20,
        humanization: 75,
        diversity: 80,
        saturation: 15,
        confidence: 60,
        suggestions: []
      };
    }
  }

  /**
   * Seleção otimizada de produto
   */
  private selectOptimalProduct(products: Product[], contentType: string): Product | undefined {
    if (!products || products.length === 0) return undefined;

    let filtered = [...products];

    if (contentType === 'offer') {
      // Priorizar produtos com bom desconto e score alto
      filtered = filtered
        .filter(p => p.discount > 15)
        .sort((a, b) => (b.discount * (b.ai_score || 50)) - (a.discount * (a.ai_score || 50)));
    } else if (contentType === 'review') {
      // Priorizar produtos bem avaliados
      filtered = filtered
        .filter(p => p.ai_score && p.ai_score > 70)
        .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
    }

    // Evitar repetição de produtos recentes
    const recentProductIds = this.recentContent
      .slice(-10)
      .map(c => c.product_id)
      .filter(Boolean);

    filtered = filtered.filter(p => !recentProductIds.includes(p.id));

    return filtered[0];
  }

  /**
   * Geração de dados de review com IA
   */
  private async generateReviewData(product: Product): Promise<any> {
    const prompt =`
Gere dados para review deste produto:

PRODUTO: ${product.title}
PREÇO: R$${product.price}
MARCA: ${product.brand}
CATEGORIA: ${product.category}

Retorne JSON:
{
  "key_feature": "característica principal",
  "rating": 7-10,
  "pros": ["pró1", "pró2"],
  "cons": ["contra1", "contra2"],
  "verdict": "recomendado|bom|excelente"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'mistral');
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating review data:', error);
      return {
        key_feature: 'Qualidade superior',
        rating: 8,
        pros: ['Bom desempenho', 'Custo-benefício'],
        cons: ['Preço elevado'],
        verdict: 'recomendado'
      };
    }
  }

  /**
   * Extração automática de CTA
   */
  private extractCTA(content: string): string {
    const ctaPatterns = [
      /compre agora/gi,
      /aproveite/gi,
      /corre lá/gi,
      /saiba mais/gi,
      /clique aqui/gi,
      /veja mais/gi
    ];

    for (const pattern of ctaPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return 'confira';
  }

  /**
   * Categoria aleatória para interações
   */
  private getRandomCategory(): string {
    const categories = [
      'ferramentas elétricas',
      'ferramentas manuais',
      'equipamentos de segurança',
      'organização da oficina',
      'diagnóstico automotivo'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Adicionar conteúdo aos registros recentes
   */
  private addToRecentContent(content: GeneratedContent): void {
    this.recentContent.push(content);
    
    // Manter apenas os 100 mais recentes
    this.recentContent = this.recentContent.slice(-100);
  }

  /**
   * Atualizar scores de saturação
   */
  private updateSaturationScores(content: GeneratedContent): void {
    const key = `${content.type}_${content.persona}`;
    this.saturationTracker.set(key, (this.saturationTracker.get(key) || 0) + 1);
  }

  /**
   * Obter mix de conteúdo recomendado
   */
  async getRecommendedMix(context: any): Promise<ContentMix> {
    const prompt =`
Analise o contexto e recomende o mix ideal de conteúdo:

CONTEXT: ${JSON.stringify(context, null, 2)}

Distribuição base recomendada:
- Ofertas: 40%
- Interação: 30%
- Reviews: 20%
- Branding: 10%

Retorne JSON com mix ajustado:
{
  "offer": percentual,
  "interaction": percentual,
  "review": percentual,
  "branding": percentual,
  "reasoning": "explicação dos ajustes"
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      const result = JSON.parse(response);
      return {
        offer: result.offer,
        interaction: result.interaction,
        review: result.review,
        branding: result.branding
      };
    } catch (error) {
      console.error('Error getting recommended mix:', error);
      return { offer: 40, interaction: 30, review: 20, branding: 10 };
    }
  }

  /**
   * Obter conteúdo recente
   */
  getRecentContent(limit: number = 20): GeneratedContent[] {
    return this.recentContent.slice(-limit);
  }

  /**
   * Obter scores de saturação
   */
  getSaturationScores(): Map<string, number> {
    return this.saturationTracker;
  }

  /**
   * Limpar memória de conteúdo
   */
  clearContentMemory(): void {
    this.recentContent = [];
    this.saturationTracker.clear();
  }
}
