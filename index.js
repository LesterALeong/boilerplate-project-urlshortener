require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory database to store URLs
const urlDatabase = [];
let urlCounter = 1;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public directory
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve the main HTML page
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to create short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Check if URL is provided
  if (!originalUrl) {
    return res.json({ error: 'invalid URL' });
  }

  // Parse the URL to validate format
  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (err) {
    return res.json({ error: 'invalid URL' });
  }

  // Check if protocol is http or https
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid URL' });
  }

  // Use dns.lookup to verify the hostname exists
  dns.lookup(parsedUrl.hostname, (err, address) => {
    if (err) {
      return res.json({ error: 'invalid URL' });
    }

    // Check if URL already exists in database
    const existingUrl = urlDatabase.find(item => item.original_url === originalUrl);
    
    if (existingUrl) {
      // Return existing short URL
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    // Create new short URL entry
    const newUrl = {
      original_url: originalUrl,
      short_url: urlCounter
    };
    
    urlDatabase.push(newUrl);
    urlCounter++;

    // Return the new short URL
    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  
  // Find the URL entry in database
  const urlEntry = urlDatabase.find(item => item.short_url === shortUrl);
  
  if (!urlEntry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  // Redirect to the original URL
  res.redirect(urlEntry.original_url);
});

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
