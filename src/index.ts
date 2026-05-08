#!/usr/bin/env node
/**
 * FORGEDEALS BOT - FLUXO OPERACIONAL LINEAR
 * 
 * 1. Conectar Chrome CDP
 * 2. Validar sessão Facebook
 * 3. Raspar produtos Loja do Mecânico
 * 4. Gerar copy com Ollama
 * 5. Salvar no Supabase
 * 6. Postar no Facebook
 * 7. Salvar status
 * 8. Finalizar
 */

import { log } from './utils/logger';
import { loadEnv } from './utils/env';
import { ChromeConnector } from './browser/chromeConnector';
import { SimpleSessionMonitor } from './browser/sessionMonitor';
import { LojaDoMecanicoCrawler } from './crawler/LojaDoMecanicoCrawler';
import { OllamaService } from './ai/ollama';
import { FacebookPublisher } from './facebook/facebook';
import { SupabaseService } from './database/supabase';

interface Product {
  id: string;
  title: string;
  price: number;
  old_price: number;
  image: string;
  affiliate_url: string;
  category: string;
  brand: string;
}

interface Post {
  id?: string;
  product_id: string;
  facebook_post_id: string;
  status: 'pending' | 'posted' | 'failed';
  created_at?: string;
}

async function main() {
  const startTime = Date.now();
  log('info', { service: 'forge-deals-bot' }, '🚀 Iniciando bot ForgeDeals');

  try {
    // Carregar ambiente
    const env = loadEnv();
    log('info', { service: 'forge-deals-bot', env: env.NODE_ENV }, '✅ Ambiente carregado');

    // 1. Conectar Chrome CDP
    log('info', { service: 'forge-deals-bot' }, '🔌 Conectando Chrome CDP...');
    const chromeConnector = ChromeConnector.getInstance();
    const connection = await chromeConnector.getConnection();
    log('info', { service: 'forge-deals-bot' }, '✅ Chrome CDP conectado');

    // 2. Validar sessão Facebook
    log('info', { service: 'forge-deals-bot' }, '👤 Validando sessão Facebook...');
    const sessionMonitor = SimpleSessionMonitor.getInstance();
    const facebookSession = await sessionMonitor.validateFacebookSession();
    if (!facebookSession) {
      throw new Error('Sessão Facebook não está ativa');
    }
    log('info', { service: 'forge-deals-bot' }, '✅ Sessão Facebook validada');

    // 3. Raspar produtos Loja do Mecânico
    log('info', { service: 'forge-deals-bot' }, '🛒 Raspar produtos Loja do Mecânico...');
    const crawler = new LojaDoMecanicoCrawler({
      email: env.LOJA_DO_MECANICO_EMAIL!,
      password: env.LOJA_DO_MECANICO_PASSWORD!,
      rateLimit: 2000,
      autoLogin: true
    });

    await crawler.initialize();
    const loginSuccess = await crawler.login();
    if (!loginSuccess) {
      throw new Error('Falha no login Loja do Mecânico');
    }

    const products = await crawler.extractProductsFromCategory();
    if (products.length === 0) {
      log('warn', { service: 'forge-deals-bot' }, '⚠️ Nenhum produto encontrado');
      return;
    }

    log('info', { service: 'forge-deals-bot', count: products.length }, '✅ Produtos extraídos');

    // 4. Gerar copy com Ollama
    log('info', { service: 'forge-deals-bot' }, '🤖 Gerando copy com Ollama...');
    const ollama = new OllamaService();
    
    // Selecionar produto aleatório para postar
    const selectedProduct = products[Math.floor(Math.random() * products.length)];
    
    const copy = await ollama.generateCopy(selectedProduct);
    log('info', { service: 'forge-deals-bot', productTitle: selectedProduct.title }, '✅ Copy gerada');

    // 5. Salvar no Supabase
    log('info', { service: 'forge-deals-bot' }, '💾 Salvando no Supabase...');
    const supabase = new SupabaseService();
    
    // Salvar produto
    const savedProduct = await supabase.saveProduct(selectedProduct);
    
    // Criar registro de post
    const post: Omit<Post, 'id' | 'created_at'> = {
      product_id: savedProduct.id || '',
      facebook_post_id: '',
      status: 'pending'
    };
    
    const savedPost = await supabase.createPost(post);
    log('info', { service: 'forge-deals-bot', productId: savedProduct.id, postId: savedPost.id }, '✅ Dados salvos');

    // 6. Postar no Facebook
    log('info', { service: 'forge-deals-bot' }, '📘 Postando no Facebook...');
    const facebook = new FacebookPublisher();
    
    await facebook.initialize();
    
    const postContent = {
      text: copy,
      imageUrl: selectedProduct.image,
      link: selectedProduct.affiliate_url
    };

    const facebookResult = await facebook.publishPost(postContent, 'A Loja Do Mecânico');
    
    if (!facebookResult.success) {
      throw new Error(`Falha ao postar no Facebook: ${facebookResult.error}`);
    }

    // 7. Salvar status
    log('info', { service: 'forge-deals-bot' }, '💾 Atualizando status do post...');
    await supabase.updatePostStatus(savedPost.id || '', 'posted', facebookResult.postId || '');
    log('info', { service: 'forge-deals-bot', facebookPostId: facebookResult.postId }, '✅ Status atualizado');

    // 8. Finalizar
    const duration = Date.now() - startTime;
    log('info', { 
      service: 'forge-deals-bot',
      duration: duration,
      productTitle: selectedProduct.title,
      facebookPostId: facebookResult.postId
    }, '🎉 Bot ForgeDeals executado com sucesso!');

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    log('error', { 
      service: 'forge-deals-bot',
      duration: duration,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, '❌ Falha na execução do bot ForgeDeals');
    
    process.exitCode = 1;
  } finally {
    // Cleanup
    try {
      const chromeConnector = ChromeConnector.getInstance();
      await chromeConnector.disconnect();
      log('info', { service: 'forge-deals-bot' }, '🧹 Chrome desconectado');
    } catch (cleanupError) {
      log('warn', { service: 'forge-deals-bot', error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) }, '⚠️ Erro no cleanup');
    }
  }
}

// Executar main
main().catch((error) => {
  log('error', { 
    service: 'forge-deals-bot',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  }, '💥 Erro fatal na execução');
  process.exit(1);
});
