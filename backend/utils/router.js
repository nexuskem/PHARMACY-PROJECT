/**
 * Simple router using native Node.js
 */

class Router {
  constructor() {
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {}
    };
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  get(path, handler) {
    this.routes.GET[path] = handler;
  }

  post(path, handler) {
    this.routes.POST[path] = handler;
  }

  put(path, handler) {
    this.routes.PUT[path] = handler;
  }

  delete(path, handler) {
    this.routes.DELETE[path] = handler;
  }

  async handle(req, res) {
    // Apply middlewares
    for (const middleware of this.middlewares) {
      const result = await middleware(req, res);
      if (result === false) return; // Middleware blocked the request
    }

    const method = req.method;
    const path = req.url.split('?')[0]; // Remove query string

    // Find matching route
    let handler = this.routes[method][path];

    // Try to find route with parameters
    if (!handler) {
      for (const routePath in this.routes[method]) {
        const regex = new RegExp('^' + routePath.replace(/:\w+/g, '([^/]+)') + '$');
        const match = path.match(regex);
        if (match) {
          handler = this.routes[method][routePath];
          // Extract params
          const paramNames = routePath.match(/:(\w+)/g) || [];
          req.params = req.params || {};
          paramNames.forEach((param, index) => {
            const paramName = param.slice(1);
            req.params[paramName] = decodeURIComponent(match[index + 1]);
          });
          break;
        }
      }
    }

    if (handler) {
      try {
        await handler(req, res);
      } catch (error) {
        console.error('Route handler error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
        }
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Route not found' }));
    }
  }
}

module.exports = Router;

