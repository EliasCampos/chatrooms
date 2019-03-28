const db = require('../db_connection');
const bcrypt = require('bcrypt');

function get(request, response) {
  if (request.session.user === undefined) {
    response.status(403).end();
    return;
  }

  let {chatname, chatpassw} = request.query;
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
      let responseStatus, responseText;
      if (!chatRow) {
        responseStatus = 404;
        responseText = `Chatroom '${chatname}' doesn't exist`;
      }
      else if (!isCorrectPassw) {
        responseStatus = 403;
        responseText = "Wrong Password";
      }
      else {
        let id = +chatRow['room_id']
        responseStatus = 200;
        responseText = `/chatrooms/${id}`;
        if (!request.session.user.allowedRooms.includes(id)) {
          request.session.user.allowedRooms.push(id);
        }
      }
      response.type('txt').status(responseStatus).send(responseText);
    });
}

module.exports = get;
