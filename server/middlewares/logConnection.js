const {logger} = require('../sources/events.js');

function logConnection(request, response) {
  logger.emit('message', {
      type:'request',
      info:request.url,
      date:(new Date()).toUTCString()
    });
}

module.exports = logConnection;
