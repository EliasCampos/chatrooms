const db = require('../db_connection');

const TEMPLATE_NAME = "chatRoom";

async function get(request, response) {
  // Checking authorization:
  if (!request.isAuthorize)
    return response.status(403).render('error', request.error);

  let roomId = Number(request.params.room_id),
   userId = request.session.user.id,
   userName = request.session.user.name;
  if (isNaN(roomId)) {
     response.status(400).render('error', {
       status: 400,
       message: "Bad Request"
     });
     return;
  }
  let dbCheckQuery = "SELECT * FROM chatrooms WHERE room_id = ?";
  let chatRoomRow = await db.queryOne(dbCheckQuery, [roomId]);
  if (!chatRoomRow) {
    response.status(404).render('error', {
      status: 404,
      message: "Not Found"
    });
    return;
  }
  let isPrivate = chatRoomRow['is_private'] === '1';
  if (isPrivate && !request.session.user.allowedRooms.includes(roomId)) {
    response.status(403).render('error', {
      status: 403,
      message: "Forbidden"
    });
    return;
  }
  let roomName = chatRoomRow['room_name'];
  let messages;
  try {
    let getMessagesQuery = `SELECT date, author, text
      FROM messages WHERE room_id = ? ORDER BY date DESC`;
    messages = await db.query(getMessagesQuery, [roomId]);
  } catch (err) {
    console.error("Problem with DB connection", err.stack);
  }

  let params = {roomId, roomName, userId, userName, messages}
  response.render(TEMPLATE_NAME, params);
}

module.exports = get;
