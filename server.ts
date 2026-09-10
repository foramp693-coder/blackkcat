import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { dbBackend } from './server/dbBackend';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize unified database backend (PostgreSQL / SQLite fallback)
  await dbBackend.init();

  // Body parsing for JSON and raw text/CSV
  app.use(express.json({ limit: '20mb' }));
  app.use(express.text({ limit: '20mb', type: ['text/csv', 'text/plain'] }));

  // CORS / Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Active database health verification endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const health = await dbBackend.getDatabaseHealth();
      const isConnected = health.status === 'HEALTHY';
      res.status(isConnected ? 200 : 503).json({
        status: isConnected ? 'ok' : 'degraded',
        database: isConnected ? 'connected' : 'disconnected',
        databaseEngine: health.databaseEngine,
        platform: 'SAT-SA Supervisory Analytics',
        sih: 'SIH26157',
        integrityStatus: health.integrityStatus,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Mount primary SAT-SA API routes
  app.use('/api', apiRouter);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SAT-SA] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SAT-SA] Failed to start server:', err);
  process.exit(1);
});
