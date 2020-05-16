const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan')('tiny');
const { checkAuth, setUser, startSession } = require('./middlewares');

const { chatsRouter, usersRouter } = require('./controllers');

const app = express();

app.set('view engine', 'ejs');
app.set('views', "templates");

// Middlewares:
app.use(logger);
app.use(bodyParser.json());
app.use(express.static('client'));
app.use(express.urlencoded({extended:false}));

app.use(startSession);
app.use(checkAuth);
app.use(setUser);


// Routing:
app.use('/chatrooms', chatsRouter);
app.use('/', usersRouter);

// If there is unsupported URI, will redirect to main:
app.use((req, res) => res.redirect('/'));

module.exports = app;
