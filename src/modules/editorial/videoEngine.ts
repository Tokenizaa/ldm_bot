import { OllamaService } from '../social-ai/ollama/ollama.service';
import { Product } from '../../types';

export interface VideoContent {
  id: string;
  type: 'branding' | 'tutorial' | 'product_review' | 'motion_slide' | 'short' | 'reel';
  title: string;
  description: string;
  script: string;
  duration: number; // segundos
  visual_elements: VisualElement[];
  audio_elements: AudioElement[];
  captions: Caption[];
  hashtags: string[];
  engagement_prediction: number;
  brand_alignment: number;
  production_complexity: 'low' | 'medium' | 'high';
  target_audience: string;
  persona: string;
  video_url?: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface VisualElement {
  type: 'logo' | 'product_image' | 'text_overlay' | 'animation' | 'background';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  duration: { start: number; end: number };
  animation?: string;
}

export interface AudioElement {
  type: 'background_music' | 'voiceover' | 'sound_effect';
  source: string;
  volume: number;
  duration: { start: number; end: number };
}

export interface Caption {
  text: string;
  timestamp: number;
  duration: number;
  style: 'normal' | 'highlight' | 'emphasis';
}

export interface VideoTemplate {
  id: string;
  type: 'branding' | 'tutorial' | 'product_review' | 'motion_slide' | 'short' | 'reel';
  name: string;
  structure: VideoStructure;
  default_duration: number;
  complexity: 'low' | 'medium' | 'high';
  brand_elements: string[];
}

export interface VideoStructure {
  sections: VideoSection[];
  transitions: string[];
  pacing: 'fast' | 'medium' | 'slow';
}

export interface VideoSection {
  type: 'intro' | 'content' | 'call_to_action' | 'outro';
  duration: number;
  elements: string[];
  script_template: string;
}

export class VideoEngine {
  private ollamaService: OllamaService;
  private templates: VideoTemplate[];
  private videoHistory: VideoContent[];
  private brandAssets: Map<string, any>;
  private musicLibrary: string[];
  private productionQueue: VideoContent[];

  constructor() {
    this.ollamaService = new OllamaService();
    this.templates = [];
    this.videoHistory = [];
    this.brandAssets = new Map();
    this.musicLibrary = [];
    this.productionQueue = [];
    this.initializeTemplates();
    this.initializeBrandAssets();
    this.initializeMusicLibrary();
  }

  /**
   * Inicializa templates de vídeo
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'branding_institutional',
        type: 'branding',
        name: 'Vídeo Institucional ForgeDeals',
        structure: {
          sections: [
            {
              type: 'intro',
              duration: 3,
              elements: ['logo', 'brand_music', 'text_overlay'],
              script_template: 'Bem-vindo ao ForgeDeals! Seu parceiro em ferramentas profissionais.'
            },
            {
              type: 'content',
              duration: 12,
              elements: ['product_showcase', 'testimonials', 'benefits'],
              script_template: 'Conectamos você com as melhores ferramentas do mercado. Qualidade, confiança e os melhores preços.'
            },
            {
              type: 'call_to_action',
              duration: 4,
              elements: ['cta_text', 'contact_info'],
              script_template: 'Siga nossa página e fique por dentro das melhores ofertas!'
            },
            {
              type: 'outro',
              duration: 2,
              elements: ['logo', 'tagline'],
              script_template: 'ForgeDeals - Ferramentas para profissionais.'
            }
          ],
          transitions: ['fade', 'slide', 'zoom'],
          pacing: 'medium'
        },
        default_duration: 21,
        complexity: 'medium',
        brand_elements: ['logo', 'colors', 'tagline']
      },
      {
        id: 'tutorial_quick_tip',
        type: 'tutorial',
        name: 'Dica Rápida de Ferramentas',
        structure: {
          sections: [
            {
              type: 'intro',
              duration: 2,
              elements: ['problem_statement', 'tool_intro'],
              script_template: 'Problema: {problem}. Solução: {tool_name}.'
            },
            {
              type: 'content',
              duration: 15,
              elements: ['demonstration', 'step_by_step', 'tips'],
              script_template: 'Veja como usar {tool_name} para resolver {problem}. Passo 1: {step1}. Passo 2: {step2}.'
            },
            {
              type: 'call_to_action',
              duration: 3,
              elements: ['cta_text', 'product_link'],
              script_template: 'Conheça mais sobre {tool_name} em nosso perfil!'
            }
          ],
          transitions: ['cut', 'fade'],
          pacing: 'fast'
        },
        default_duration: 20,
        complexity: 'low',
        brand_elements: ['logo', 'colors']
      },
      {
        id: 'product_review_short',
        type: 'product_review',
        name: 'Review Rápido de Produto',
        structure: {
          sections: [
            {
              type: 'intro',
              duration: 3,
              elements: ['product_intro', 'rating_preview'],
              script_template: 'Review completo: {product_name}. Vale a pena?'
            },
            {
              type: 'content',
              duration: 14,
              elements: ['product_features', 'pros_cons', 'demonstration'],
              script_template: '{product_name} se destaca em {feature1}. Pontos fortes: {pros}. Pontos fracos: {cons}.'
            },
            {
              type: 'call_to_action',
              duration: 3,
              elements: ['verdict', 'purchase_link'],
              script_template: 'Veredito: {verdict}. Confira o preço em nosso perfil!'
            }
          ],
          transitions: ['slide', 'zoom'],
          pacing: 'medium'
        },
        default_duration: 20,
        complexity: 'medium',
        brand_elements: ['logo', 'colors']
      },
      {
        id: 'motion_slide_promo',
        type: 'motion_slide',
        name: 'Slide Animado de Promoção',
        structure: {
          sections: [
            {
              type: 'intro',
              duration: 2,
              elements: ['attention_grabber', 'offer_text'],
              script_template: 'OFERTA IMPERDÍVEL!'
            },
            {
              type: 'content',
              duration: 8,
              elements: ['product_highlight', 'discount_animation', 'countdown'],
              script_template: '{product_name} com {discount}% OFF! Apenas {time_limit}!'
            },
            {
              type: 'call_to_action',
              duration: 2,
              elements: ['urgent_cta', 'contact_button'],
              script_template: 'Clique agora e garanta o seu!'
            }
          ],
          transitions: ['flash', 'bounce'],
          pacing: 'fast'
        },
        default_duration: 12,
        complexity: 'low',
        brand_elements: ['logo', 'colors']
      },
      {
        id: 'short_tiktok_style',
        type: 'short',
        name: 'Short Estilo TikTok',
        structure: {
          sections: [
            {
              type: 'intro',
              duration: 2,
              elements: ['trending_music', 'quick_intro'],
              script_template: 'Você não vai acreditar neste truque!'
            },
            {
              type: 'content',
              duration: 10,
              elements: ['quick_demo', 'surprise_element', 'text_overlays'],
              script_template: '{trick_description} Simples, rápido e eficaz!'
            },
            {
              type: 'call_to_action',
              duration: 3,
              elements: ['hashtag_cta', 'follow_prompt'],
              script_template: 'Teste você também! Siga para mais dicas!'
            }
          ],
          transitions: ['cut', 'jump_cut'],
          pacing: 'fast'
        },
        default_duration: 15,
        complexity: 'low',
        brand_elements: ['logo']
      },
      {
        id: 'reel_instagram_style',
        type: 'reel',
        name: 'Reel Estilo Instagram',
        structure: {
          sections: [
            {
              type: 'intro',
              duration: 3,
              elements: ['vibrant_intro', 'hook_text'],
              script_template: 'O segredo que todo mecânico deveria saber!'
            },
            {
              type: 'content',
              duration: 12,
              elements: ['aesthetic_shots', 'smooth_transitions', 'text_reveal'],
              script_template: '{secret_reveal} Transforme seu trabalho com esta dica!'
            },
            {
              type: 'call_to_action',
              duration: 3,
              elements: ['save_prompt', 'profile_tag'],
              script_template: 'Salve este post! Siga @ForgeDeals para mais!'
            }
          ],
          transitions: ['smooth', 'glitch'],
          pacing: 'medium'
        },
        default_duration: 18,
        complexity: 'medium',
        brand_elements: ['logo', 'colors', 'tagline']
      }
    ];
  }

  /**
   * Inicializa assets da marca
   */
  private initializeBrandAssets(): void {
    this.brandAssets.set('logo', {
      url: '/assets/brand/forgedeals-logo.png',
      formats: ['png', 'svg'],
      variations: ['full', 'icon', 'monochrome']
    });

    this.brandAssets.set('colors', {
      primary: '#FF6B35',
      secondary: '#004E89',
      accent: '#FFD23F',
      background: '#1A1A1A',
      text: '#FFFFFF'
    });

    this.brandAssets.set('fonts', {
      primary: 'Inter Bold',
      secondary: 'Inter Regular',
      display: 'Montserrat Black'
    });

    this.brandAssets.set('tagline', 'Ferramentas para profissionais');
  }

  /**
   * Inicializa biblioteca de música
   */
  private initializeMusicLibrary(): void {
    this.musicLibrary = [
      'corporate_upbeat',
      'tech_inspiration',
      'professional_background',
      'energetic_motivation',
      'brand_ambient',
      'tutorial_friendly',
      'promotion_urgent',
      'social_trend'
    ];
  }

  /**
   * Gera vídeo de branding institucional
   */
  async generateBrandingVideo(context: {
    target_audience: string;
    brand_message?: string;
    call_to_action?: string;
    duration_preference?: 'short' | 'medium' | 'long';
  }): Promise<VideoContent> {
    const template = this.templates.find(t => t.type === 'branding')!;
    
    // 1. Gerar script com IA
    const script = await this.generateBrandingScript(template, context);
    
    // 2. Definir elementos visuais
    const visualElements = this.generateBrandingVisuals(template, context);
    
    // 3. Definir elementos de áudio
    const audioElements = this.generateBrandingAudio(template);
    
    // 4. Gerar legendas
    const captions = this.generateCaptions(script);
    
    // 5. Calcular métricas
    const metrics = await this.calculateVideoMetrics(script, 'branding');

    const videoContent: VideoContent = {
      id: `video_branding_${Date.now()}`,
      type: 'branding',
      title: 'Conheça o ForgeDeals - Seu Parceiro de Ferramentas',
      description: 'Vídeo institucional apresentando a ForgeDeals e nossos compromissos com qualidade e confiança.',
      script,
      duration: template.default_duration,
      visual_elements: visualElements,
      audio_elements: audioElements,
      captions,
      hashtags: ['#ForgeDeals', '#FerramentasProfissionais', '#Qualidade', '#Confiança'],
      engagement_prediction: metrics.engagement_prediction,
      brand_alignment: metrics.brand_alignment,
      production_complexity: template.complexity,
      target_audience: context.target_audience,
      persona: 'tecnico_profissional',
      video_url: this.generateVideoUrl('branding'),
      thumbnail_url: this.generateThumbnailUrl('branding'),
      created_at: new Date().toISOString()
    };

    this.videoHistory.push(videoContent);
    return videoContent;
  }

  /**
   * Gera vídeo tutorial
   */
  async generateTutorialVideo(
    topic: string,
    tool?: Product,
    context: {
      difficulty_level: 'beginner' | 'intermediate' | 'advanced';
      target_duration?: number;
      focus_points?: string[];
    }
  ): Promise<VideoContent> {
    const template = this.templates.find(t => t.type === 'tutorial')!;
    
    // 1. Gerar script do tutorial
    const script = await this.generateTutorialScript(template, topic, tool, context);
    
    // 2. Definir elementos visuais
    const visualElements = this.generateTutorialVisuals(template, tool, context);
    
    // 3. Definir elementos de áudio
    const audioElements = this.generateTutorialAudio(template);
    
    // 4. Gerar legendas
    const captions = this.generateCaptions(script);
    
    // 5. Calcular métricas
    const metrics = await this.calculateVideoMetrics(script, 'tutorial');

    const videoContent: VideoContent = {
      id: `video_tutorial_${Date.now()}`,
      type: 'tutorial',
      title: `Dica Rápida: ${topic}`,
      description: `Aprenda ${topic} passo a passo com nossa ajuda profissional.`,
      script,
      duration: context.target_duration || template.default_duration,
      visual_elements: visualElements,
      audio_elements: audioElements,
      captions,
      hashtags: ['#Dica', '#Tutorial', '#Ferramentas', '#Profissional', '#ForgeDeals'],
      engagement_prediction: metrics.engagement_prediction,
      brand_alignment: metrics.brand_alignment,
      production_complexity: template.complexity,
      target_audience: 'Mecânicos e Profissionais',
      persona: 'tecnico_profissional',
      video_url: this.generateVideoUrl('tutorial'),
      thumbnail_url: this.generateThumbnailUrl('tutorial'),
      created_at: new Date().toISOString()
    };

    this.videoHistory.push(videoContent);
    return videoContent;
  }

  /**
   * Gera vídeo de review de produto
   */
  async generateProductReviewVideo(
    product: Product,
    context: {
      review_focus?: 'features' | 'value' | 'durability' | 'comparison';
      comparison_product?: Product;
      honest_review?: boolean;
    }
  ): Promise<VideoContent> {
    const template = this.templates.find(t => t.type === 'product_review')!;
    
    // 1. Gerar script de review
    const script = await this.generateReviewScript(template, product, context);
    
    // 2. Definir elementos visuais
    const visualElements = this.generateReviewVisuals(template, product, context);
    
    // 3. Definir elementos de áudio
    const audioElements = this.generateReviewAudio(template);
    
    // 4. Gerar legendas
    const captions = this.generateCaptions(script);
    
    // 5. Calcular métricas
    const metrics = await this.calculateVideoMetrics(script, 'product_review');

    const videoContent: VideoContent = {
      id: `video_review_${Date.now()}_${product.id}`,
      type: 'product_review',
      title: `Review: ${product.title}`,
      description: `Análise completa do ${product.title}. Vale a pena? Confira nosso review honesto.`,
      script,
      duration: template.default_duration,
      visual_elements: visualElements,
      audio_elements: audioElements,
      captions,
      hashtags: ['#Review', '#Análise', '#Testado', '#Aprovado', '#ForgeDeals', `#${product.brand}`],
      engagement_prediction: metrics.engagement_prediction,
      brand_alignment: metrics.brand_alignment,
      production_complexity: template.complexity,
      target_audience: 'Interessados em Ferramentas',
      persona: 'review_honesto',
      video_url: this.generateVideoUrl('review'),
      thumbnail_url: this.generateThumbnailUrl('review'),
      created_at: new Date().toISOString()
    };

    this.videoHistory.push(videoContent);
    return videoContent;
  }

  /**
   * Gera motion slide de promoção
   */
  async generateMotionSlideVideo(
    product: Product,
    context: {
      discount_percentage: number;
      urgency_level: 'low' | 'medium' | 'high' | 'critical';
      time_limit?: string;
      special_offer?: string;
    }
  ): Promise<VideoContent> {
    const template = this.templates.find(t => t.type === 'motion_slide')!;
    
    // 1. Gerar script de promoção
    const script = await this.generatePromotionScript(template, product, context);
    
    // 2. Definir elementos visuais animados
    const visualElements = this.generatePromotionVisuals(template, product, context);
    
    // 3. Definir elementos de áudio
    const audioElements = this.generatePromotionAudio(template, context.urgency_level);
    
    // 4. Gerar legendas
    const captions = this.generateCaptions(script);
    
    // 5. Calcular métricas
    const metrics = await this.calculateVideoMetrics(script, 'motion_slide');

    const videoContent: VideoContent = {
      id: `video_promo_${Date.now()}_${product.id}`,
      type: 'motion_slide',
      title: `PROMOÇÃO: ${product.title}`,
      description: `Oferta imperdível! ${product.title} com ${context.discount_percentage}% OFF. Não perca!`,
      script,
      duration: template.default_duration,
      visual_elements: visualElements,
      audio_elements: audioElements,
      captions,
      hashtags: ['#Promoção', '#Oferta', '#Desconto', '#Urgente', '#ForgeDeals', '#Limitado'],
      engagement_prediction: metrics.engagement_prediction,
      brand_alignment: metrics.brand_alignment,
      production_complexity: template.complexity,
      target_audience: 'Caçadores de Promoções',
      persona: 'cacador_promocoes',
      video_url: this.generateVideoUrl('promo'),
      thumbnail_url: this.generateThumbnailUrl('promo'),
      created_at: new Date().toISOString()
    };

    this.videoHistory.push(videoContent);
    return videoContent;
  }

  /**
   * Gera short estilo TikTok
   */
  async generateShortVideo(
    topic: string,
    context: {
      trending_hashtag?: string;
      music_preference?: string;
      style_preference?: 'educational' | 'entertaining' | 'surprising';
    }
  ): Promise<VideoContent> {
    const template = this.templates.find(t => t.type === 'short')!;
    
    // 1. Gerar script para short
    const script = await this.generateShortScript(template, topic, context);
    
    // 2. Definir elementos visuais dinâmicos
    const visualElements = this.generateShortVisuals(template, topic, context);
    
    // 3. Definir elementos de áudio
    const audioElements = this.generateShortAudio(template, context.music_preference);
    
    // 4. Gerar legendas
    const captions = this.generateCaptions(script);
    
    // 5. Calcular métricas
    const metrics = await this.calculateVideoMetrics(script, 'short');

    const videoContent: VideoContent = {
      id: `video_short_${Date.now()}`,
      type: 'short',
      title: `Truque Rápido: ${topic}`,
      description: `Você não vai acreditar neste truque com ${topic}! Rápido e eficaz!`,
      script,
      duration: template.default_duration,
      visual_elements: visualElements,
      audio_elements: audioElements,
      captions,
      hashtags: [
        '#Truque',
        '#DicaRápida',
        '#Ferramentas',
        '#Mecânica',
        '#ForgeDeals',
        context.trending_hashtag || '#Viral'
      ],
      engagement_prediction: metrics.engagement_prediction,
      brand_alignment: metrics.brand_alignment,
      production_complexity: template.complexity,
      target_audience: 'Geral',
      persona: 'mecanico_raiz',
      video_url: this.generateVideoUrl('short'),
      thumbnail_url: this.generateThumbnailUrl('short'),
      created_at: new Date().toISOString()
    };

    this.videoHistory.push(videoContent);
    return videoContent;
  }

  /**
   * Gera reel estilo Instagram
   */
  async generateReelVideo(
    topic: string,
    context: {
      aesthetic_preference?: 'professional' | 'casual' | 'modern';
      music_mood?: 'energetic' | 'calm' | 'inspiring';
      call_to_action?: string;
    }
  ): Promise<VideoContent> {
    const template = this.templates.find(t => t.type === 'reel')!;
    
    // 1. Gerar script para reel
    const script = await this.generateReelScript(template, topic, context);
    
    // 2. Definir elementos visuais estéticos
    const visualElements = this.generateReelVisuals(template, topic, context);
    
    // 3. Definir elementos de áudio
    const audioElements = this.generateReelAudio(template, context.music_mood);
    
    // 4. Gerar legendas
    const captions = this.generateCaptions(script);
    
    // 5. Calcular métricas
    const metrics = await this.calculateVideoMetrics(script, 'reel');

    const videoContent: VideoContent = {
      id: `video_reel_${Date.now()}`,
      type: 'reel',
      title: `Segredo Profissional: ${topic}`,
      description: `O segredo que todo profissional deveria saber sobre ${topic}. Transforme seu trabalho!`,
      script,
      duration: template.default_duration,
      visual_elements: visualElements,
      audio_elements: audioElements,
      captions,
      hashtags: [
        '#Segredo',
        '#Profissional',
        '#Dica',
        '#Ferramentas',
        '#Transformação',
        '#ForgeDeals'
      ],
      engagement_prediction: metrics.engagement_prediction,
      brand_alignment: metrics.brand_alignment,
      production_complexity: template.complexity,
      target_audience: 'Jovens Profissionais',
      persona: 'influenciador_ferramentas',
      video_url: this.generateVideoUrl('reel'),
      thumbnail_url: this.generateThumbnailUrl('reel'),
      created_at: new Date().toISOString()
    };

    this.videoHistory.push(videoContent);
    return videoContent;
  }

  // Métodos de geração de script

  private async generateBrandingScript(template: VideoTemplate, context: any): Promise<string> {
    const brandMessage = context.brand_message || 'Conectamos profissionais com as melhores ferramentas';
    const callToAction = context.call_to_action || 'Siga nossa página e fique por dentro das melhores ofertas!';

    const prompt =`
Gere script para vídeo institucional ForgeDeals:

MENSAGEM DA MARCA: ${brandMessage}
CTA: ${callToAction}
PÚBLICO: ${context.target_audience}
DURAÇÃO: ${template.default_duration} segundos

ESTRUTURA:
${template.structure.sections.map(section => 
  `${section.type} (${section.duration}s): ${section.script_template}`
).join('\n')}

REGRAS:
- Tom profissional mas acessível
- Foco em confiança e qualidade
- Incluir valores da marca
- Linguagem clara e direta
- Máximo 100 palavras

Retorne apenas o script final:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim();
    } catch (error) {
      console.error('Error generating branding script:', error);
      return this.generateFallbackScript('branding');
    }
  }

  private async generateTutorialScript(
    template: VideoTemplate,
    topic: string,
    tool?: Product,
    context: any
  ): Promise<string> {
    const toolName = tool?.title || 'ferramenta selecionada';
    const difficulty = context.difficulty_level || 'beginner';

    const prompt =`
Gere script para vídeo tutorial sobre ${topic}:

FERRAMENTA: ${toolName}
DIFICULDADE: ${difficulty}
DURAÇÃO: ${template.default_duration} segundos
FOCOS: ${context.focus_points?.join(', ') || 'geral'}

ESTRUTURA:
${template.structure.sections.map(section => 
  `${section.type} (${section.duration}s): ${section.script_template}`
).join('\n')}

REGRAS:
- Passo a passo claro
- Linguagem adequada à dificuldade
- Incluir dicas práticas
- Tom educativo e amigável
- Máximo 120 palavras

Retorne apenas o script final:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim();
    } catch (error) {
      console.error('Error generating tutorial script:', error);
      return this.generateFallbackScript('tutorial');
    }
  }

  private async generateReviewScript(
    template: VideoTemplate,
    product: Product,
    context: any
  ): Promise<string> {
    const focus = context.review_focus || 'features';
    const comparison = context.comparison_product?.title;

    const prompt =`
Gere script para review do produto:

PRODUTO: ${product.title}
PREÇO: R$${product.price}
DESCONTO: ${product.discount}%
FOCO: ${focus}
COMPARAÇÃO: ${comparison || 'nenhum'}
HONESTO: ${context.honest_review || 'sim'}

DURAÇÃO: ${template.default_duration} segundos

ESTRUTURA:
${template.structure.sections.map(section => 
  `${section.type} (${section.duration}s): ${section.script_template}`
).join('\n')}

REGRAS:
- Análise honesta e transparente
- Destacar pontos fortes e fracos
- Incluir veredito claro
- Tom de especialista confiável
- Máximo 130 palavras

Retorne apenas o script final:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      return response.trim();
    } catch (error) {
      console.error('Error generating review script:', error);
      return this.generateFallbackScript('review');
    }
  }

  private async generatePromotionScript(
    template: VideoTemplate,
    product: Product,
    context: any
  ): Promise<string> {
    const urgency = context.urgency_level || 'medium';
    const timeLimit = context.time_limit || '48 horas';
    const specialOffer = context.special_offer || 'frete grátis';

    const prompt =`
Gere script para promoção em motion slide:

PRODUTO: ${product.title}
PREÇO: R$${product.price}
DESCONTO: ${context.discount_percentage}%
URGÊNCIA: ${urgency}
TEMPO LIMITE: ${timeLimit}
OFERTA ESPECIAL: ${specialOffer}

DURAÇÃO: ${template.default_duration} segundos

ESTRUTURA:
${template.structure.sections.map(section => 
  `${section.type} (${section.duration}s): ${section.script_template}`
).join('\n')}

REGRAS:
- Tom urgente mas não desesperado
- Destaque o valor e economia
- CTA claro e direto
- Energia positiva
- Máximo 80 palavras

Retorne apenas o script final:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim();
    } catch (error) {
      console.error('Error generating promotion script:', error);
      return this.generateFallbackScript('promotion');
    }
  }

  private async generateShortScript(
    template: VideoTemplate,
    topic: string,
    context: any
  ): Promise<string> {
    const style = context.style_preference || 'surprising';
    const trending = context.trending_hashtag || '#viral';

    const prompt =`
Gere script para short/TikTok sobre ${topic}:

ESTILO: ${style}
TRENDING: ${trending}
DURAÇÃO: ${template.default_duration} segundos

ESTRUTURA:
${template.structure.sections.map(section => 
  `${section.type} (${section.duration}s): ${section.script_template}`
).join('\n')}

REGRAS:
- Gancho nos primeiros 2 segundos
- Linguagem jovem e energética
- Surpresa ou curiosidade
- CTA para seguir
- Máximo 60 palavras
- Incluir hashtags relevantes

Retorne apenas o script final:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim();
    } catch (error) {
      console.error('Error generating short script:', error);
      return this.generateFallbackScript('short');
    }
  }

  private async generateReelScript(
    template: VideoTemplate,
    topic: string,
    context: any
  ): Promise<string> {
    const aesthetic = context.aesthetic_preference || 'modern';
    const mood = context.music_mood || 'inspiring';
    const cta = context.call_to_action || 'Salve este post!';

    const prompt =`
Gere script para Instagram Reel sobre ${topic}:

ESTÉTICA: ${aesthetic}
MUSICAL: ${mood}
CTA: ${cta}
DURAÇÃO: ${template.default_duration} segundos

ESTRUTURA:
${template.structure.sections.map(section => 
  `${section.type} (${section.duration}s): ${section.script_template}`
).join('\n')}

REGRAS:
- Visualmente atraente
- Tom inspirador
- Flow suave
- CTA para engajamento
- Máximo 90 palavras
- Estilo Instagram

Retorne apenas o script final:
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'llama3');
      return response.trim();
    } catch (error) {
      console.error('Error generating reel script:', error);
      return this.generateFallbackScript('reel');
    }
  }

  // Métodos de geração de elementos visuais

  private generateBrandingVisuals(template: VideoTemplate, context: any): VisualElement[] {
    return [
      {
        type: 'logo',
        content: this.brandAssets.get('logo')?.url || '',
        position: { x: 50, y: 20 },
        size: { width: 150, height: 60 },
        duration: { start: 0, end: 3 },
        animation: 'fade_in'
      },
      {
        type: 'text_overlay',
        content: 'Qualidade e Confiança',
        position: { x: 50, y: 200 },
        size: { width: 300, height: 60 },
        duration: { start: 5, end: 10 },
        animation: 'slide_up'
      },
      {
        type: 'background',
        content: 'brand_gradient',
        position: { x: 0, y: 0 },
        size: { width: 1080, height: 1920 },
        duration: { start: 0, end: 21 }
      }
    ];
  }

  private generateTutorialVisuals(template: VideoTemplate, tool?: Product, context?: any): VisualElement[] {
    return [
      {
        type: 'product_image',
        content: tool?.image || '',
        position: { x: 50, y: 300 },
        size: { width: 400, height: 300 },
        duration: { start: 2, end: 17 },
        animation: 'zoom_in'
      },
      {
        type: 'text_overlay',
        content: 'Passo 1',
        position: { x: 50, y: 100 },
        size: { width: 200, height: 40 },
        duration: { start: 2, end: 7 }
      },
      {
        type: 'text_overlay',
        content: 'Passo 2',
        position: { x: 50, y: 100 },
        size: { width: 200, height: 40 },
        duration: { start: 7, end: 12 }
      },
      {
        type: 'text_overlay',
        content: 'Resultado!',
        position: { x: 50, y: 150 },
        size: { width: 250, height: 50 },
        duration: { start: 12, end: 17 },
        animation: 'bounce'
      }
    ];
  }

  private generateReviewVisuals(template: VideoTemplate, product: Product, context: any): VisualElement[] {
    return [
      {
        type: 'product_image',
        content: product.image,
        position: { x: 50, y: 200 },
        size: { width: 350, height: 350 },
        duration: { start: 1, end: 19 },
        animation: 'rotate'
      },
      {
        type: 'text_overlay',
        content: `${product.discount}% OFF`,
        position: { x: 50, y: 100 },
        size: { width: 200, height: 60 },
        duration: { start: 3, end: 8 },
        animation: 'pulse'
      },
      {
        type: 'text_overlay',
        content: '⭐⭐⭐⭐',
        position: { x: 50, y: 600 },
        size: { width: 150, height: 40 },
        duration: { start: 10, end: 15 }
      }
    ];
  }

  private generatePromotionVisuals(template: VideoTemplate, product: Product, context: any): VisualElement[] {
    return [
      {
        type: 'product_image',
        content: product.image,
        position: { x: 50, y: 200 },
        size: { width: 400, height: 300 },
        duration: { start: 0, end: 12 },
        animation: 'shake'
      },
      {
        type: 'text_overlay',
        content: `${context.discount_percentage}% OFF`,
        position: { x: 50, y: 100 },
        size: { width: 250, height: 80 },
        duration: { start: 1, end: 8 },
        animation: 'flash'
      },
      {
        type: 'text_overlay',
        content: 'ÚLTIMAS UNIDADES!',
        position: { x: 50, y: 500 },
        size: { width: 300, height: 60 },
        duration: { start: 6, end: 12 },
        animation: 'bounce'
      }
    ];
  }

  private generateShortVisuals(template: VideoTemplate, topic: string, context: any): VisualElement[] {
    return [
      {
        type: 'text_overlay',
        content: 'VOCÊ NÃO VAI ACREDITAR!',
        position: { x: 50, y: 100 },
        size: { width: 350, height: 60 },
        duration: { start: 0, end: 3 },
        animation: 'jump'
      },
      {
        type: 'animation',
        content: 'surprise_effect',
        position: { x: 50, y: 300 },
        size: { width: 200, height: 200 },
        duration: { start: 3, end: 8 },
        animation: 'spin'
      },
      {
        type: 'text_overlay',
        content: 'SIMPLES E RÁPIDO!',
        position: { x: 50, y: 600 },
        size: { width: 250, height: 50 },
        duration: { start: 8, end: 13 },
        animation: 'slide_up'
      }
    ];
  }

  private generateReelVisuals(template: VideoTemplate, topic: string, context: any): VisualElement[] {
    return [
      {
        type: 'text_overlay',
        content: 'O SEGREDO PROFISSIONAL',
        position: { x: 50, y: 150 },
        size: { width: 300, height: 60 },
        duration: { start: 0, end: 4 },
        animation: 'fade_in'
      },
      {
        type: 'animation',
        content: 'elegant_transition',
        position: { x: 50, y: 400 },
        size: { width: 300, height: 200 },
        duration: { start: 4, end: 12 },
        animation: 'glide'
      },
      {
        type: 'text_overlay',
        content: 'TRANSFORME SEU TRABALHO',
        position: { x: 50, y: 700 },
        size: { width: 280, height: 50 },
        duration: { start: 12, end: 15 },
        animation: 'reveal'
      }
    ];
  }

  // Métodos de geração de elementos de áudio

  private generateBrandingAudio(template: VideoTemplate): AudioElement[] {
    return [
      {
        type: 'background_music',
        source: 'corporate_upbeat',
        volume: 0.3,
        duration: { start: 0, end: template.default_duration }
      },
      {
        type: 'sound_effect',
        source: 'logo_chime',
        volume: 0.5,
        duration: { start: 0, end: 1 }
      }
    ];
  }

  private generateTutorialAudio(template: VideoTemplate): AudioElement[] {
    return [
      {
        type: 'background_music',
        source: 'tutorial_friendly',
        volume: 0.2,
        duration: { start: 0, end: template.default_duration }
      },
      {
        type: 'voiceover',
        source: 'professional_voice',
        volume: 0.8,
        duration: { start: 1, end: template.default_duration - 1 }
      }
    ];
  }

  private generateReviewAudio(template: VideoTemplate): AudioElement[] {
    return [
      {
        type: 'background_music',
        source: 'tech_inspiration',
        volume: 0.25,
        duration: { start: 0, end: template.default_duration }
      },
      {
        type: 'voiceover',
        source: 'confident_voice',
        volume: 0.8,
        duration: { start: 1, end: template.default_duration - 1 }
      }
    ];
  }

  private generatePromotionAudio(template: VideoTemplate, urgency: string): AudioElement[] {
    const musicSource = urgency === 'critical' ? 'promotion_urgent' : 'energetic_motivation';
    
    return [
      {
        type: 'background_music',
        source: musicSource,
        volume: 0.4,
        duration: { start: 0, end: template.default_duration }
      },
      {
        type: 'sound_effect',
        source: urgency === 'critical' ? 'urgent_beep' : 'attention_chime',
        volume: 0.6,
        duration: { start: 1, end: 2 }
      }
    ];
  }

  private generateShortAudio(template: VideoTemplate, musicPreference?: string): AudioElement[] {
    const musicSource = musicPreference || 'social_trend';
    
    return [
      {
        type: 'background_music',
        source: musicSource,
        volume: 0.5,
        duration: { start: 0, end: template.default_duration }
      },
      {
        type: 'sound_effect',
        source: 'viral_hit',
        volume: 0.7,
        duration: { start: 2, end: 3 }
      }
    ];
  }

  private generateReelAudio(template: VideoTemplate, musicMood?: string): AudioElement[] {
    const musicSource = musicMood === 'energetic' ? 'energetic_motivation' : 
                        musicMood === 'calm' ? 'brand_ambient' : 'inspiring';
    
    return [
      {
        type: 'background_music',
        source: musicSource,
        volume: 0.3,
        duration: { start: 0, end: template.default_duration }
      },
      {
        type: 'sound_effect',
        source: 'smooth_transition',
        volume: 0.4,
        duration: { start: 4, end: 5 }
      }
    ];
  }

  // Métodos utilitários

  private generateCaptions(script: string): Caption[] {
    const words = script.split(' ');
    const captions: Caption[] = [];
    const wordsPerCaption = 5;
    
    for (let i = 0; i < words.length; i += wordsPerCaption) {
      const captionWords = words.slice(i, i + wordsPerCaption);
      captions.push({
        text: captionWords.join(' '),
        timestamp: (i / words.length) * 20, // Aproximado
        duration: 2,
        style: 'normal'
      });
    }
    
    return captions;
  }

  private async calculateVideoMetrics(script: string, videoType: string): Promise<{
    engagement_prediction: number;
    brand_alignment: number;
  }> {
    const prompt =`
Analise este vídeo para redes sociais:

SCRIPT: "${script}"
TIPO: ${videoType}

Retorne JSON com métricas:
{
  "engagement_prediction": 0-100,
  "brand_alignment": 0-100,
  "optimization_suggestions": ["sugestão1", "sugestão2"]
}
    `;

    try {
      const response = await this.ollamaService.generateText(prompt, 'deepseek');
      const result = JSON.parse(response);
      
      return {
        engagement_prediction: result.engagement_prediction,
        brand_alignment: result.brand_alignment
      };
    } catch (error) {
      console.error('Error calculating video metrics:', error);
      return {
        engagement_prediction: 75,
        brand_alignment: 80
      };
    }
  }

  private generateVideoUrl(type: string): string {
    return `https://forge-deals.com.br/videos/${type}_${Date.now()}.mp4`;
  }

  private generateThumbnailUrl(type: string): string {
    return `https://forge-deals.com.br/thumbnails/${type}_${Date.now()}.jpg`;
  }

  private generateFallbackScript(type: string): string {
    const fallbacks = {
      branding: 'Bem-vindo ao ForgeDeals! Conectamos profissionais com as melhores ferramentas. Qualidade e confiança em cada oferta. Siga nossa página!',
      tutorial: 'Veja como usar esta ferramenta passo a passo. Simples e rápido! Transforme seu trabalho com esta dica profissional.',
      review: 'Análise completa deste produto. Pontos fortes e fracos. Vale a pena? Confira nosso veredito honesto.',
      promotion: 'OFERTA IMPERDÍVEL! Desconto exclusivo por tempo limitado. Não perca esta oportunidade. Corre e garanta o seu!',
      short: 'VOCÊ NÃO VAI ACREDITAR neste truque! Simples, rápido e eficaz. Teste você mesmo! Siga para mais dicas!',
      reel: 'O segredo que todo profissional deveria saber. Transforme seu trabalho com esta dica. Salve este post!'
    };

    return fallbacks[type as keyof typeof fallbacks] || fallbacks.branding;
  }

  /**
   * Obtém vídeos recentes
   */
  getRecentVideos(limit: number = 10): VideoContent[] {
    return this.videoHistory
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Obtém vídeos por tipo
   */
  getVideosByType(type: string, limit: number = 5): VideoContent[] {
    return this.videoHistory
      .filter(video => video.type === type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  /**
   * Obtém estatísticas de vídeos
   */
  getVideoStats(): {
    total_videos: number;
    avg_engagement: number;
    avg_brand_alignment: number;
    best_type: string;
    type_distribution: Record<string, number>;
    production_complexity_distribution: Record<string, number>;
  } {
    const total = this.videoHistory.length;
    
    if (total === 0) {
      return {
        total_videos: 0,
        avg_engagement: 0,
        avg_brand_alignment: 0,
        best_type: 'branding',
        type_distribution: {},
        production_complexity_distribution: {}
      };
    }

    const avgEngagement = this.videoHistory.reduce((sum, v) => sum + v.engagement_prediction, 0) / total;
    const avgBrandAlignment = this.videoHistory.reduce((sum, v) => sum + v.brand_alignment, 0) / total;

    // Melhor tipo
    const typeStats = this.videoHistory.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bestType = Object.entries(typeStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'branding';

    // Distribuição de complexidade
    const complexityStats = this.videoHistory.reduce((acc, v) => {
      acc[v.production_complexity] = (acc[v.production_complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_videos: total,
      avg_engagement: Math.round(avgEngagement),
      avg_brand_alignment: Math.round(avgBrandAlignment),
      best_type: bestType,
      type_distribution: typeStats,
      production_complexity_distribution: complexityStats
    };
  }

  /**
   * Exporta dados do engine
   */
  exportEngineData(): {
    templates: VideoTemplate[];
    videoHistory: VideoContent[];
    brandAssets: Map<string, any>;
    musicLibrary: string[];
  } {
    return {
      templates: this.templates,
      videoHistory: this.videoHistory,
      brandAssets: this.brandAssets,
      musicLibrary: this.musicLibrary
    };
  }
}
