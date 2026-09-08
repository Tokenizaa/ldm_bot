#!/usr/bin/env node
/**
 * FORGEDEALS - EXECUTOR SIMPLES
 * 
 * Backend simplificado que apenas executa comandos do frontend
 * Sem decisões automáticas, sem bootstraps complexos
 */

import dotenv from 'dotenv';
import { ForgeDealsExecutor } from './core/Executor';

dotenv.config();

interface Command {
  type: 'crawl' | 'publish' | 'generate' | 'status';
  config?: any;
  data?: any;
}

class SimpleBackend {
  private executor: ForgeDealsExecutor;

  constructor() {
    this.executor = new ForgeDealsExecutor({
      facebook: {
        postsPerDay: 10,
        delayBetweenPosts: 120,
        activeHours: [9, 13, 17, 20],
        activeGroups: [],
        defaultCTA: 'Confira esta oferta! 👉',
        mode: 'safe',
        humanizationLevel: 75
      },
      ollama: {
        activeModel: 'llama3:8b',
        temperature: 0.7,
        maxTokens: 150,
        copyStyle: 'enthusiastic',
        useEmojis: true,
        includeCTA: true,
        writingTone: 'promotional'
      },
      crawler: {
        activeCategories: [],
        maxProducts: 10,
        scrapingDelay: 2,
        minScore: 30,
        priorityCategories: []
      },
      planning: {
        promotionalPosts: 4,
        educationalPosts: 3,
        engagementPosts: 2,
        institutionalPosts: 1,
        totalDailyPosts: 10,
        rotationStrategy: 'balanced'
      },
      system: {
        autoStart: false,
        logLevel: 'info',
        backupEnabled: true,
        emergencyStop: true
      }
    });
  }

  async execute(command: Command): Promise<any> {
    try {
      console.log(`🔧 Executando: ${command.type}`);

      switch (command.type) {
        case 'crawl':
          return await this.executor.executeCrawl();
        
        case 'generate':
          if (!command.data?.product) {
            throw new Error('Produto não fornecido para geração');
          }
          return await this.executor.generateContent(command.data.product);
        
        case 'publish':
          if (!command.data?.content || !command.data?.groupName) {
            throw new Error('Conteúdo ou grupo não fornecido para publicação');
          }
          return await this.executor.publishToFacebook(command.data.content, command.data.groupName);
        
        case 'status':
          return {
            status: 'ready',
            config: this.executor.getConfig(),
            timestamp: new Date().toISOString()
          };
        
        default:
          throw new Error(`Comando desconhecido: ${command.type}`);
      }
    } catch (error) {
      console.error('❌ Erro na execução:', error);
      throw error;
    }
  }

  updateConfig(newConfig: any): void {
    this.executor.updateConfig(newConfig);
  }

  async cleanup(): Promise<void> {
    await this.executor.cleanup();
  }
}

// API HTTP simples para comunicação com frontend
import { createServer } from 'http';

const server = createServer(async (req, res) => {
  const backend = new SimpleBackend();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const command: Command = JSON.parse(body);
        
        // Atualizar config se fornecida
        if (command.config) {
          backend.updateConfig(command.config);
        }
        
        const result = await backend.execute(command);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: result }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        }));
      }
    });
  } else if (req.method === 'GET') {
    try {
      const result = await backend.execute({ type: 'status' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: result }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }));
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Método não permitido' }));
  }
});

// Iniciar servidor
const PORT = process.env.BACKEND_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 ForgeDeals Backend Simplificado rodando na porta ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`💡 Frontend controla tudo via configuração`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, finalizando...');
  const backend = new SimpleBackend();
  await backend.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, finalizando...');
  const backend = new SimpleBackend();
  await backend.cleanup();
  process.exit(0);
});
