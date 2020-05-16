const bcrypt = require('bcryptjs'), SALT_ROUNDS = 10;
const Model = require('./src/Model.js');

const user = new Model('users');

user.addAllowedRoom = function(userObject, roomId) {
  /**
  * Takes an user object with property 'id' and 'allowedRooms'
  * and updates last property - array with allowed chatrooms IDs.
  */
  if (!userObject.allowedRooms.includes(roomId)) {
    userObject.allowedRooms.push(roomId);
  }
}

user.logIn = function(login, password) {
  /**
  * Takes login and password and returns promise,
  * which resolves an object with next structure:
  *   ok: boolen - true, if succesfully logged in, otherway false,
  *   issue: in case of failure will describe an issue,
  *   user: if logged in, will return object with user id, name,
  *     and allowedRooms (empty array by default);
  */
  const expectedField = this.select(
    {username: login},
    ['user_id', 'username', 'user_password'],
    {one: true}
  );
  const expectedCheckedPassword = expectedField
    .then(field => !field ?
      Promise.resolve(null)
      : bcrypt.compare(password, field.user_password));

  const expectedResult = Promise.all([expectedField, expectedCheckedPassword])
    .then(resolved => {
      const [field, isCorrectPassw] = resolved;
      let result = {ok: false, user: null, issue: null}

      if (!field) result.issue = `User with name '${login}' doesn't exists.`;
      else if (!isCorrectPassw) result.issue = "Incorrect password.";
      else {
        result.ok = true;
        result.user = {id:field.user_id, name:field.username, allowedRooms:[]}
      }

      return Promise.resolve(result);
    });

  return expectedResult;
}

user.signUp = async function(login, password, passwordConfirmation) {
  // Output is the same as in logIn function above.
  const isAlreadyExists = await this.select(
    {username: login},
    null,
    {one: true}
  ).then(field => !!field);

  let result = {ok: false, user: null, issue: null}

  if (isAlreadyExists) {
    result.issue = `User with name '${login}' already exists`;
  } else if (password !== passwordConfirmation) {
    result.issue = "Passwords didn't coincide each others";
  } else {
    result.ok = true;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userData = {user_id: 0, username: login, user_password: passwordHash}
    const {insertId} = await this.insert(userData);

    result.user = {id: insertId, name: login, allowedRooms: []}
  }

  return result;
}

module.exports = user;
