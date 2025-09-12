import { z } from 'zod';

const envSchema = z.object({
  // META / WhatsApp Cloud API
  meta: z.object({
    phoneNumberId: z.string().min(1).optional(),
    accessToken: z.string().min(1).optional(),
    verifyToken: z.string().min(1).optional(),
    apiVersion: z.string().default('v20.0'),
  }),

  // SUPABASE
  supabase: z.object({
    url: z.string().url().optional(),
    anonKey: z.string().min(1).optional(),
    serviceRoleKey: z.string().min(1).optional(),
  }),

  // POSTGRES
  database: z.object({
    url: z.string().min(1).optional(),
  }),

  // OPENAI
  openai: z.object({
    apiKey: z.string().min(1).optional(),
    model: z.string().default('gpt-4o-mini'),
    temperature: z.string().transform(Number).default('0.3'),
  }),

  // GOOGLE
  google: z.object({
    saJsonBase64: z.string().optional(),
    calendarId: z.string().default('primary'),
  }),

  // APP
    app: z.object({
    url: z.string().url().default('http://localhost:3000'),
    timezone: z.string().default('America/Sao_Paulo'),
  }),

  // RD STATION
    rdstation: z.object({
    accessToken: z.string().min(1).optional(),
  }),

  megaApi: z.object({
    host: z.string().min(1).optional(),
    token: z.string().min(1).optional(),
  }),

  // NGROK
  ngrok: z.object({
    authToken: z.string().min(1).optional(),
  }),
});

export const env = envSchema.parse({
  meta: {
    phoneNumberId: process.env.META_PHONE_NUMBER_ID,
    accessToken: process.env.META_ACCESS_TOKEN,
    verifyToken: process.env.META_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    temperature: process.env.OPENAI_TEMPERATURE,
  },
  google: {
    saJsonBase64: process.env.GOOGLE_SA_JSON_BASE64,
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL,
    timezone: process.env.TZ,
  },
  rdstation: {
    accessToken: process.env.RDSTATION_ACCESS_TOKEN,
  },
  megaApi: {
    host: process.env.MEGA_API_HOST,
    token: process.env.MEGA_API_TOKEN,
  },
  ngrok: {
    authToken: process.env.NGROK_AUTHTOKEN,
  },
});
