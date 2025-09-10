const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:10000',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyReq: (proxyReq) => {
        // Ensure cookies can flow during local dev
        proxyReq.setHeader('Origin', 'http://localhost:3000');
      },
      onProxyRes: (proxyRes) => {
        // Allow dev UI to access backend
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      }
    })
  );
};
