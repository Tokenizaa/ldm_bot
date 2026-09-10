import { getSupabaseAdmin } from '../services/supabaseAdmin.js';
import type { SystemConfig } from '@forge-deals/shared/types/config';
import { DEFAULT_CONFIG } from '@forge-deals/shared/types/config';

const CONFIG_TABLE = 'system_config';
const CONFIG_KEY = 'main';

export async function loadConfig(): Promise<SystemConfig> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from(CONFIG_TABLE).select('config').eq('key', CONFIG_KEY).maybeSingle();
  if (error) {
    console.error('Error loading config:', error);
    throw new Error('Não foi possível carregar a configuração do banco de dados');
  }
  if (data?.config) return { ...DEFAULT_CONFIG, ...data.config };
  await saveConfig(DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

export async function saveConfig(config: SystemConfig): Promise<SystemConfig> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(CONFIG_TABLE).upsert({ key: CONFIG_KEY, config, updated_at: new Date().toISOString() });
  if (error) {
    console.error('Error saving config:', error);
    throw error;
  }
  return config;
}

export async function updateConfig(partial: Partial<SystemConfig>): Promise<SystemConfig> {
  const current = await loadConfig();
  const merged = deepMerge(current, partial);
  return saveConfig(merged);
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) result[key] = deepMerge(target[key] || {}, source[key]);
    else result[key] = source[key];
  }
  return result;
}
