const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy all /api requests to backend
  app.use(
    createProxyMiddleware({
      filter: (pathname) => pathname.startsWith('/api'),
      target: 'http://localhost:10000',
      changeOrigin: true,
      secure: false,
      ws: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying request:', req.method, req.url, '→', proxyReq.path);
        console.log('🔄 Original URL:', req.originalUrl);
        console.log('🔄 Target:', 'http://localhost:10000' + req.url);
        // Ensure proper headers for local dev
        proxyReq.setHeader('Origin', `http://localhost:${process.env.PORT || 3000}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', req.url, '→', proxyRes.statusCode);
        // Allow dev UI to access backend
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
      }
    })
  );
};
