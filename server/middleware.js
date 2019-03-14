const {Middleware} = require('./sources/classes.js');
// middlewares:
const logConnection = require('./middlewares/logConnection.js');
const locateServer = require('./middlewares/locateServer.js');
const startSession = require('./middlewares/sessionStart.js');

const middleware = new Middleware();

middleware.use(logConnection);
middleware.use(locateServer);
middleware.use(startSession);

module.exports = middleware;
