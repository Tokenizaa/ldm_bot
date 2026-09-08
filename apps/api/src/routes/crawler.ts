import { FastifyInstance } from 'fastify';
import { CrawlerService } from '../services/crawlerService';
import { loadConfig } from '../config/configStore';

export async function crawlerRoutes(fastify: FastifyInstance) {
  // POST /api/crawler/run - Execute crawler
  fastify.post('/crawler/run', async () => {
    const config = await loadConfig();
    const crawler = new CrawlerService(config);
    
    const result = await crawler.runCrawl();
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return { 
      success: true, 
      data: { 
        productsFound: result.products.length,
        products: result.products 
      } 
    };
  });

  // GET /api/crawler/categories - Get available categories
  fastify.get('/crawler/categories', async () => {
    const { CATEGORIES } = await import('../../web/src/planner/categoryRotation');
    const config = await loadConfig();
    
    return { 
      success: true, 
      data: {
        all: CATEGORIES,
        active: config.crawler.activeCategories
      }
    };
  });

  // POST /api/crawler/test-category - Test extraction from specific category
  fastify.post('/crawler/test-category', async (request, reply) => {
    const { url } = request.body as { url?: string };
    
    if (!url) {
      return reply.status(400).send({ success: false, error: 'URL é obrigatória' });
    }

    const config = await loadConfig();
    const crawler = new CrawlerService(config);
    
    try {
      await crawler.initialize();
      await crawler.login();
      const products = await crawler.extractProductsFromCategory(url);
      
      return { 
        success: true, 
        data: { 
          productsFound: products.length,
          products: products.slice(0, 5) // Return first 5 for preview
        } 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      await crawler.close();
    }
  });
}