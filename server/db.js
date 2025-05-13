// Database connection setup
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

// Create the database client and connection
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// Export the client to allow closing the connection when needed
export const dbClient = client;