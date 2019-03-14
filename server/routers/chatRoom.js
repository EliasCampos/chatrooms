const {HTTPError} = require('../sources/errors.js');
const db = require('../db_connection');
const uploadPage = require('../rendering.js');

async function get(request, response, match) {
  if (request.session.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }
  let roomId = +match,
   userId = request.session.user.id,
   userName = request.session.user.name;
  let dbCheckQuery = "SELECT * FROM chatrooms WHERE room_id = ?";
  let chatRoomRow = await db.queryOne(dbCheckQuery, [roomId]);
  if (!chatRoomRow) {
    throw new HTTPError(404, "Not Found");
  }
  let isPrivate = chatRoomRow['is_private'] === '1';
  if (isPrivate && !request.session.user.allowedRooms.has(roomId)) {
    throw new HTTPError(403, "Forbidden");
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
  let template = "chatRoom.ejs";
  let params = {roomId, roomName, userId, userName, messages}
  uploadPage(response, template, params);
}

module.exports = get;
