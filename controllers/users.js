const {Router} = require('express');
const { body, validationResult } = require('express-validator');

const {User} = require('../models');

const TEMPLATE_NAME = "main";
const SIGN_UP_TEMPLATE_NAME = "signUp";

const usersRouter = new Router();


usersRouter.get('/signup', (request, response) => {
    // If it's already existen user, let redirect him to main:
    if (request.session.user && !request.session.isJustSignedUp) {
        return response.redirect('/');
    }
    let login = !!request.session.isJustSignedUp ? request.session.user.username : '';
    let ctx = { isSignUp: !!request.session.isJustSignedUp , errors: null, login };
    request.session.isJustSignedUp = false;
    response.render(SIGN_UP_TEMPLATE_NAME, ctx);
});

usersRouter.post('/signup', [
    body('login')
        .not().isEmpty().withMessage('Login is required').trim().escape()
        .custom(value => {
            return User.findOne({where: {username: value}})
                .then(user => {
                    if (user) return Promise.reject('Login already in use');
                    return Promise.resolve(true);
                });
        }),
    body('password1')
        .not().isEmpty().withMessage('Password is required')
        .isLength({min: 6}).withMessage('Password should have at least 6 characters'),
    body('password2')
        .not().isEmpty().withMessage('Password confirmation is required')
        .custom((value, { req }) => {
            if (!!value && req.body.password1 && value !== req.body.password1) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
], async (request, response) => {
    let errors = validationResult(request);
    if (!errors.isEmpty()) {
        const ctx = {login: request.body.login || '', isSignUp: false, errors: errors.array({ onlyFirstError: true })};
        return response.render(SIGN_UP_TEMPLATE_NAME, ctx);
    }
    let user = new User();
    user.username = request.body.login;
    await user.setPassword(request.body.password1).then(() => user.save());
    request.session.user = user;
    request.session.isJustSignedUp = true;
    response.redirect('/signup');
});


usersRouter.post('/logout', async (request, response) => {
    if (request.session.user) {
        delete request.session.user;
    }
    response.redirect('/');
});


usersRouter.get('/', async (request, response) => {
    let isAuthorize = !!request.session.user;
    let username = isAuthorize ? request.session.user.username : null;
    response.render(TEMPLATE_NAME, {isAuthorize, errors: null, username});
});

usersRouter.post('/', [
    body('password')
        .not().isEmpty().withMessage('Password is required'),
    body('login')
        .not().isEmpty().withMessage('Login is required').trim().escape()
        .custom((value, {req}) => {
            return User.findOne({where: {username: req.body.login}})
                .then(user => {
                    if (!user) return Promise.reject('Invalid login or password');
                    req.user = user;
                    return user.checkPassword(req.body.password);
                })
                .then(isCorrectPassword => {
                    if (!isCorrectPassword) return Promise.reject('Invalid login or password');
                    return Promise.resolve(true);
                })
        })
], async (request, response) => {
    let errors = validationResult(request);
    if (!errors.isEmpty()) {
        let ctx = {isAuthorize: false, errors: errors.array({ onlyFirstError: true }), username: ''};
        return response.render(TEMPLATE_NAME, ctx)
    }
    request.session.user = request.user;
    response.redirect('/');
});

module.exports = {usersRouter};