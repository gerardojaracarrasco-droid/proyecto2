require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

let urlDatabase = [];
let counter = 1;

app.post('/api/shorturl', function(req, res) {
  const original_url = req.body.url;

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

    const newEntry = {
      original_url,
      short_url: counter++
    };

    urlDatabase.push(newEntry);

    return res.json(newEntry);
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url, 10);
  const entry = urlDatabase.find(item => item.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(entry.original_url);
});
app.get('/redirect/:short_url', function(req, res) {

  const shortUrl = parseInt(req.params.short_url, 10);
  const entry = urlDatabase.find(item => item.short_url === shortUrl);

  if (!entry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(entry.original_url);

});

app.listen(port, function() {
  console.log('Listening on port ' + port);
});
