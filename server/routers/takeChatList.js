const db = require('../db_connection');

function get(request, response) {
  if (!request.isAuthorize) {
    response.status(403).end();
    return;
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
      response.json(chatList);
    })
    .catch(err => {
      response.status(500).render('error', {
        status: 500,
        message: "Internal Server Error"
      });
    });
}

module.exports = get;
