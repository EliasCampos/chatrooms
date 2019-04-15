const user = require('../model/user.js');
const chatroom = require('../model/chatroom.js');

function get(request, response) {
  if (!request.isAuthorize) {
    response.status(403).end();
    return;
  }

  let {chatname, chatpassw} = request.query;
  chatroom.takeAccess(chatname, chatpassw)
    .then(result => {
      if (result.ok) user.addAllowedRoom(request.session.user, result.room_id);
      const responseText = result.ok ?
        "/chatrooms/" + result.room_id
        : result.issue;
      const responseStatus = result.ok ?
        200
        : /password/.test(result.issue) ? 403 : 404 ;

      response.type('txt').status(responseStatus).send(responseText);
    }).catch(error => {
      console.error(error);
      response
        .status(500)
        .render('error', {status: 500,  message: "Internal Server Error"});
    });
}

module.exports = get;
