const querystring = require('querystring');
const {HTTPError} = require('../sources/errors.js');
const {readStream} = require('../sources/functions.js');
const db = require('../db_connection');
const bcrypt = require('bcrypt'); const SALT_ROUNDS = 10;
const uploadPage = require('../rendering.js');

let TEMPLATE_NAME = 'create.ejs';

function get(request, response) {
  if (request.session.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }
  uploadPage(response, TEMPLATE_NAME, {issue:"", newRoomID:null});
}

async function post(request, response) {
  if (request.session.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }

  let newChatQuery = await readStream(request);
  let {
    chatname,
    chatFirstPassw,
    chatSecondPassw
  } = querystring.parse(newChatQuery);

  let dbCheckQuery = "SELECT * FROM chatrooms WHERE room_name = ?";
  let alreadyExists = !!(await db.queryOne(dbCheckQuery, [chatname]));

  // Validate incoming data
  let issue = "", newRoomID, responseHead;
  if (alreadyExists) {
    issue = `Name '${chatname}' is occupied`;
  } else if (chatFirstPassw !== chatSecondPassw) {
    issue = "Passwords didn't coincide each others";
  } else {
    let authorID = request.session.user.id;
    let isPrivate = chatFirstPassw === "" ? "0" : "1";
    let passwordHash = null;
    if (!!isPrivate) {
      passwordHash = await bcrypt.hash(chatFirstPassw, SALT_ROUNDS);
    }
    let dbCreateQuery = `INSERT INTO chatrooms
      (room_id, room_name, room_token, is_private, user_id)
      VALUES (0, ?, ?, ?, ?)`;
    let queryParams = [chatname, passwordHash, isPrivate, authorID];
    let dbResult = await db.query(dbCreateQuery, queryParams);
    console.log(`A new chatroom '${chatname}' has been created!`);
    newRoomID = dbResult.insertId;
    request.session.user.allowedRooms.add(newRoomID);
    let contentLocation = `${request.serverURL}/chatrooms/${newRoomID}`;
    response.setHeader("Content-Location", contentLocation);
    responseHead = {status:201, message:"Created"} // ??Is it a good desition??
  }
  let template = "create.ejs";
  uploadPage(response, template, {issue, newRoomID}, responseHead);
}


module.exports = {
  get,
  post
}
