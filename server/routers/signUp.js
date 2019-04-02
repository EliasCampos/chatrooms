const db = require('../db_connection');
const bcrypt = require('bcrypt'); SALT_ROUNDS = 10;

const TEMPLATE_NAME = "signUp";

function get(request, response) {
  // If it's already existen user, let redirect him to main:
  if (request.isAuthorize && !request.new_user)
    return response.redirect('/');

  let isSignUp = 'new_user' in request;
  let newUser = isSignUp ? request.new_user : null;
  let params = {isSignUp, issue:null, currentName:"", newUser}
  response.render(TEMPLATE_NAME, params);
}

async function post(request, response) {
  let {login, firstPassword, secondPassword} = request.body;

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
    request.session.user.name = request.session.new_user = login;
    request.session.user.allowedRooms = [];
    // Redirect to avoid repeat post request after sudden refresh:
    response.redirect('/signup');
    return;
  }
  let params = {isSignUp, issue, currentName, newUser:request.session.new_user}
  response.render(TEMPLATE_NAME, params);
}

module.exports = {
  get,
  post
}
