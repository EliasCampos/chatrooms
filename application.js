const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan')('tiny');
const { setUser, startSession } = require('./middlewares');

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
app.use(setUser);


// Routing:
app.use('/chatrooms', chatsRouter);
app.use('/', usersRouter);

// If there is unsupported URI, will see 404 error:
app.use((req, res) => res.status(404).render('error', {status: 404, message: "Not Found"}));

module.exports = app;
