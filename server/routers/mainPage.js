const user = require('../model/user.js');
const chatroom = require('../model/chatroom.js');

const TEMPLATE_NAME = "main";

async function get(request, response) {
  let isAuthorize = request.isAuthorize;
  let username = isAuthorize ? request.session.user.name : null;

  let chatrooms;
  if (isAuthorize) {
    chatrooms = await chatroom.getOwn(request.session.user);
    chatrooms
      .map(item => +item.room_id)
      .forEach(id => user.addAllowedRoom(request.session.user, id));
  }
  // TODO: optimize rendering configuration procedure
  let viewParams = {
    isAuthorize,
    issue:"",
    username,
    ownChatRooms: chatrooms || []
  }
  response.render(TEMPLATE_NAME, viewParams);
}

async function post(request, response) {
  // Log Out, if already log in
  if (request.isAuthorize && ('logout' in request.body)) {
    delete request.session.user;
    return response.redirect('/');
  }
  // Check if incoming data are correct
  let {login, password} = request.body;
  let logInResult = await user.logIn(login, password);
  if (logInResult.ok) {
    request.session.user = logInResult.user;
    response.redirect('/');
  }
  else {
    // TODO: optimize rendering configuration procedure
    let viewParams = {
      isAuthorize:false,
      issue:logInResult.issue,
      username:null,
      ownChatRooms: []
    }
    response.render(TEMPLATE_NAME, viewParams);
  }
}

module.exports = {
  get,
  post
}
