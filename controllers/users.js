const {Router} = require('express');

const {User} = require('../models');

const TEMPLATE_NAME = "main";
const SIGN_UP_TEMPLATE_NAME = "signUp";

const usersRouter = new Router();


usersRouter.get('/signup', (request, response) => {
    // If it's already existen user, let redirect him to main:
    if (request.isAuthorize && !request.session.isJustSignedUp) {
        return response.redirect('/');
    }

    let currentName = !!request.session.isJustSignedUp ? request.session.user.username : '';
    let params = { isSignUp: !!request.session.isJustSignedUp , issue: null, currentName };
    request.session.isJustSignedUp = false;
    response.render(SIGN_UP_TEMPLATE_NAME, params);
});

usersRouter.post('/signup', async (request, response) => {
    let login = String(request.body.login || '').trim();
    let firstPassword = String(request.body.firstPassword || '');
    let secondPassword = String(request.body.secondPassword || '');

    let issue = null;
    let currentName = '';
    if (!login || !firstPassword || !secondPassword) {
        issue = "Both login and password are required";
    }
    else if ((await User.findOne({where: {username: login}}).then(user => !!user))) {
        issue = `User with username ${login} already exists.`;
    } else if (firstPassword !== secondPassword) {
        issue = "Passwords didn't coincide each others";
        currentName = login;
    }

    if (issue) return response.render(SIGN_UP_TEMPLATE_NAME, {isSignUp: false, issue, currentName, newUser: null});

    let user = new User();
    user.username = login;
    await user.setPassword(firstPassword).then(() => user.save());
    request.session.user = user;
    request.session.isJustSignedUp = true;
    response.redirect('/signup');
});


usersRouter.get('/', async (request, response) => {
    let isAuthorize = request.isAuthorize;
    let username = isAuthorize ? request.session.user.username : null;

    let chatrooms = null;
    // TODO: chatrooms
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
    if (request.isAuthorize) {
        delete request.session.user;
        return response.redirect('/');
    }
    // Check if incoming data are correct
    let login = String(request.body.login || '').trim();
    let password = String(request.body.password || '');

    let user = await User.findOne({where: {username: login}});
    if (user === null || !(await user.checkPassword(password))) {
        let issue = "Incorrect login or password";
        return response.render(TEMPLATE_NAME, {isAuthorize: false, issue, currentName:'', newUser: null});
    }

    request.session.user = user;
    response.redirect('/');
});

module.exports = {usersRouter};