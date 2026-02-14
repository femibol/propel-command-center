import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import timelyRoutes from './routes/timely.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/timely', timelyRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`PROPEL API server running on port ${PORT}`);
});
