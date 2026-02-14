import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import entityRoutes from './routes/entity.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes - upload routes must be registered first to avoid
// being caught by the generic /:entity pattern in entity routes
app.use('/api', uploadRoutes);
app.use('/api', entityRoutes);

// Serve frontend in production (when built frontend is available)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Not found',
    path: req.path
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
