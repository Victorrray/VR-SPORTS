const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://vr-sports.onrender.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api', // rewrite path
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add CORS headers
        proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to the response
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    })
  );
};
