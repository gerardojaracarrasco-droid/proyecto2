require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();
app.set('trust proxy', true);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Base de datos temporal en memoria
let urlDatabase = [];
let counter = 1;

// Ejemplo opcional de FCC
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Request Header Parser Microservice
app.get('/api/whoami', function(req, res) {
  const ipaddress = req.ip;
  const language = req.get('Accept-Language');
  const software = req.get('User-Agent');

  res.json({
    ipaddress,
    language,
    software
  });
});

// Crear short URL
app.post('/api/shorturl', function(req, res) {
  const original_url = req.body.url;

  let parsedUrl;
  try {
    parsedUrl = new URL(original_url);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  const hostname = parsedUrl.hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const existing = urlDatabase.find(item => item.original_url === original_url);
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url
      });
    }

    const newEntry = {
      original_url,
      short_url: counter++
    };

    urlDatabase.push(newEntry);

    res.json({
      original_url: newEntry.original_url,
      short_url: newEntry.short_url
    });
  });
});

// Redireccionar usando short URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = Number(req.params.short_url);

  const entry = urlDatabase.find(item => item.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(entry.original_url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
