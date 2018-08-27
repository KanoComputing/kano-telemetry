const connect = require('connect');
const serveStatic = require('serve-static');

const namedResolutionMiddleware = require('./named-resolution-middleware');

function serve({ port = 8000, root = process.cwd() } = {}) {
    return connect()
        .use(namedResolutionMiddleware({ modulesDir: root }))
        .use(serveStatic(root))
        .listen(port);
}

module.exports = {
    serve,
};