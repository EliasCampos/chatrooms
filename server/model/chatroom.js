const bcrypt = require('bcryptjs'), SALT_ROUNDS = 10;
const Model = require('./src/Model.js');

const chatroom = new Model('chatrooms');

chatroom.getOwn = function(user) {
  /**
  * Takes an user object, created by user.logIn function.
  * Returns a promise what resolves the users' allowed chatrooms objects.
  */
  return this.select({user_id: user.id}, ['room_id', 'room_name']);
};

chatroom.getPublic = function() {
  // Returns a promise of all public chatrooms:
  return this.select({is_private: '0'}, ['room_id', 'room_name']);
};

chatroom.getPrivate = function(roomId) {
  // Returns a promise of a private chatroom with given roomId:
  return this.select(
    {is_private: '1', room_id: roomId},
    ['room_id', 'room_name'],
    {one:true}
  );
};


chatroom.create = async function(
  owner,
  chatname,
  password,
  passwordConfirmation
){
  /**
  * Takes next parameters:
  *   owner of the chatroom (user object),
  *   name of a new chatroom,
  *   rooms' password and password confirmation.
  *   Checks input, attempts to create a new field in the database.
  * Returns an object with next structure:
  *   ok: boolean, true in case of success, otherwise false,
  *   room: object, contains id and name of a new chatroom,
  *   issue: in case of a failure describes what's wrong.
  */
  const isAlreadyExists = await this.select(
    {room_name: chatname},
    null,
    {one: true}
  ).then(field => !!field);

  let result = {ok: false, room: null, issue: null}

  if (isAlreadyExists) {
    result.issue = `Name '${chatname}' is occupied`;
  } else if (password !== passwordConfirmation) {
    result.issue = "Passwords didn't coincide each others";
  } else {
    result.ok = true;

    const passwordHash = password !== "" ?
      await bcrypt.hash(password, SALT_ROUNDS)
      : null;
    const roomData = {
      room_id: 0,
      room_name: chatname,
      room_token: passwordHash,
      is_private: password === "" ? '1' : '0',
      user_id: owner.id
    };
    const {insertId} = await this.insert(roomData);

    result.room = {id: Number(insertId), name: chatname}
  }

  return result;
};

chatroom.takeAccess = function(chatname, password) {
  /**
  * Takes chatname and password and returns promise,
  * which resolves an object with next structure:
  *   ok: boolen - true, if succesfully logged in, otherway false,
  *   issue: in case of failure will describe an issue,
  *   room_id: id of required chatroom
  */
  const expectedField = this.select(
    {room_name: chatname},
    ['room_id', 'room_token'],
    {one: true}
  );
  const expectedCheckedPassword = expectedField
    .then(field => !field ?
      Promise.resolve(null)
      : bcrypt.compare(password, field.room_token));

  const expectedResult = Promise.all([expectedField, expectedCheckedPassword])
    .then(resolved => {
      const [field, isCorrectPassw] = resolved;
      let result = {ok: false, user: null, issue: null}

      if (!field) result.issue = `Chatroom '${chatname}' doesn't exist`;
      else if (!isCorrectPassw) result.issue = "Incorrect password.";
      else {
        result.ok = true;
        result.room_id = Number(field.room_id);
      }

      return Promise.resolve(result);
    });
  return expectedResult;
};

module.exports = chatroom;
