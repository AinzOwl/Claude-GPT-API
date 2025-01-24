// Import required modules
const express = require('express');

// Initialize the Express app
const app = express();

// Enable CORS on the proxy endpoint (optional, but recommended for security)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Define the reverse proxy endpoint
app.all('/api/*', (req, res, next) => {
    // Use the 'path' module to parse the URL path
    const url = require('url').parse(req.url);
    const targetUrl = req.protocol + '://' + req.get('host') + url.pathname;

    // Use HTTPS if the original request was HTTPS
    let op = req.protocol === 'https' ? 'https' : 'http';

    // Create a proxy request and pass it on to the target API
    const targetProxy = http[op].createProxyServer({ target: targetUrl, changeOrigin: true });
    targetProxy.on('proxyRes', (proxyRes, req, res) => {
        Object.defineProperty(proxyRes, 'statusCode', {
            get: () => {
                // Hide X-Powered-By and Server headers to maintain the illusion of a different origin
                delete proxyRes.headers['x-powered-by'];
                delete proxyRes.headers['server'];
                return proxyRes.statusCode;
            },
        });
    });
    targetProxy.web(req, res, { target: targetUrl });
});

const http = require('http');
const https = require('https');

// Start the Express server
const port = 3000;
app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
