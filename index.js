const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ===============================
// Configuration
// ===============================
const TARGET_URL = 'https://29dd3c0e69a3.ngrok-free.app';
const PORT = 3000;

// Timeout settings
const TIMEOUT = 60000; // 60 seconds for ngrok dev
const PROXY_TIMEOUT = TIMEOUT;

// ===============================
// Middleware for proxied routes
// ===============================

// Use raw body for all proxied requests to avoid consuming JSON
app.use(
  '/',
  express.raw({ type: '*/*', limit: '10mb' }), // adjust limit if needed
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true, // required for virtual-hosted sites
    secure: false,      // ignore TLS issues for ngrok
    logLevel: 'debug',
    timeout: TIMEOUT,
    proxyTimeout: PROXY_TIMEOUT,
    onProxyReq: (proxyReq, req, res) => {
      // Forward raw body
      if (req.body && req.body.length) {
        proxyReq.write(req.body);
      }
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
  })
);

// ===============================
// Root endpoint for testing
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
