const {Router} = require('express');

const {User} = require('../models');

const TEMPLATE_NAME = "main";
const SIGN_UP_TEMPLATE_NAME = "signUp";

const usersRouter = new Router();


usersRouter.get('/signup', (request, response) => {
    // If it's already existen user, let redirect him to main:
    if (request.isAuthorize && !request.new_user) {
        return response.redirect('/');
    }

    let isSignUp = 'new_user' in request;
    let newUser = isSignUp ? request.new_user : null;
    let params = {isSignUp, issue:null, currentName:"", newUser}
    response.render(SIGN_UP_TEMPLATE_NAME, params);
});

usersRouter.post('/signup', (request, response) => {
    let {login, firstPassword, secondPassword} = request.body;

    user.signUp(login, firstPassword, secondPassword)
        .then(signUpResult => {
            if (signUpResult.ok) {
                request.session.user = signUpResult.user;
                request.session.new_user = signUpResult.user.name;
                response.redirect('/signup');
            } else {
                let issue = signUpResult.issue;
                let currentName = /exists/.test(issue) ? "" : login;
                let viewParams = {isSignUp: false, issue, currentName, newUser: null};
                response.render(SIGN_UP_TEMPLATE_NAME, viewParams);
            }
        })
        .catch(error => {
            console.error(error);
            response
                .status(500)
                .render('error', {status: 500,  message: "Internal Server Error"});
        });
});


usersRouter.get('/', async (request, response) => {
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
    };
    response.render(TEMPLATE_NAME, viewParams);
});

usersRouter.post('/', async (request, response) => {
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
        };
        response.render(TEMPLATE_NAME, viewParams);
    }
});

module.exports = {usersRouter};