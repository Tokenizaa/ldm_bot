import { SystemConfig } from '../types/config';
import { LojaDoMecanicoCrawler } from '../crawler';
import { FacebookPublisher } from '../facebook';
import { OllamaService } from '../ollama';
import { SupabaseService } from '../database';
import { ProductScorer } from '../planner/productScore';
import { AntiRepetition } from '../planner/antiRepetition';
import { CategoryRotation } from '../planner/categoryRotation';

export class ForgeDealsExecutor {
  private config: SystemConfig;
  private crawler: LojaDoMecanicoCrawler;
  private facebook: FacebookPublisher;
  private ollama: OllamaService;
  private database: SupabaseService;
  private scorer: ProductScorer;
  private antiRepetition: AntiRepetition;
  private categoryRotation: CategoryRotation;

  constructor(config: SystemConfig) {
    this.config = config;
    this.crawler = new LojaDoMecanicoCrawler({
      email: process.env.LOJA_DO_MECANICO_EMAIL!,
      password: process.env.LOJA_DO_MECANICO_PASSWORD!,
      rateLimit: config.crawler.scrapingDelay * 1000,
      autoLogin: true
    });
    this.facebook = new FacebookPublisher();
    this.ollama = new OllamaService({
      baseUrl: process.env.OLLAMA_BASE_URL,
      defaultModel: config.ollama.activeModel,
      timeout: 90000
    });
    this.database = new SupabaseService();
    this.scorer = new ProductScorer();
    this.antiRepetition = new AntiRepetition();
    this.categoryRotation = new CategoryRotation();
  }

  async executeCrawl(): Promise<any[]> {
    try {
      await this.crawler.initialize();
      
      // Usar categorias configuradas no frontend
      const activeCategory = this.categoryRotation.chooseRandomCategory();
      const products = await this.crawler.extractProductsFromCategory(activeCategory.url);
      
      // Aplicar score mínimo configurado
      const scoredProducts = products.map(product => 
        this.scorer.calculateScore(product, [], [])
      );
      
      const filteredProducts = this.scorer.filterByMinScore(
        scoredProducts, 
        this.config.crawler.minScore
      );
      
      return filteredProducts.slice(0, this.config.crawler.maxProducts);
    } catch (error) {
      console.error('Erro na execução do crawler:', error);
      throw error;
    } finally {
      await this.crawler.close();
    }
  }

  async generateContent(product: any): Promise<string> {
    const prompt = this.buildPrompt(product);
    return await this.ollama.generateText(prompt, this.config.ollama.activeModel);
  }

  async publishToFacebook(content: string, groupName: string): Promise<any> {
    await this.facebook.initialize();
    
    const result = await this.facebook.publishPost(
      { text: content, link: '' },
      groupName
    );
    
    return result;
  }

  async saveProduct(product: any): Promise<any> {
    return await this.database.saveProduct(product);
  }

  async savePost(post: any): Promise<any> {
    return await this.database.createPost(post);
  }

  private buildPrompt(product: any): string {
    const { ollama } = this.config;
    
    let prompt = `Crie uma ${ollama.copyStyle} para este produto da Loja do Mecânico:\n\n`;
    prompt += `Título: ${product.title}\n`;
    prompt += `Preço: R$ ${product.price}\n`;
    prompt += `Marca: ${product.brand}\n`;
    prompt += `Categoria: ${product.category}\n\n`;
    
    prompt += `A copy deve:\n`;
    prompt += `- Ter no máximo ${ollama.maxTokens} caracteres\n`;
    prompt += `- Usar tom ${ollama.writingTone}\n`;
    prompt += `- Estilo ${ollama.copyStyle}\n`;
    
    if (ollama.useEmojis) {
      prompt += `- Incluir emojis relevantes\n`;
    }
    
    if (ollama.includeCTA) {
      prompt += `- Incluir call-to-action: ${this.config.facebook.defaultCTA}\n`;
    }
    
    prompt += `\nResponda apenas com a copy, sem explicações.`;
    
    return prompt;
  }

  updateConfig(newConfig: SystemConfig): void {
    this.config = newConfig;
    
    // Recriar serviços com nova configuração
    this.ollama = new OllamaService({
      baseUrl: process.env.OLLAMA_BASE_URL,
      defaultModel: newConfig.ollama.activeModel,
      timeout: 90000
    });
  }

  getConfig(): SystemConfig {
    return { ...this.config };
  }

  async cleanup(): Promise<void> {
    await this.crawler.close();
    await this.facebook.cleanup();
  }
}
