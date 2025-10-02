const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

const app = express();

// ===============================
// Configuration
// ===============================
const TARGET_URL = 'https://29dd3c0e69a3.ngrok-free.app'; // your ngrok URL
const PORT = 3000;
const IS_DEV = TARGET_URL.includes('ngrok');
const TIMEOUT = IS_DEV ? 60000 : 30000; // 60s for ngrok, 30s for prod

// ===============================
// Middleware
// ===============================

// Use bodyParser but keep raw body for proxy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===============================
// Proxy setup
// ===============================
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false, // for self-signed TLS / ngrok
    logLevel: 'debug',
    timeout: TIMEOUT,
    proxyTimeout: TIMEOUT,
    onProxyReq: (proxyReq, req, res) => {
      // Only write body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${TARGET_URL}${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
      }
    },
  })
);

// ===============================
// Root endpoint
// ===============================
app.get('/', (req, res) => {
  res.send('Proxy server running. All routes are forwarded to the backend.');
});

// ===============================
// Start server
// ===============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${PORT}`);
});
