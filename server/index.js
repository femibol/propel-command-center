import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import timelyRoutes from './routes/timely.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// CORS — allow localhost in dev, everything in prod (same-origin)
if (isProduction) {
  app.use(cors());
} else {
  app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
}
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: isProduction ? 'production' : 'development' });
});

// API Routes
app.use('/api/timely', timelyRoutes);
app.use('/api/ai', aiRoutes);

// Serve static frontend in production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else if (isProduction) {
  console.warn('WARNING: dist/ folder not found. Run "npm run build" first.');
  app.get('*', (req, res) => {
    res.status(503).json({ error: 'Frontend not built. Run npm run build.' });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`PROPEL server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});
