// db.js
import mongoose from 'mongoose';

export async function initDb(dbUrl) {
  try {
    await mongoose.connect(dbUrl, {
      dbName: 'telegram_bingo_bot',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}
