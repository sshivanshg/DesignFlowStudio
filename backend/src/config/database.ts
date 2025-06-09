import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import config from './index';
import * as schema from '../models/schema';

// Create postgres connection
const connectionString = config.DATABASE_URL;
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export for use in other files
export default db; 