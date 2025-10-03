const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// Configuration
// ===============================
const TARGET_URL = process.env.TARGET_URL || 'https://0d50324fe9c6.ngrok-free.app';
const TIMEOUT = 25000; // Render has a 30s hard limit

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===============================
// Proxy all requests
// ===============================
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    timeout: TIMEOUT,
    proxyTimeout: TIMEOUT,
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ 
          error: 'Proxy error',
          details: err.message 
        });
      }
    },
  })
);

// ===============================
// Health Check
// ===============================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', target: TARGET_URL });
});

// ===============================
// Start server
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Proxy server listening on port ${PORT}, forwarding to ${TARGET_URL}`);
});
