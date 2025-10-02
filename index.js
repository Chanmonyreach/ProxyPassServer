const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow larger payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// ===============================
// Configuration
// ===============================
const TARGET_URL = 'https://29dd3c0e69a3.ngrok-free.app';
const TIMEOUT = 60000; // 60 seconds

// ===============================
// Middleware
// ===============================
app.use(cors());

// ===============================
// Proxy all requests
// ===============================
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true, // required for virtual-hosted sites
    secure: false,      // ignore TLS issues for ngrok
    logLevel: 'debug',
    timeout: TIMEOUT,
    proxyTimeout: TIMEOUT,
    selfHandleResponse: false, // let proxy handle the response automatically
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    onProxyReq: (proxyReq, req, res) => {
      // If body exists, forward it
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  })
);

// ===============================
// Root endpoint for testing
// ===============================
app.get('/', (req, res) => {
  res.send('Proxy server running. All requests are forwarded to the backend.');
});

// ===============================
// Start server
// ===============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${PORT}`);
});
