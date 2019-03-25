const {SERVER_URL, SERVER_PORT} = require('../../config.js');

function locateServer(request, response) {
  request.serverURL = SERVER_URL || process.argv[2];
}

module.exports = locateServer
