const {SERVER_URL} = require('../../config.js');

function locateServer(request, response) {
  request.serverURL = SERVER_URL;
}

module.exports = locateServer
