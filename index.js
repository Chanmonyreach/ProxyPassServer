const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ===============================
// Configuration
// ===============================

const TARGET_URL = 'https://0aa608ba021b.ngrok-free.app';
const port = 3000;

// Determine environment: if using ngrok, consider it dev
const isDev = TARGET_URL.includes('ngrok');

// Timeout settings
const TIMEOUT = isDev ? 30000 : 10000; // 30s for dev/ngrok, 10s for prod
const PROXY_TIMEOUT = TIMEOUT;

// ===============================
// Middleware
// ===============================

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Proxy setup
// ===============================

app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,  // needed for virtual hosted sites
    secure: false,       // ignore TLS/HTTPS errors (useful for ngrok)
    logLevel: 'debug',   // verbose logs
    timeout: TIMEOUT,
    proxyTimeout: PROXY_TIMEOUT,
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    // Optional: you can log each proxied request
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${TARGET_URL}${req.originalUrl}`);
    }
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
app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${port}`);
});
