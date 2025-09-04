const serverless = require('serverless-http');
const app = require('../index.js');

// Configure serverless wrapper for Netlify
const handler = serverless(app, {
  binary: false,
  request: (request, event, context) => {
    // Ensure proper path handling
    request.url = request.url || event.path;
    return request;
  }
});

module.exports.handler = async (event, context) => {
  // Set timeout for long-running API calls
  context.callbackWaitsForEmptyEventLoop = false;
  
  return await handler(event, context);
};
