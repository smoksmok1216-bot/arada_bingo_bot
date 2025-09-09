const mongoose = require('mongoose');
require('dotenv').config();

const db = mongoose.connection;

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ DB Connected'))
  .catch(err => console.log(`❌ DB Connection Error: ${err.message}`));

mongoose.set('useCreateIndex', true);

db.on('connected', () => {
  console.log('Mongoose connected to ' + process.env.DB_URI);
});
db.on('error', err => {
  console.log('Mongoose connection error: ' + err);
});
db.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

const gracefulShutdown = (msg, callback) => {
  db.close(() => {
    console.log('Mongoose disconnected through ' + msg);
    callback();
  });
};

process.once('SIGUSR2', () => {
  gracefulShutdown('nodemon restart', () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

require('./player');
require('./deposit');
require('./payout');
