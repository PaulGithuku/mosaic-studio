import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { env } from './server/config/env';
import { initDatabaseConnection } from './server/config/db';
import apiRouter from './server/routes/api';
import { errorHandler } from './server/middleware/errorHandler';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 10000;

  // Initialize Database
  await initDatabaseConnection();

  // Basic Security & Body Parsing Middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Serve persistent local media uploads statically
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Global Error Handler for API
  app.use('/api', errorHandler);

  // Vite middleware for development or Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Root error handler fallback
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MOSAIC STUDIO] Server running on http://0.0.0.0:${PORT} (Node ${process.version}, Mode: ${env.NODE_ENV}, Supabase Edition)`);
  });
}

startServer().catch((err) => {
  console.error('[MOSAIC STUDIO] Fatal startup error:', err);
  process.exit(1);
});
