const user = require('../model/user.js');
const chatroom = require('../model/chatroom.js');

function get(request, response) {
  if (!request.isAuthorize) {
    response.status(403).end();
    return;
  }

  const expectedPublic = chatroom.getPublic();
  const expectedPrivate = Promise.all(
    request.session.user.allowedRooms
      .map(roomId => chatroom.getPrivate(roomId)));

  Promise.all([expectedPublic, expectedPrivate])
    .then(resolved => {
      const public = resolved[0];
      /*
        Cause user.allowedRooms contains also ids of public chatrooms,
        some of databases' request of private chatrooms above
        will return 'undefined', so they should be skipped:
      */
      const private = resolved[1].filter(item => !!item);

      response.json([...public, ...private]);
    })
    .catch(err => response.status(500).end());
}

module.exports = get;
