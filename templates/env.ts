// Boot-time environment validation. Import this ONCE at startup (before anything reads config)
// so the app fails fast with a clear message when a required secret/config is missing — instead
// of crashing later at first use with a cryptic error.
//
// Rules this enforces:
//   - Secrets come from the environment ONLY. Never hard-code them; never commit a real .env.
//   - Every required key here must also appear (as a placeholder) in .env.example.
//
// zod v3/v4 compatible (uses error.issues, present in both).
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  // Add required secrets/config below. Example:
  // API_KEY: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

export const env = parsed.data;
