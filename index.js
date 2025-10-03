// ===============================
// Fast & Smooth Node.js Proxy Server
// ===============================
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// ===============================
// Configuration
// ===============================
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL || 'https://1325fca45ef4.ngrok-free.app';
const TIMEOUT = 30000; // 30 seconds for faster failure

// ===============================
// Middleware
// ===============================
app.use(cors());               // Allow all origins
app.use(compression());        // Compress responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Optional: Minimal logging for production
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ===============================
// Proxy /requestData
// ===============================
app.use(
  '/requestData',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false,
    timeout: TIMEOUT,
    proxyTimeout: TIMEOUT,
    selfHandleResponse: false, // Proxy handles response directly
    headers: {
      Connection: 'keep-alive' // Keep TCP connection alive for speed
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(500).json({ status: 'error', message: 'Proxy failed', details: err.message });
    },
    onProxyReq: (proxyReq, req) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  })
);

// ===============================
// Root endpoint for testing
// ===============================
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Proxy live. Use /requestData for fast forwarding.'
  });
});

// ===============================
// Start server
// ===============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fast proxy server listening on http://0.0.0.0:${PORT}`);
  console.log(`Forwarding /requestData requests to: ${TARGET_URL}`);
});
