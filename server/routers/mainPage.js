const querystring = require('querystring');
const {readStream} = require('../sources/functions.js');
const db = require('../db_connection');
const bcrypt = require('bcrypt'); const SALT_ROUNDS = 10;
const uploadPage = require('../rendering.js');

const TEMPLATE_NAME = "main.ejs";

async function get(request, response) {
  let isAuthorize = request.session.user !== undefined;
  let username = isAuthorize ? request.session.user.name : null;

  let ownChatRooms;
  if (isAuthorize) {
    let userID = request.session.user.id;
    let dbQuery = `SELECT room_id, room_name FROM chatrooms
      WHERE user_id = ?`;
    ownChatRooms = await db.query(dbQuery, [userID]);
    const updateAccess = id => request.session.user.allowedRooms.add(id);
    ownChatRooms.map(item => +item['room_id']).forEach(updateAccess);
  }
  let params = {isAuthorize, issue:"", username, ownChatRooms}
  uploadPage(response, TEMPLATE_NAME, params);
}

async function post(request, response) {
  let requestQuery = await readStream(request);
  let requestData = querystring.parse(requestQuery);
  // Log Out, if already log in
  if (requestData.logout !== undefined) {
    delete request.session.user;
    response.setHeader("Content-Type", "text/plain");
    response.setHeader("Location", `${request.serverURL}/main`);
    response.writeHead(303, "See Other");
    response.end("Logged out...");
    return;
  }
  // Check if incoming data are correct
  let {login, password} = requestData;
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
    response.setHeader("Location", `${request.serverURL}/main`);
    responseHead = {status:303, message:"See Other"}
    request.session.user = Object.create(null);
    request.session.user.id = foundRow["user_id"];
    request.session.user.name = username = login;
    request.session.user.allowedRooms = new Set();
  }
  let params = {isAuthorize, issue, username, ownChatRooms:[]}
  uploadPage(response, TEMPLATE_NAME, params, responseHead);
}

module.exports = {
  get,
  post
}
