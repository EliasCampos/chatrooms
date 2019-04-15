const user = require('../model/user.js');
const chatroom = require('../model/chatroom.js');

const TEMPLATE_NAME = "create";

function get(request, response) {
  // Checking authorization:
  if (!request.isAuthorize)
    return response.status(403).render('error', request.error);

  response.render(TEMPLATE_NAME, {issue:"", newRoomID:null, currentName:""});
}

async function post(request, response) {
  // Checking authorization:
  if (!request.isAuthorize)
    return response.status(403).render(request.error);

  let {chatname, chatFirstPassw, chatSecondPassw} = request.body;
  chatroom.create(
    request.session.user,
    chatname,
    chatFirstPassw,
    chatSecondPassw
  ).then(newRoomResult => {
    let viewParams = {issue: null, newRoomID: null, currentName: ""};
    if (newRoomResult.ok) {
      let newRoomID = newRoomResult.room.id;
      user.addAllowedRoom(request.session.user, newRoomID);
      let contentLocation = "/chatrooms/" + newRoomID;
      response.set("Content-Location", contentLocation);
      response.status(201);
      viewParams.newRoomID = newRoomID;
    } else {
      let issue = newRoomResult.issue;
      viewParams.issue = newRoomResult.issue;
      viewParams.currentName = /occupied/.test(issue) ? "" : chatname;
    }
    response.render(TEMPLATE_NAME, viewParams);
  }).catch(error => {
    console.error(error);
    response
      .status(500)
      .render('error', {status: 500,  message: "Internal Server Error"});
  });
}


module.exports = {
  get,
  post
}
