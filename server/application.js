const express = require('express');
const logger = require('morgan')('tiny');
const startSession = require('./middlewares/sessionStart.js');
const router = require('./router.js');

const app = express();

app.set('view engine', 'ejs');
app.set('views', "templates");

// Middlewares:
app.use(logger);
app.use(express.static('client'));
app.use(express.urlencoded({extended:false}));
app.use(startSession);

// Routing:
app.use('/', router);

// If there is unsupported URI, will redirect to main:
app.use((req, res) => res.redirect('/'));

module.exports = app;
