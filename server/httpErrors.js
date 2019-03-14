const {HTTPError} = require('./sources/errors.js');
const uploadPage = require('./rendering.js');

const TEMPLATE_NAME = "error.ejs";

function handleHTTPError(error, response) {
  let status, message;
  if (error instanceof HTTPError) {
    status = error.status;
    message = error.message;
  } else {
    status = 500;
    message = "Internal Server Error";
    console.error(error.stack);
  }
  let params = {status, message}
  uploadPage(response, TEMPLATE_NAME, params, params);
}

module.exports = handleHTTPError;
