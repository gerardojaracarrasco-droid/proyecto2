require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

let urlDatabase = [];
let counter = 1;

// GET original URL by short URL
app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = parseInt(req.params.short_url);
  const entry = urlDatabase.find((item) => item.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(entry.original_url);
});

// POST create short URL
app.post('/api/shorturl', function (req, res) {
  const original_url = req.body.url;

  if (!original_url) {
    return res.json({ error: 'invalid url' });
  }

  let hostname;

  try {
    const parsedUrl = new URL(original_url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    hostname = parsedUrl.hostname;
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const existing = urlDatabase.find(
      (item) => item.original_url === original_url
    );

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

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
