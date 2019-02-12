const http = require('http');
const {HTTPError} = require('./sources/errors.js');
const {Session} = require('./sources/classes.js');
const appEvents = require('./sources/events.js');
const router = require('./router');

const server = http.createServer();

server.on('request', requestListener);
server.on('error', err => console.error(err));

/* Functions */
async function requestListener(request, response) {
  appEvents.logger
    .emit('message', {
      type:'request',
      info:request.url,
      date:(new Date()).toUTCString()
    });

  try {
    await router.routeRequest(request, response);
  } catch (e) {
    handleHTTPError(e, response);
  }
}

function handleHTTPError(error, response) {
  /* Temporary !! */
  let status, message;
  if (error instanceof HTTPError) {
    status = error.status;
    message = error.message;
  } else {
    status = 500;
    message = "Problem on the server";
    console.error(error.stack);
  }
  try {
    response.setHeader('Content-Type', 'text/html');
    response.writeHead(status, message);
    // Here instead should be error page rendering
    response.write('<!DOCTYPE html>');
    response.write('<html><head>');
    response.write('<meta charset="utf8">');
    response.write('<title>Error</title>');
    response.write('</head><body>');
    response.write(`<h2>${status}</h2>`);
    response.write(`<p>${message}</p>`);
    response.write('</body></html>');
    response.end();
  } catch (e) {console.error(e.stack);}
}

module.exports = server;
