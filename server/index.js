/**
 * EventGenie AI - Express Backend Server
 * Production-ready server with security headers, CORS, rate limiting, and modular routing.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import eventRoutes from './routes/eventRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible client-side asset loading in dev/demo
  crossOriginEmbedderPolicy: false
}));

// 2. CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and non-browser clients
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key']
}));

// 3. Body Parser with 1MB size limit to prevent payload flooding
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate Limiting to prevent brute-force or abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// 5. API Health Check Endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EventGenie AI API',
    version: '1.0.0'
  });
});

// 6. Registered Feature Routes (supports both /api/* and direct path for serverless)
app.use('/api/events', eventRoutes);
app.use('/events', eventRoutes);

app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);

app.use('/api/export', exportRoutes);
app.use('/export', exportRoutes);

// 7. Serve Static Frontend in Production
const clientDistPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('EventGenie AI API Server is running. Start the frontend client with "npm run dev".');
    }
  });
});

// 8. Global Error Handler (Sanitizes stack traces)
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(status).json({
    success: false,
    error: isDev ? err.message : 'An internal server error occurred',
    ...(isDev && { stack: err.stack })
  });
});

import { pathToFileURL } from 'url';

// Start Server only if executed directly as entrypoint, not when imported by test suites
const isDirectRun = process.argv[1] && (
  import.meta.url === pathToFileURL(process.argv[1]).href ||
  process.argv[1].endsWith('server\\index.js') ||
  process.argv[1].endsWith('server/index.js')
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🧞 EventGenie AI Server running on http://localhost:${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI Status: http://localhost:${PORT}/api/ai/status\n`);
  });
}

export default app;

