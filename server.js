require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const synthesizeHandler = require('./api/synthesize');
const translateHandler = require('./api/translate');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'build')));


app.post('/api/synthesize', async (req, res) => {
  try {
    return await synthesizeHandler(req, res);
  } catch (error) {
    console.error('Synthesize API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/translate', async (req, res) => {
  try {
    return await translateHandler(req, res);
  } catch (error) {
    console.error('Translate API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Available endpoints are:');
  console.log('  POST /api/synthesize');
  console.log('  POST /api/translate');
});