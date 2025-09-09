const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

require('./models/db');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-admin-token, x-admin-name');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const routes = require('./routes/index');
app.use('/api', routes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Arada Bingo API running on port ${port}`));
