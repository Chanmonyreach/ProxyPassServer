const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Target: your local backend (running at home or on another server)
const TARGET_URL = process.env.TARGET_URL || "https://0d50324fe9c6.ngrok-free.app";

// Forward all API routes to local backend
app.use(
  '/',
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false,
  })
);

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}, forwarding to ${TARGET_URL}`);
});
