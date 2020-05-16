const { Router } = require('express');
const { Op } = require('sequelize');

const { Chatroom } = require('../models');

const TEMPLATE_NAME = "chatRoom";
const CREATE_TEMPLATE_NAME = "create";


const chatsRouter = new Router();


chatsRouter.get('/create', (request, response) => {
    // Checking authorization:
    if (!request.isAuthorize)
        return response.status(403).render('error', request.error);
    return response.render(CREATE_TEMPLATE_NAME, {issue:"", newRoomID: null, currentName:""});
});

chatsRouter.post('/create', async (request, response) => {
    // Checking authorization:
    if (!request.isAuthorize)
        return response.status(403).render(request.error);

    let chatname = String(request.body.chatname || '').trim();
    let password = String(request.body.password || '') || null;

    let issue = null;

    if (!chatname) {
        issue = 'Chat name is required.';
    } else if (!!(await Chatroom.findOne({where: {name: chatname}}))) {
        issue = `Name ${chatname} is occupied.`;
    }

    if (issue) {
        return response.render(CREATE_TEMPLATE_NAME, {issue, newRoomID: null, currentName: ""});
    }

    let chat = new Chatroom();
    chat.UserId = request.session.user.id;
    chat.name = chatname;
    if (password) {
        await chat.setPassword(password);
    }

    await chat.save();

    response.set("Content-Location", `/chatrooms/${chat.id}`);
    response.status(201);
    return response.render(CREATE_TEMPLATE_NAME, {issue, newRoomID: chat.id, currentName: chat.name});

});

chatsRouter.post('/getaccess', async (request, response) => {
    if (!request.isAuthorize) {
        response.status(403).end();
        return;
    }
    console.log(request.body);
    console.log(request.data);
    let chatname = String(request.body.chatname || '').trim();
    let chatpassw = String(request.body.chatpassw || '');

    if (!chatname || !chatpassw) {
        return response.status(400).send('Chat name and password are required.');
    }
    let chat = await Chatroom.findOne({where: {name: chatname}});
    if (!chat || !(await chat.checkPassword(chatpassw))) {
        return response.status(400).send('Incorrect chat name or password.');
    }

    request.session.allowedRooms = (request.session.allowedRooms || []);
    if (!request.session.allowedRooms.includes(chat.id)) {
        request.session.allowedRooms.push(chat.id);
    }
    console.log(request.session.allowedRooms);
    return response.status(200).send(`/chatrooms/${chat.id}`);
});


chatsRouter.get('/list', async (request, response) => {
    if (!request.isAuthorize) {
        response.status(403).end();
        return;
    }

    const allowedIds = (request.session.allowedRooms || []);

    const allowedRooms = await Chatroom.findAll({
        raw: true,
        where: {
            [Op.or]: [
                {token: {[Op.is]: null}},
                {id: {[Op.in]: allowedIds}},
                {UserId: request.session.user.id},
            ]
        }
    });
    return response.json(allowedRooms);
});


chatsRouter.get('/:id', async (request, response) => {
    // Checking authorization:
    if (!request.isAuthorize)
        return response.status(403).render('error', request.error);

    let roomId = Number(request.params.id),
        userId = request.session.user.id,
        userName = request.session.user.name;
    if (isNaN(roomId)) return response.status(400).render('error', { status: 400, message: "Bad Request" });
    let chat = await Chatroom.findOne({where: {id: roomId}});
    if (!chat) return response.status(404).render('error', {status: 404, message: "Not Found"});

    let allowedRooms = request.session.allowedRooms || [];

    if (chat.token !== null && !allowedRooms.includes(roomId)) {
        return response.status(403).render('error', { status: 403, message: "Forbidden"});
    }
    let messages = [];
    let params = {roomId, roomName: chat.name, userId, userName, messages};
    response.render(TEMPLATE_NAME, params);
});

module.exports = {chatsRouter};
