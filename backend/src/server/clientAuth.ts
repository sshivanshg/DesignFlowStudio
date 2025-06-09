import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { clients, User } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { IStorage } from './storage';
import { Express, Router } from 'express';
import { Request, Response } from 'express';
import { storage } from '../config/storage.config';
import { isClientAuthenticated } from '../middleware/auth.middleware';

// Store auth tokens with expiration times (24 hours)
const clientTokens: Record<string, { clientId: number, expires: Date }> = {};

/**
 * Generate a one-time login token for client portal access
 * @param clientId The client ID to generate a token for
 * @returns The generated token
 */
export async function generateClientToken(clientId: number, storage: IStorage): Promise<string> {
  // Get the client to verify they exist
  const client = await storage.getClient(clientId);
  
  if (!client) {
    throw new Error(`Client with ID ${clientId} not found`);
  }
  
  // Generate a unique token
  const token = uuidv4();
  
  // Set expiration to 24 hours from now
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  // Store token with client ID and expiry
  clientTokens[token] = { clientId, expires };
  
  return token;
}

/**
 * Validate a client token
 * @param token The token to validate
 * @returns The client ID if valid, null otherwise
 */
export function validateClientToken(token: string): number | null {
  if (!clientTokens[token]) {
    return null;
  }
  
  const { clientId, expires } = clientTokens[token];
  
  // Check if token has expired
  if (new Date() > expires) {
    // Clean up expired token
    delete clientTokens[token];
    return null;
  }
  
  return clientId;
}

/**
 * Mark that a client has logged in (updates last_login timestamp)
 * @param clientId The client ID that logged in
 */
export async function markClientLogin(clientId: number, storage: IStorage): Promise<void> {
  // Update client's last login timestamp
  await storage.updateClient(clientId, { 
    last_login: new Date(),
    portal_access: true
  });
}

/**
 * Check if client has portal access
 * @param clientId The client ID to check
 * @returns True if client has portal access, false otherwise
 */
export async function hasPortalAccess(clientId: number, storage: IStorage): Promise<boolean> {
  const client = await storage.getClient(clientId);
  return client?.portal_access === true;
}

/**
 * Send an email with a login link to the client
 * @param clientEmail The client's email address
 * @param token The login token
 */
export async function sendClientLoginEmail(clientEmail: string, token: string): Promise<void> {
  // In a real implementation, this would send an email with a login link
  // For now, we'll just log the token for testing purposes
  console.log(`[CLIENT AUTH] Login link for ${clientEmail}: /client-portal/login?token=${token}`);
  
  // Here you would typically use an email service like SendGrid or Nodemailer
  // to send the actual email with the login link
}

export function registerClientAuthRoutes() {
  const router = Router();

  // Client authentication routes
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const client = await storage.authenticateClient(email, password);
      
      if (!client) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.clientId = client.id;
      res.json({ client });
    } catch (error) {
      res.status(500).json({ message: 'Error during client login', error });
    }
  });

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, company } = req.body;
      const client = await storage.createClient({ email, password, name, company });
      
      req.session.clientId = client.id;
      res.status(201).json({ client });
    } catch (error) {
      res.status(500).json({ message: 'Error during client registration', error });
    }
  });

  router.post('/logout', isClientAuthenticated, (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout', error: err });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  router.get('/me', isClientAuthenticated, async (req: Request, res: Response) => {
    try {
      const client = await storage.getClientById(req.session.clientId);
      res.json({ client });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching client data', error });
    }
  });

  return router;
}