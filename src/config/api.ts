/**
 * Configuração da API
 * 
 * Este arquivo centraliza todas as configurações relacionadas à comunicação
 * com o backend. As variáveis de ambiente são definidas em:
 * - .env (desenvolvimento local)
 * - Variáveis de ambiente da Vercel (produção)
 */

export const API_CONFIG = {
  // URL base da API - vem das variáveis de ambiente
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Ambiente atual
  env: import.meta.env.VITE_ENV || 'development',
  
  // Timeout padrão para requisições (em milissegundos)
  timeout: 30000,
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// Verifica se está em produção
export const isProduction = API_CONFIG.env === 'production';

// Verifica se está em desenvolvimento
export const isDevelopment = API_CONFIG.env === 'development';

// Log de configuração (apenas em desenvolvimento)
if (isDevelopment) {
  console.log('🔧 API Configuration:', {
    baseURL: API_CONFIG.baseURL,
    env: API_CONFIG.env,
  });
}
