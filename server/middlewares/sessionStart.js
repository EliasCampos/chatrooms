const {Session} = require('../sources/classes.js');

function startSession(request, response) {
  let session = new Session(request, response);
  request.session = session.storage;
}

module.exports = startSession;
