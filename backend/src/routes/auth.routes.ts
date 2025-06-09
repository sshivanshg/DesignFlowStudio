import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuthController } from '../controllers/auth/auth.controller';
import passport from 'passport';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', passport.authenticate('local'), authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/supabase-auth', authController.supabaseAuth.bind(authController));

// Protected routes
router.get('/me', requireAuth, authController.getCurrentUser.bind(authController));
router.post('/logout', requireAuth, authController.logout.bind(authController));

export default router; 