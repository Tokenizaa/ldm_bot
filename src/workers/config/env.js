import dotenv from 'dotenv';
dotenv.config();

const config = {
  // API Configuration
  INGEST_API: process.env.INGEST_API || 'http://localhost:8080/api/public/ingest',
  
  // Loja do Mecânico URLs
  LOGIN_URL: process.env.LOGIN_URL || 'https://www.lojadomecanico.com.br/login',
  CATEGORY_URL: process.env.CATEGORY_URL || 'https://www.lojadomecanico.com.br/categorias/21/maquinas-eletricas',
  
  // Browser Configuration
  HEADLESS: process.env.HEADLESS === 'true',
  
  // Rate Limiting (milliseconds)
  DELAY_BETWEEN_PRODUCTS: parseInt(process.env.DELAY_BETWEEN_PRODUCTS) || 3000,
  DELAY_BETWEEN_REQUESTS: parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 1000,
  
  // Product Limits
  MAX_PRODUCTS_PER_RUN: parseInt(process.env.MAX_PRODUCTS_PER_RUN) || 10,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Paths
  AUTH_PATH: './src/workers/auth/auth.json',
  LOGS_PATH: './src/workers/logs/worker.log',
  SCREENSHOTS_PATH: './src/workers/screenshots'
};

// Validate required environment variables
const required = ['INGEST_API'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

module.exports = config;
