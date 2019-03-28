const db = require('../db_connection');
const bcrypt = require('bcrypt'); const SALT_ROUNDS = 10;

const TEMPLATE_NAME = "main";

async function get(request, response) {
  let isAuthorize = request.session.user !== undefined;
  let username = isAuthorize ? request.session.user.name : null;

  let ownChatRooms;
  if (isAuthorize) {
    let userID = request.session.user.id;
    let dbQuery = `SELECT room_id, room_name FROM chatrooms
      WHERE user_id = ?`;
    ownChatRooms = await db.query(dbQuery, [userID]);
    const updateAccess = id => {
      if (!request.session.user.allowedRooms.includes(id)) {
        request.session.user.allowedRooms.push(id);
      }
    };
    ownChatRooms.map(item => +item['room_id']).forEach(updateAccess);
  }
  let params = {isAuthorize, issue:"", username, ownChatRooms}
  response.render(TEMPLATE_NAME, params);
}

async function post(request, response) {
  // Log Out, if already log in
  if ('logout' in request.body) {
    delete request.session.user;
    response.redirect('/');
    return;
  }
  // Check if incoming data are correct
  let {login, password} = request.body;
  let dbCheckQuery = "SELECT * FROM users WHERE username = ?";
  let foundRow = await db.queryOne(dbCheckQuery, [login]);
  let exists = (foundRow !== undefined), isCorrectPassw;
  if (exists) {
    let hash = foundRow["user_password"];
    isCorrectPassw = await bcrypt.compare(password, hash);
  }
  let isAuthorize = exists && isCorrectPassw, issue = "";
  let responseHead, username;
  if (!isAuthorize) issue = "Incorrect login or password";
  else {
    request.session.user = Object.create(null);
    request.session.user.id = foundRow["user_id"];
    request.session.user.name = username = login;
    request.session.user.allowedRooms = [];
    response.redirect('/');
    return;
  }
  let params = {isAuthorize, issue, username, ownChatRooms:[]}
  response.render(TEMPLATE_NAME, params);
}

module.exports = {
  get,
  post
}
