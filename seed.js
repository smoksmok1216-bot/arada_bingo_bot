require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('./models/Player');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const adminId = process.env.ADMIN_ID;
    if (!adminId) {
      console.error('❌ ADMIN_ID is missing in .env');
      return process.exit(1);
    }

    const existing = await Player.findOne({ telegramId: adminId });
    if (existing) {
      console.log('✅ Admin already exists.');
    } else {
      await Player.create({
        telegramId: adminId,
        balance: 1000,
        isAdmin: true,
      });
      console.log('🎉 Admin player created.');
    }

    process.exit();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
