const url = require('url');
const querystring = require('querystring');
const bcrypt = require('bcrypt'); const SALT_ROUNDS = 10;
const {
  readStream,
  replyWithFile,
  addIfNotPresent
} = require('./sources/functions.js');
const {Router, Session} = require('./sources/classes.js');
const {HTTPError} = require('./sources/errors.js');
const deployPage = require('./rendering.js');
const db = require('./db_connection');
db.connect().catch(err => console.error(err));
// Warning: the line above can produce a problem

const SERVER_URL = 'http://localhost:3000';

const router = new Router();

/* MAIN */
router.addHandler('GET', /^\/$|^\/main$/, async (req, res) => {
  let session = new Session(req, res), template = "main.ejs";
  let isAuthorize = session.storage.user !== undefined;
  let username = isAuthorize ? session.storage.user.name : null;

  let ownChatRooms;
  if (isAuthorize) {
    let userID = session.storage.user.id;
    let dbQuery = `SELECT room_id, room_name FROM chatrooms
      WHERE user_id = ?`;
    ownChatRooms = await db.query(dbQuery, [userID]);
    let updateAccess = addIfNotPresent(session.storage.user.allowedRooms);
    ownChatRooms.map(item => +item['room_id']).forEach(updateAccess);
  }
  let params = {isAuthorize, issue:"", username, ownChatRooms}
  deployPage(res, template, params);
});
router.addHandler('POST', /^\/$/, async (req, res) => {
  let session = new Session(req, res), template = "main.ejs";
  let requestQuery = await readStream(req);
  let requestData = querystring.parse(requestQuery);
  // Log Out, if already log in
  if (requestData.logout !== undefined) {
    delete session.storage.user;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Location", `${SERVER_URL}/main`);
    res.writeHead(303, "See Other");
    res.end("Logged out...");
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
    res.setHeader("Location", `${SERVER_URL}/main`);
    responseHead = {status:303, message:"See Other"}
    session.storage.user = Object.create(null);
    session.storage.user.id = foundRow["user_id"];
    session.storage.user.name = username = login;
    session.storage.user.allowedRooms = [];
  }
  let params = {isAuthorize, issue, username, ownChatRooms:[]}
  deployPage(res, template, params, responseHead);
});

/* SIGN UP */
router.addHandler('GET', /^\/signup$/, (req, res) => {
  let session = new Session(req, res), template = "signUp.ejs";
  let isSignUp = session.storage.user !== undefined;
  let newUser = isSignUp ? session.storage.user.name : null;
  let params = {isSignUp, issue:null, newUser}
  deployPage(res, template, params);
});
router.addHandler('POST', /^\/signup$/, async (req, res) => {
  let session = new Session(req, res), template = "signUp.ejs";

  let newUserQuery = await readStream(req);
  let {
    login,
    firstPassword,
    secondPassword
  } = querystring.parse(newUserQuery);

  let dbCheckQuery = "SELECT * FROM users WHERE username = ?";
  let alreadyExists = (await db.query(dbCheckQuery, [login])).length !== 0;

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
    session.storage.user = Object.create(null);
    session.storage.user.id = dbResult.insertId;
    session.storage.user.name = newUser = login;
    session.storage.user.allowedRooms = [];
    // Redirect to avoid repeat post request after sudden refresh:
    res.setHeader("Location", `${SERVER_URL}/signup`);
    responseHead = {status:303, message:"See Other"}
  }
  let params = {isSignUp, issue, newUser}
  deployPage(res, template, params, responseHead);
});

/* Get access to private chatroom */
router.addHandler('GET', /^\/chatrooms\/getaccess$/, (req, res) => {
  let session = new Session(req, res);
  let {chatname, chatpassw} = url.parse(req.url, true).query;
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
      let responseStatus, responseStatusText, responseText;
      if (!chatRow) {
        responseStatus = 404;
        responseStatusText = "Not Found";
        responseText = `Chatroom '${chatname}' doesn't exist`;
      }
      else if (!isCorrectPassw) {
        responseStatus = 403;
        responseStatusText = "Forbidden";
        responseText = "Wrong Password";
      }
      else {
        let id = +chatRow['room_id']
        responseStatus = 200;
        responseStatusText = "Ok";
        responseText = `/chatrooms/${id}`;
        addIfNotPresent(session.storage.user.allowedRooms)(id);
      }
      res.setHeader('Content-Type', 'text/plain');
      res.writeHead(responseStatus, responseStatusText);
      res.end(responseText);
    });
});

/* Get allowed chatrooms */
router.addHandler('GET', /^\/chatrooms\/public$/, (req, res) => {
  let session = new Session(req, res);
  if (session.storage.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }

  let dbPublicQuery = `SELECT room_id, room_name FROM chatrooms
    WHERE is_private = '0' AND NOT user_id = ?`;
  let dbAllowedQuery = `SELECT room_id, room_name FROM chatrooms
    WHERE room_id = ?`;
  let publicChatsPromise = db.query(dbPublicQuery, [session.storage.user.id]);
  let ownAllowedChatsPromises = session.storage.user.allowedRooms
    .map(id => db.queryOne(dbAllowedQuery, [id]));
  Promise.all([...ownAllowedChatsPromises, publicChatsPromise])
    .then(result => {
      let publicChats = result.pop();
      let chatList = [...result, ...publicChats];

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200, "OK");
      res.end(JSON.stringify(chatList));
    })
    .catch(err => {throw err});
});

/* Get Chat Room */
router.addHandler('GET', /^\/chatrooms\/(\d+)$/, async (req, res, match) => {
  let session = new Session(req, res);
  if (session.storage.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }
  let roomId = +match,
   userId = session.storage.user.id,
   userName = session.storage.user.name;
  let dbCheckQuery = "SELECT * FROM chatrooms WHERE room_id = ?";
  let chatRoomRow = await db.queryOne(dbCheckQuery, [roomId]);
  if (!chatRoomRow) {
    throw new HTTPError(404, "Not Found");
  }
  let isPrivate = chatRoomRow['is_private'] === '1';
  if (!session.storage.user
    || (isPrivate
    && !session.storage.user.allowedRooms.includes(roomId))) {
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
  deployPage(res, template, params);
});
/* Create a new chat room */
router.addHandler('GET', /^\/chatrooms\/create$/, (req, res) => {
  let session = new Session(req, res);
  if (session.storage.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }
  let template = 'create.ejs';
  deployPage(res, template, {issue:"", newRoomID:null});
});
router.addHandler('POST', /^\/chatrooms\/create$/, async (req, res) => {
  let session = new Session(req, res);
  if (session.storage.user === undefined) {
    throw new HTTPError(403, "Forbidden");
  }

  let newChatQuery = await readStream(req);
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

    let authorID = session.storage.user.id;
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
    session.storage.user.allowedRooms.push(newRoomID);
    res.setHeader("Content-Location", `${SERVER_URL}/chatrooms/${newRoomID}`);
    responseHead = {status:201, message:"Created"} // ??Is it a good desition??
  }
  let template = "create.ejs";
  deployPage(res, template, {issue, newRoomID}, responseHead);
});

/* Additional Files (css, js, img etc.) */
const FILE_TYPES = {
  //extension:mime-type
  'html':'text/html',
  'css':'text/css',
  'js':'text/javascript',
  'png':'image/png',
  'jpg':'image/jpeg',
  'gif':'image/gif',
  'json':'application/json'
}
router.addHandler('GET',
  /^(\/\w+\/\w+\.[a-zA-Z]+)$/,
  (req, res, filePath) => {
    let extension = /.([a-zA-Z]+)$/.exec(filePath)[1];
    if (!(extension in FILE_TYPES)) {
      throw new HTTPError(400, "Bad Request");
    }
    replyWithFile(res, filePath, FILE_TYPES[extension]);
  });

module.exports = router;
