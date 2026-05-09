#!/usr/bin/env node
/**
 * FORGEDEALS BOT - FLUXO SIMPLIFICADO COM PERSISTENT CONTEXT
 * 
 * 1. Iniciar browser persistente
 * 2. Raspar produtos Loja do Mecânico
 * 3. Gerar copy com Ollama
 * 4. Salvar no Supabase
 * 5. Postar no Facebook
 * 6. Salvar status
 * 7. Finalizar
 */

import dotenv from 'dotenv';

dotenv.config();

interface Product {
  id?: string;
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

function log(level: 'info' | 'warn' | 'error', data: any, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
}

async function main() {
  const startTime = Date.now();
  log('info', { service: 'forge-deals-bot' }, '🚀 Iniciando bot ForgeDeals - Modo de Desenvolvimento (sem raspagem automática)');

  try {
    // Validar variáveis de ambiente
    if (!process.env.LOJA_DO_MECANICO_EMAIL || !process.env.LOJA_DO_MECANICO_PASSWORD) {
      throw new Error('Missing required env vars: LOJA_DO_MECANICO_EMAIL / LOJA_DO_MECANICO_PASSWORD');
    }

    // Opcional: Pular Supabase se não configurado para testes
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
      log('warn', { service: 'forge-deals-bot' }, '⚠️ Supabase não configurado - pulando conexão com banco');
    }

    log('info', { service: 'forge-deals-bot' }, '✅ Ambiente validado');

    // Modo de desenvolvimento - sem inicialização de componentes complexos
    log('info', { service: 'forge-deals-bot' }, '⏸️ Bot em modo de desenvolvimento - sem raspagem automática');
    log('info', { service: 'forge-deals-bot' }, '📝 Use o frontend para controlar operações');

    // Manter o processo ativo para desenvolvimento
    log('info', { service: 'forge-deals-bot' }, '🔄 Serviços rodando em modo de desenvolvimento...');
    
    // Manter o processo vivo (para desenvolvimento)
    setInterval(() => {
      log('info', { service: 'forge-deals-bot' }, '💓 Bot ativo - pronto para comandos');
    }, 60000); // Heartbeat a cada 60 segundos

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    log('error', { 
      service: 'forge-deals-bot',
      duration: duration,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, '❌ Falha na inicialização do bot ForgeDeals');
    
    process.exitCode = 1;
  }
}

// Função para executar raspagem manualmente (se necessário)
async function runCrawlerManually() {
  log('info', { service: 'forge-deals-bot' }, '🔧 Iniciando raspagem manual...');
  
  try {
    // Aqui pode-se adicionar a lógica de raspagem manual
    // Por enquanto, apenas um placeholder
    log('info', { service: 'forge-deals-bot' }, '⚠️ Função de raspagem manual ainda não implementada');
  } catch (error) {
    log('error', { service: 'forge-deals-bot', error: error instanceof Error ? error.message : String(error) }, '❌ Erro na raspagem manual');
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
