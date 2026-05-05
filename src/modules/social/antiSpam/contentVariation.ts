import { AntiSpamConfig, ContentVariation } from './types';

export class ContentVariation {
  private config: AntiSpamConfig['variation'];
  private templates: Map<string, string[]> = new Map();

  constructor(config: AntiSpamConfig['variation']) {
    this.config = config;
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Templates para diferentes tipos de post
    this.templates.set('offer', [
      'Encontrei esta oferta interessante: {product} por R${price}. Vale a pena conferir!',
      'O {product} está com bom preço agora: R${price}. Boa oportunidade para quem precisa.',
      'Notaram que o {product} caiu de preço? Está R${price}, bom momento para comprar.',
      'Para quem estava esperando, o {product} está por R${price}. Preço justo.',
      'O {product} apareceu com desconto: R${price}. Interessante a oferta.',
      'Boa promoção no {product} hoje: R${price}. Vale verificar.',
      'O {product} está com preço atrativo: R${price}. Recomendo dar uma olhada.',
      'Encontrei o {product} por R${price}. Parece ser um bom negócio.'
    ]);

    this.templates.set('question', [
      'Alguém já usou o {product}? Estou pensando em comprar por R${price}. Vale a pena?',
      'O que vocês acham do {product} por R${price}? É bom investimento?',
      'Para quem tem o {product}, compensa pagar R${price} pela versão atual?',
      'Vocês comprariam o {product} por R${price}? Quero opiniões.',
      'O {product} por R${price} é bom negócio ou devo esperar mais?',
      'Alguém sabe se o {product} por R${price} tem bom custo-benefício?',
      'Vale a pena o {product} por R${price}? Preciso de ajuda para decidir.',
      'Quem já tem o {product}, acha que R${price} é preço justo?'
    ]);

    this.templates.set('review', [
      'Usei o {product} por algumas semanas. Por R${price}, acho que vale muito a pena.',
      'Tenho o {product} e posso dizer que por R${price} é um ótimo investimento.',
      'Comprei o {product} por R${price} e fiquei satisfeito com a qualidade.',
      'O {product} que comprei por R${price} superou minhas expectativas.',
      'Depois de usar o {product}, acho que R${price} é preço justo pelo que entrega.',
      'Minha experiência com o {product} por R${price} foi muito positiva.',
      'Testei o {product} e por R${price} recomendo sem dúvidas.',
      'O {product} por R${price} tem excelente custo-benefício no meu uso.'
    ]);

    this.templates.set('comparison', [
      'Comparando o {product} com outras opções, por R${price} parece ser o melhor negócio.',
      'Pesquisei bastante e o {product} por R${price} foi a melhor opção que encontrei.',
      'O {product} por R${price} é mais vantajoso que alternativas mais caras.',
      'Depois de comparar, o {product} por R${price} oferece melhor relação custo-benefício.',
      'Entre as opções que analisei, o {product} por R${price} foi o mais equilibrado.',
      'O {product} por R${price} supera concorrentes em vários aspectos importantes.',
      'Fiz uma comparação detalhada e o {product} por R${price} saiu na frente.',
      'O {product} por R${price} é mais vantajoso que modelos similares no mercado.'
    ]);

    this.templates.set('opinion', [
      'Na minha opinião, o {product} por R${price} é uma escolha inteligente.',
      'Acho que o {product} por R${price} é ideal para quem busca qualidade.',
      'Minha impressão é que o {product} por R${price} é um bom negócio.',
      'Penso que o {product} por R${price} atende bem as necessidades do dia a dia.',
      'Na minha visão, o {product} por R${price} tem ótimo potencial.',
      'Acredito que o {product} por R${price} é investimento que vale a pena.',
      'Considero o {product} por R${price} uma opção sólida e confiável.',
      'Minha avaliação é que o {product} por R${price} entrega bom valor.'
    ]);

    this.templates.set('alert', [
      'Atenção: o {product} está com preço especial de R${price}. Aproveitem!',
      'Alerta de oferta: {product} por R${price}. Bom momento para comprar.',
      'Oportunidade: {product} por R${price}. Não costuma ficar nesse preço.',
      'Fiquem de olho no {product} por R${price}. Oferta interessante.',
      'Importante: {product} por R${price}. Vale a pena verificar agora.',
      'Aviso de preço: {product} por R${price}. Bom negócio disponível.',
      'Não percam: {product} por R${price}. Oferta por tempo limitado.',
      'Rápido: {product} por R${price}. Preço especial disponível.'
    ]);

    this.templates.set('discussion', [
      'Vamos discutir sobre o {product}? Por R${price}, parece ser bom investimento.',
      'Gostaria de saber a opinião de vocês sobre o {product} por R${price}.',
      'Qual a experiência de vocês com o {product}? Estou considerando por R${price}.',
      'Podemos compartilhar dicas sobre o {product}? Estou pensando em comprar por R${price}.',
      'Quem mais tem o {product}? Gostaria de trocar experiências sobre o preço R${price}.',
      'Vamos analisar se o {product} por R${price} vale realmente a pena.',
      'Aberto para discussão sobre o {product}. O preço R${price} é justo?',
      'Gostaria de ouvir diferentes opiniões sobre o {product} por R${price}.'
    ]);

    this.templates.set('experience', [
      'Minha experiência com o {product} foi excelente. Paguei R${price} e não me arrependo.',
      'Compartilhando minha experiência: o {product} por R${price} surpreendeu positivamente.',
      'Depois de meses usando o {product}, confirmo que R${price} foi bem investido.',
      'Minha jornada com o {product} começou quando paguei R${price}. Foi uma ótima escolha.',
      'Quero compartilhar como o {product} por R${price} mudou meu trabalho.',
      'A experiência de compra do {product} por R${price} foi tranquila e valeu a pena.',
      'Usando o {product} diariamente, confirmo que R${price} foi investimento sábio.',
      'Minha trajetória com o {product} mostra que R${price} foi preço justo.'
    ]);
  }

  async generateSafeVariations(originalContent: string, productData: {
    name: string;
    price: number;
    category?: string;
    brand?: string;
  }): Promise<ContentVariation[]> {
    const variations: ContentVariation[] = [];
    const variationTypes = this.config.variationTypes;

    for (const type of variationTypes) {
      const templates = this.templates.get(type);
      if (!templates) continue;

      for (const template of templates) {
        const variation = this.applyTemplate(template, productData);
        const differenceScore = this.calculateDifference(originalContent, variation);

        if (differenceScore >= this.config.minDifferencePercent) {
          variations.push({
            original: originalContent,
            variation,
            variationType: type as any,
            differenceScore
          });
        }
      }
    }

    // Ordenar por maior diferença
    return variations.sort((a, b) => b.differenceScore - a.differenceScore);
  }

  private applyTemplate(template: string, productData: {
    name: string;
    price: number;
    category?: string;
    brand?: string;
  }): string {
    let result = template;

    // Substituir placeholders
    result = result.replace(/{product}/g, productData.name);
    result = result.replace(/{price}/g, `R${productData.price.toFixed(2)}`);
    
    if (productData.brand) {
      result = result.replace(/{brand}/g, productData.brand);
    }
    
    if (productData.category) {
      result = result.replace(/{category}/g, productData.category);
    }

    // Adicionar variações humanas aleatórias
    result = this.addHumanTouches(result);

    return result;
  }

  private addHumanTouches(content: string): string {
    // Adicionar pequenas variações humanas
    const humanTouches = [
      () => content + ' 👍',
      () => content + ' 🤔',
      () => content + ' 💡',
      () => 'Opa, ' + content.toLowerCase(),
      () => content + '. O que acham?',
      () => content + ' Alguém mais?',
      () => 'Pessoal, ' + content.toLowerCase(),
      () => content + ' Dêem uma olhada.',
      () => content + ' Vale a pena.',
      () => content + ' Recomendo.',
      () => 'Galera, ' + content.toLowerCase(),
      () => content + ' Pensem nisso.'
    ];

    // 30% de chance de adicionar um toque humano
    if (Math.random() < 0.3) {
      const touch = humanTouches[Math.floor(Math.random() * humanTouches.length)];
      return touch();
    }

    return content;
  }

  private calculateDifference(original: string, variation: string): number {
    // Calcular diferença percentual entre textos
    const originalWords = this.normalizeText(original);
    const variationWords = this.normalizeText(variation);

    const set1 = new Set(originalWords);
    const set2 = new Set(variationWords);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    const similarity = intersection.size / union.size;
    const difference = 1 - similarity;

    return difference;
  }

  private normalizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  async generateVariation(originalContent: string, variationType: 'offer' | 'question' | 'review' | 'comparison'): Promise<string> {
    const templates = this.templates.get(variationType);
    if (!templates) {
      throw new Error(`Tipo de variação não encontrado: ${variationType}`);
    }

    // Extrair dados do produto do conteúdo original
    const productData = this.extractProductData(originalContent);
    
    // Selecionar template aleatório
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Aplicar template
    const variation = this.applyTemplate(template, productData);
    
    return variation;
  }

  private extractProductData(content: string): {
    name: string;
    price: number;
    category?: string;
    brand?: string;
  } {
    // Implementar extração de dados do produto
    // Por enquanto, retornar dados mockados
    return {
      name: 'Produto',
      price: 299.90,
      category: 'Ferramentas',
      brand: 'Bosch'
    };
  }

  getAvailableVariationTypes(): string[] {
    return Array.from(this.templates.keys());
  }

  getTemplateCount(variationType: string): number {
    const templates = this.templates.get(variationType);
    return templates ? templates.length : 0;
  }

  addCustomTemplate(variationType: string, template: string): void {
    if (!this.templates.has(variationType)) {
      this.templates.set(variationType, []);
    }
    
    const templates = this.templates.get(variationType)!;
    templates.push(template);
  }

  removeTemplate(variationType: string, index: number): void {
    const templates = this.templates.get(variationType);
    if (templates && index >= 0 && index < templates.length) {
      templates.splice(index, 1);
    }
  }

  getStats(): {
    totalTemplates: number;
    variationTypes: string[];
    templatesPerType: Record<string, number>;
  } {
    const templatesPerType: Record<string, number> = {};
    let totalTemplates = 0;

    for (const [type, templates] of this.templates.entries()) {
      templatesPerType[type] = templates.length;
      totalTemplates += templates.length;
    }

    return {
      totalTemplates,
      variationTypes: Array.from(this.templates.keys()),
      templatesPerType
    };
  }
}
