const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const authorizationRequired = require('../middlewares/authorizationRequired');
const { Chatroom, ChatMessage, User } = require('../models');

const TEMPLATE_NAME = "chatRoom";
const CREATE_TEMPLATE_NAME = "create";

const AUTHOR_INCLUDE = {model: User, as: 'author', attributes: ['id', 'username']};

const chatsRouter = new Router();


chatsRouter.get('/create', authorizationRequired, (request, response) => {
    return response.render(CREATE_TEMPLATE_NAME, {issue:"", errors: null, newRoomID: null, currentName:""});
});

chatsRouter.post('/create', authorizationRequired, [
    body('chatname')
        .not().isEmpty().withMessage('Chat name is required')
        .custom(value => {
            return Chatroom.findOne({where: {name: value}})
                .then(chat => {
                    if (!!chat) return Promise.reject(`This name is already occupied.`);
                    return Promise.resolve(true);
                })
        }),
    body('password')
        .if(value => !!value)
        .isString().withMessage('Should be a valid string')
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        let currentName = request.body.chatname || '';
        let ctx = {errors: errors.array({onlyFirstError: true}), newRoomID: null, currentName};
        return response.render(CREATE_TEMPLATE_NAME, ctx);
    }

    let chat = new Chatroom();
    chat.UserId = request.session.user.id;
    chat.name = request.body.chatname;
    if (!!request.body.password) {
        await chat.setPassword(request.body.password);
    }
    await chat.save();

    response.set("Content-Location", `/chatrooms/${chat.id}`);
    response.status(201);
    return response.render(CREATE_TEMPLATE_NAME, {errors: null, newRoomID: chat.id, currentName: chat.name});

});

chatsRouter.post('/getaccess', authorizationRequired, [
    body('password')
        .not().isEmpty().withMessage('Password is required'),
    body('chatname')
        .not().isEmpty().withMessage('Chat name is required')
        .custom((value, {req}) => {
            return Chatroom.findOne({where: {name: value}})
                .then(chat => {
                    if (!chat) return Promise.reject('Incorrect chat name or password.');
                    req.chat = chat;
                    let passw = req.body.password;
                    return !!passw ? chat.checkPassword(req.body.password) : Promise.resolve(true);
                })
                .then(isCorrectPassword => {
                    if (!isCorrectPassword) return Promise.reject('Incorrect chat name or password.');
                    return Promise.resolve(true);
                })
        }),
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({errors: errors.array()});
    }
    let chat = request.chat;
    request.session.allowedRooms = (request.session.allowedRooms || []);
    if (!request.session.allowedRooms.includes(chat.id)) {
        request.session.allowedRooms.push(chat.id);
    }
    return response.status(200).send({url: `/chatrooms/${chat.id}`});
});


chatsRouter.get('/list', authorizationRequired, async (request, response) => {
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


chatsRouter.get('/:id', authorizationRequired, [
    param('id').not().isEmpty().isNumeric().toInt().custom((value, {req}) => {
        return Chatroom.findByPk(value)
            .then(chat => {
                if (!chat) return Promise.reject('Incorrect ID of chat');
                req.chat = chat;
                return Promise.resolve(true);
            })
    })
], async (request, response) => {
    let errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).render('error', { status: 400, message: "Bad Request", errors: errors.array() });
    }
    let chat = request.chat;
    let allowedRooms = request.session.allowedRooms || [];
    if (chat.token !== null && chat.UserId !== request.session.user.id && !allowedRooms.includes(chat.id)) {
        return response.status(403).render('error', { status: 403, message: "Forbidden"});
    }

    let messages = await ChatMessage.findAll({
        where: { ChatroomId: chat.id },
        include: [AUTHOR_INCLUDE],
        order: [['id', 'DESC']],
        limit: 100
    });
    request.session.chatID = chat.id;
    response.render(TEMPLATE_NAME, {room: chat, messages});
});

module.exports = {chatsRouter};
