const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

const port = 5001;
app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});
