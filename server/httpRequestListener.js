const middleware = require('./middleware.js');
const router = require('./router.js');
const handleHTTPError = require('./httpErrors.js');

async function requestListener(request, response) {
  try {
    middleware.operate(request, response);
    await router.route(request, response);
  } catch (error) {
    handleHTTPError(error, response);
  }
}

module.exports = requestListener;
