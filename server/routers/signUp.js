const querystring = require('querystring');
const {readStream} = require('../sources/functions.js');
const db = require('../db_connection');
const bcrypt = require('bcrypt'); SALT_ROUNDS = 10;
const uploadPage = require('../rendering.js');

const TEMPLATE_NAME = "signUp.ejs";

function get(request, response) {
  let isSignUp = request.session.user !== undefined;
  let newUser = isSignUp ? request.session.user.name : null;
  let params = {isSignUp, issue:null, currentName:"", newUser}
  uploadPage(response, TEMPLATE_NAME, params);
}

async function post(request, response) {
  let newUserQuery = await readStream(request);
  let {
    login,
    firstPassword,
    secondPassword
  } = querystring.parse(newUserQuery);

  let dbCheckQuery = "SELECT * FROM users WHERE username = ?";
  let alreadyExists = (await db.query(dbCheckQuery, [login])).length !== 0;

  let currentName = alreadyExists ? "" : login;
  let isSignUp = false, issue = "", newUser, responseHead;
  if (alreadyExists) {
    issue = `User with name '${login}' already exists`;
  } else if (firstPassword !== secondPassword) {
    issue = "Passwords didn't coincide each others";
  } else {
    let dbAddQuery = `INSERT INTO users
      (user_id, username, user_password)
      VALUES (0, ?, ?)`;
    let passwordHash = await bcrypt.hash(firstPassword, SALT_ROUNDS);
    let dbResult = await db.query(dbAddQuery, [login, passwordHash]);
    console.log(`A new user '${login}' has signed up!`);
    isSignUp = true;
    request.session.user = Object.create(null);
    request.session.user.id = dbResult.insertId;
    request.session.user.name = newUser = login;
    request.session.user.allowedRooms = new Set();
    // Redirect to avoid repeat post request after sudden refresh:
    response.setHeader("Location", `${request.serverURL}/signup`);
    responseHead = {status:303, message:"See Other"}
  }
  let params = {isSignUp, issue, currentName, newUser}
  uploadPage(response, TEMPLATE_NAME, params, responseHead);
}

module.exports = {
  get,
  post
}
