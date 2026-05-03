import 'server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_DIRECT: z.string().url().optional(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  LINE_LOGIN_CHANNEL_ID: z.string().min(1).optional(),
  LINE_LOGIN_CHANNEL_SECRET: z.string().min(1).optional(),
  LINE_MESSAGING_CHANNEL_ID: z.string().min(1).optional(),
  LINE_MESSAGING_CHANNEL_SECRET: z.string().min(1).optional(),
  LINE_MESSAGING_ACCESS_TOKEN: z.string().min(1).optional(),
  LINE_OFFICIAL_ID: z.string().min(1).optional(),
  LINE_JWT_SECRET: z.string().min(32, 'LINE_JWT_SECRET must be at least 32 chars'),

  ECPAY_MERCHANT_ID: z.string().optional(),
  ECPAY_HASH_KEY: z.string().optional(),
  ECPAY_HASH_IV: z.string().optional(),
  ECPAY_RETURN_URL: z.string().url().optional(),
  ECPAY_NOTIFY_URL: z.string().url().optional(),
  ECPAY_ENV: z.enum(['stage', 'production']).default('stage'),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  RAKUTEN_APP_ID: z.string().optional(),

  CF_ACCOUNT_ID: z.string().optional(),
  CF_IMAGES_TOKEN: z.string().optional(),
  CF_R2_ACCESS_KEY: z.string().optional(),
  CF_R2_SECRET_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  COMPANY_TAX_ID: z.string().default('60766849'),
  COMPANY_NAME: z.string().optional(),
})

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SITE_NAME: z.string().default('熙熙初日｜日系選物店'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

export const serverEnv = serverEnvSchema.parse(process.env)
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type PublicEnv = z.infer<typeof publicEnvSchema>
