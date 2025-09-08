const express = require('express');
const app = express();
const playRoute = require('./routes/play');

app.use(express.json());
app.use('/api', playRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
