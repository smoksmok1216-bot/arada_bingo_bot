import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import routesApi from './bingo-api/routes/index.js';

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors()); // You can restrict to your domain if needed
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use('/bingo-api', routesApi);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Screenshots
app.use('/audio', express.static(path.join(__dirname, 'public/audio'))); // Amharic audio
app.use('/', express.static(path.join(__dirname, 'bingo-frontend'))); // Telegram Web App

// Telegram Web App root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'bingo-frontend/index.html'));
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'bingo-frontend/admin/admin.html'));
});

// Error handler
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: err.name + ': ' + err.message });
  } else {
    next(err);
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
