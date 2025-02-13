const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Service is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Service running on port ${PORT}`));
