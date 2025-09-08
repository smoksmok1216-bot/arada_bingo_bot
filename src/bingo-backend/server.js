import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route files
import referralRoute from './routes/referral.js';
import depositRoute from './routes/deposit.js';
import adminRoute from './routes/admin.js';
import healthRoute from './routes/health.js';
import playersRoute from './routes/players.js';
import statsRoute from './routes/stats.js';
import gameRoute from './routes/game.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // ✅ Enables frontend access from Netlify or Telegram Web App
app.use(express.json());
app.use(morgan('dev'));

// Static file serving for screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/referral', referralRoute);
app.use('/deposit', depositRoute);
app.use('/admin', adminRoute);
app.use('/health', healthRoute);
app.use('/players', playersRoute);
app.use('/stats', statsRoute);
app.use('/game', gameRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.send('🎯 Arada Bingo Bot backend is running');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
