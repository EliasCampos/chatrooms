const url = require('url');
const {HTTPError} = require('../sources/errors.js');
const db = require('../db_connection');
const bcrypt = require('bcrypt');

function get(request, response) {
  if (request.session.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }

  let {chatname, chatpassw} = url.parse(request.url, true).query;
  let dbQuery = "SELECT room_id, room_token FROM chatrooms WHERE room_name = ?";
  let dbPromise = db.queryOne(dbQuery, [chatname]);
  let passwHashPromise = dbPromise
    .then(dbRow => {
      if (!dbRow) return Promise.resolve(null);
      return bcrypt.compare(chatpassw, dbRow['room_token']);
    });

  Promise.all([dbPromise, passwHashPromise])
    .then(resolveds => {
      let chatRow = resolveds[0], isCorrectPassw = resolveds[1];
      let responseStatus, responseStatusText, responseText;
      if (!chatRow) {
        responseStatus = 404;
        responseStatusText = "Not Found";
        responseText = `Chatroom '${chatname}' doesn't exist`;
      }
      else if (!isCorrectPassw) {
        responseStatus = 403;
        responseStatusText = "Forbidden";
        responseText = "Wrong Password";
      }
      else {
        let id = +chatRow['room_id']
        responseStatus = 200;
        responseStatusText = "Ok";
        responseText = `/chatrooms/${id}`;
        request.session.user.allowedRooms.add(id);
      }
      response.setHeader('Content-Type', 'text/plain');
      response.writeHead(responseStatus, responseStatusText);
      response.end(responseText);
    });
}

module.exports = get;
