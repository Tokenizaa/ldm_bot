import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  LOJA_DO_MECANICO_EMAIL: z.string().min(1).optional(),
  LOJA_DO_MECANICO_PASSWORD: z.string().min(1).optional(),
  API_PORT: z.string().default('3001'),
  API_HOST: z.string().default('0.0.0.0')
});

export type ApiEnv = z.infer<typeof EnvSchema>;

export function loadEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${message}`);
  }
  return parsed.data;
}
