const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// 🔌 Connect to DB
require('./models/db');

// 📦 Load models
require('./models/player');
require('./models/deposit');
require('./models/payout');

// 🚀 Create app
const app = express();

// 🧠 Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🌐 CORS (for frontend access)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Adjust for production
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-admin-token');
  next();
});

// 📁 Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 🛣️ Routes
const routes = require('./routes/index');
app.use('/api', routes);

// 🟢 Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Arada Bingo API running on port ${port}`);
});
