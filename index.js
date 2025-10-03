// ===============================
// Node.js Proxy Server
// ===============================
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000; // Fixed port your ESP32 will connect to

// ===============================
// Configuration
// ===============================
const TARGET_URL = 'https://1325fca45ef4.ngrok-free.app'; // Ngrok URL
const TIMEOUT = 60000; // 60 seconds

// ===============================
// Middleware
// ===============================
app.use(cors()); // Allow all origins
app.use(express.json({ limit: '50mb' })); // Allow large JSON payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===============================
// Proxy requests
// ===============================
app.use(
  '/requestData', // Only forward /requestData path
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true, // Required for virtual-hosted sites
    secure: false,      // Ignore TLS issues for Ngrok
    logLevel: 'debug',
    timeout: TIMEOUT,
    proxyTimeout: TIMEOUT,
    selfHandleResponse: false, // Let proxy handle response automatically
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, err.message);
      res.status(500).json({ error: 'Proxy error', details: err.message });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward JSON body if present
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
  res.send('Proxy server running. Forward /requestData to Ngrok backend.');
});

// ===============================
// Start server
// ===============================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server listening on http://0.0.0.0:${PORT}`);
});
