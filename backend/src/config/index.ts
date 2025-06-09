import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define configuration schema
const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Authentication
  SESSION_SECRET: z.string(),
  
  // Notion
  NOTION_API_KEY: z.string().optional(),
  NOTION_DATABASE_ID: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // WhatsApp
  WHATSAPP_API_KEY: z.string().optional(),
});

// Parse and validate configuration
const config = configSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
});

export default config; 