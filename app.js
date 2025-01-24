const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy middleware configuration
const proxyOptions = {
  target: 'https://api.kluster.ai/v1/',
  changeOrigin: true,
  pathRewrite: { '^/': '/' },
  onProxyReq: (proxyReq, req, res) => {
    // Preserve headers
    Object.keys(req.headers).forEach((key) => {
      proxyReq.setHeader(key, req.headers[key]);
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    // Handle CORS
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    proxyRes.headers['Referrer-Policy'] = 'no-referrer-when-downgrade';
    proxyRes.headers['Access-Control-Expose-Headers'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  },
};

// Apply proxy middleware to all routes
app.use('/', createProxyMiddleware(proxyOptions));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
