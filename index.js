const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8081;

// Target backend server
const TARGET_URL = ' https://0aa608ba021b.ngrok-free.app';

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy everything dynamically
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    selfHandleResponse: false,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${TARGET_URL}${req.originalUrl}`);

      // Forward POST/PUT/PATCH body
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        let bodyData;
        if (req.headers['content-type']?.includes('application/json')) {
          bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
        } else if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
          const urlSearchParams = new URLSearchParams(req.body);
          bodyData = urlSearchParams.toString();
          proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
  })
);

// Optional root endpoint
app.get('/', (req, res) => {
  res.send('Proxy server running. All routes are forwarded to the backend.');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${port}`);
});

