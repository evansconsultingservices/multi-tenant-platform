const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy requests to /tools/hello-world to the Hello World Tool on port 3001
  app.use(
    '/tools/hello-world',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        // Add authentication headers here if needed
        console.log(`Proxying request to Hello World Tool: ${req.method} ${req.path}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Tool service unavailable' });
      }
    })
  );

  // Generic proxy for future tools
  // Pattern: /tools/{tool-name} -> http://localhost:{port}
  const toolMappings = {
    // Add more tools here as needed
    // 'tool-name': 3002,
    // 'another-tool': 3003,
  };

  Object.entries(toolMappings).forEach(([toolName, port]) => {
    app.use(
      `/tools/${toolName}`,
      createProxyMiddleware({
        target: `http://localhost:${port}`,
        changeOrigin: true,
        pathRewrite: {
          [`^/tools/${toolName}`]: '',
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log(`Proxying request to ${toolName}: ${req.method} ${req.path}`);
        },
        onError: (err, req, res) => {
          console.error(`Proxy error for ${toolName}:`, err);
          res.status(500).json({ error: 'Tool service unavailable' });
        }
      })
    );
  });
};