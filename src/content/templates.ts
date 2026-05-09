import { PostType } from '../planner/types';

export interface ContentTemplate {
  type: PostType;
  prompt: string;
  maxLength: number;
  includeEmojis: boolean;
  tone: 'casual' | 'professional' | 'enthusiastic' | 'educational';
}

export const CONTENT_TEMPLATES: Record<PostType, ContentTemplate[]> = {
  promotion: [
    {
      type: 'promotion',
      prompt: `Crie uma copy promocional atraente para este produto da Loja do Mecânico:

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

Exemplo: "🔥 OFERTA IMPERDÍVEL! {title} por apenas R$ {price}! 💪 Não perca essa chance! 👉 {link}"

Responda apenas com a copy, sem explicações.`,
      maxLength: 150,
      includeEmojis: true,
      tone: 'enthusiastic'
    },
    {
      type: 'promotion',
      prompt: `Promoção exclusiva para mecânicos:

Produto: {title}
Preço: R$ {price}
Marca: {brand}

Crie copy urgente:
- Máximo 120 caracteres
- Senso de escassez/tempo limitado
- Foco em economia
- Call-to-action forte

Responda apenas com a copy.`,
      maxLength: 120,
      includeEmojis: true,
      tone: 'casual'
    }
  ],

  educational: [
    {
      type: 'educational',
      prompt: `Conteúdo educativo sobre ferramentas:

Produto: {title}
Categoria: {category}
Marca: {brand}

Crie post educativo:
- Dica útil relacionada ao produto
- Explicação simples de benefício
- Máximo 200 caracteres
- Tom de especialista amigável
- 1 emoji educacional

Exemplo: "💡 Sabia que {title} {benefício}? Perfeito para {uso}! ⚙️"

Responda apenas com o conteúdo.`,
      maxLength: 200,
      includeEmojis: true,
      tone: 'educational'
    },
    {
      type: 'educational',
      prompt: `Dica profissional sobre {title}:

Categoria: {category}
Marca: {brand}

Crie conteúdo educacional:
- Explicação técnica simples
- Aplicação prática
- Máximo 180 caracteres
- Tom autoridade

Responda apenas com o conteúdo.`,
      maxLength: 180,
      includeEmojis: false,
      tone: 'professional'
    }
  ],

  engagement: [
    {
      type: 'engagement',
      prompt: `Crie pergunta de engajamento sobre {title}:

Produto: {title}
Categoria: {category}
Marca: {brand}

Formato:
- Pergunta aberta
- Relacionada ao produto/usuário
- Máximo 100 caracteres
- Incentivar comentários
- 1 emoji de interação

Exemplo: "🤔 Quem aqui já usou {title}? Qual sua experiência? Comente! 👇"

Responda apenas com a pergunta.`,
      maxLength: 100,
      includeEmojis: true,
      tone: 'casual'
    },
    {
      type: 'engagement',
      prompt: `Enquete sobre {category}:

Produto: {title}

Crie engajamento:
- Pergunta de múltipla escolha
- Opções A, B, C
- Máximo 120 caracteres
- Foco em experiência do usuário

Responda apenas com a enquete.`,
      maxLength: 120,
      includeEmojis: true,
      tone: 'casual'
    }
  ],

  institutional: [
    {
      type: 'institutional',
      prompt: `Conteúdo institucional sobre {title}:

Produto: {title}
Marca: {brand}
Categoria: {category}

Crie post institucional:
- Valor da marca/produto
- Confiança/qualidade
- Máximo 160 caracteres
- Tom profissional
- 1 emoji de confiança

Exemplo: "✅ Confiança {brand}! {title} com qualidade garantida. Sua segurança em primeiro lugar! 🛡️"

Responda apenas com o conteúdo.`,
      maxLength: 160,
      includeEmojis: true,
      tone: 'professional'
    },
    {
      type: 'institutional',
      prompt: `Institucional sobre Loja do Mecânico:

Produto: {title}

Crie conteúdo:
- Destaque da loja
- Compromisso com qualidade
- Máximo 140 caracteres
- Tom institucional

Responda apenas com o conteúdo.`,
      maxLength: 140,
      includeEmojis: false,
      tone: 'professional'
    }
  ]
};

export class ContentTemplateManager {
  /**
   * Retorna template aleatório para o tipo de post
   */
  getTemplate(postType: PostType): ContentTemplate {
    const templates = CONTENT_TEMPLATES[postType];
    
    if (!templates || templates.length === 0) {
      throw new Error(`Nenhum template encontrado para tipo: ${postType}`);
    }

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Formata prompt com dados do produto
   */
  formatPrompt(template: ContentTemplate, product: any): string {
    let prompt = template.prompt;

    // Substituir placeholders
    prompt = prompt.replace(/{title}/g, product.title || '');
    prompt = prompt.replace(/{price}/g, product.price ? `R$ ${product.price}` : '');
    prompt = prompt.replace(/{brand}/g, product.brand || '');
    prompt = prompt.replace(/{category}/g, product.category || '');
    prompt = prompt.replace(/{link}/g, product.affiliate_url || '');

    return prompt;
  }

  /**
   * Retorna todos os templates de um tipo
   */
  getTemplates(postType: PostType): ContentTemplate[] {
    return [...(CONTENT_TEMPLATES[postType] || [])];
  }

  /**
   * Estatísticas dos templates
   */
  getStats(): Record<PostType, number> {
    return {
      promotion: CONTENT_TEMPLATES.promotion.length,
      educational: CONTENT_TEMPLATES.educational.length,
      engagement: CONTENT_TEMPLATES.engagement.length,
      institutional: CONTENT_TEMPLATES.institutional.length
    };
  }
}
