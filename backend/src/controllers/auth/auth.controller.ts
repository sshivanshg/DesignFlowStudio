import { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../../services/storage';
import { insertUserSchema } from '../../models/schema';
import { AppError } from '../../middleware/errorHandler';

export class AuthController {
  async login(req: Request, res: Response) {
    // Passport handles the actual authentication
    res.json({ user: req.user });
  }

  async register(req: Request, res: Response) {
    try {
      console.log("Registration attempt with data:", {
        ...req.body,
        password: req.body.password ? "[REDACTED]" : undefined
      });
      
      let userData = req.body;
      if (!userData.name && userData.fullName) {
        userData.name = userData.fullName;
      }

      try {
        userData = insertUserSchema.parse(userData);
      } catch (zodError) {
        console.error("Validation error:", zodError);
        if (zodError instanceof z.ZodError) {
          throw new AppError(400, "Validation error", zodError.errors);
        }
        throw zodError;
      }
      
      // Check for existing users
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        throw new AppError(400, "Username already exists");
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new AppError(400, "Email already exists");
      }
      
      if (userData.supabaseUid) {
        const existingUserBySupabaseUid = await storage.getUserBySupabaseUid(userData.supabaseUid);
        if (existingUserBySupabaseUid) {
          throw new AppError(400, "User with this Supabase ID already exists");
        }
      }
      
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user.id);
      
      // Auto login after registration
      req.login(user, (err) => {
        if (err) {
          throw new AppError(500, "Error logging in after registration");
        }
        return res.status(201).json({ user });
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message,
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ 
        message: "Error creating user. Please try again later." 
      });
    }
  }

  async logout(req: Request, res: Response) {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  }

  async getCurrentUser(req: Request, res: Response) {
    res.json({ user: req.user });
  }

  async supabaseAuth(req: Request, res: Response) {
    try {
      const { supabaseUid, email } = req.body;
      
      if (!supabaseUid || !email) {
        throw new AppError(400, "Supabase UID and email are required");
      }

      let user = await storage.getUserBySupabaseUid(supabaseUid);
      
      if (!user) {
        // Create new user if doesn't exist
        user = await storage.createUser({
          supabaseUid,
          email,
          username: email.split('@')[0],
          name: email.split('@')[0],
          role: 'user'
        });
      }

      req.login(user, (err) => {
        if (err) {
          throw new AppError(500, "Error logging in after Supabase auth");
        }
        return res.json({ user });
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error("Supabase auth error:", error);
      return res.status(500).json({ 
        message: "Error during Supabase authentication" 
      });
    }
  }
} 