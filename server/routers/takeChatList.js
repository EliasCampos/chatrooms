const {HTTPError} = require('../sources/errors.js');
const db = require('../db_connection');

function get(request, response) {
  if (request.session.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }

  let dbPublicQuery = `SELECT room_id, room_name FROM chatrooms
    WHERE is_private = '0' AND NOT user_id = ?`;
  let dbAllowedQuery = `SELECT room_id, room_name FROM chatrooms
    WHERE room_id = ?`;
  let publicChatsPromise = db.query(dbPublicQuery, [request.session.user.id]);
  let ownAllowedChatsPromises = [];
  request.session.user.allowedRooms
    .forEach(function(id) {
      this.push(db.queryOne(dbAllowedQuery, [id]))
    }, ownAllowedChatsPromises);
  Promise.all([...ownAllowedChatsPromises, publicChatsPromise])
    .then(result => {
      let publicChats = result.pop();
      let chatList = [...result, ...publicChats];

      response.setHeader('Content-Type', 'application/json');
      response.writeHead(200, "OK");
      response.end(JSON.stringify(chatList));
    })
    .catch(err => {throw err});
}

module.exports = get;
