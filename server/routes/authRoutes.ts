import { Router } from 'express';
import { authController, registerSchema, loginSchema } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;
