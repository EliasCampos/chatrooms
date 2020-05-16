const {Router} = require('express');

const TEMPLATE_NAME = "chatRoom";
const CREATE_TEMPLATE_NAME = "create";


const chatsRouter = new Router();


chatsRouter.get('/list', (request, response) => {
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
            const _public = resolved[0];
            /*
              Cause user.allowedRooms contains also ids of public chatrooms,
              some of databases' request of private chatrooms above
              will return 'undefined', so they should be skipped:
            */
            const _private = resolved[1].filter(item => !!item);

            response.json([..._public, ..._private]);
        })
        .catch(err => response.status(500).end());
});

chatsRouter.get('/:room_id', async (request, response) => {
    // Checking authorization:
    if (!request.isAuthorize)
        return response.status(403).render('error', request.error);

    let roomId = Number(request.params.room_id),
        userId = request.session.user.id,
        userName = request.session.user.name;
    if (isNaN(roomId)) {
        response.status(400).render('error', {
            status: 400,
            message: "Bad Request"
        });
        return;
    }
    let dbCheckQuery = "SELECT * FROM chatrooms WHERE room_id = ?";
    let chatRoomRow = await db.queryOne(dbCheckQuery, [roomId]);
    if (!chatRoomRow) {
        response.status(404).render('error', {
            status: 404,
            message: "Not Found"
        });
        return;
    }
    let isPrivate = chatRoomRow['is_private'] === '1';
    if (isPrivate && !request.session.user.allowedRooms.includes(roomId)) {
        response.status(403).render('error', {
            status: 403,
            message: "Forbidden"
        });
        return;
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

    let params = {roomId, roomName, userId, userName, messages}
    response.render(TEMPLATE_NAME, params);
});

chatsRouter.get('/create', (request, response) => {
    // Checking authorization:
    if (!request.isAuthorize)
        return response.status(403).render('error', request.error);

    response.render(CREATE_TEMPLATE_NAME, {issue:"", newRoomID:null, currentName:""});
});

chatsRouter.post('/create', async (request, response) => {
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
        response.render(CREATE_TEMPLATE_NAME, viewParams);
    }).catch(error => {
        console.error(error);
        response
            .status(500)
            .render('error', {status: 500,  message: "Internal Server Error"});
    });
});

chatsRouter.get('/getaccess', (request, response) => {
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
});


module.exports = {chatsRouter};
