const session = require('express-session');
const config = require('../../config.js');

const sessionParams = {
  cookie: {
    // By default:
    path: '/',
    httpOnly: true,
    secure: false,
    maxAge: null
  },
  // Set manually:
  secret: config.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false
}

module.exports = session(sessionParams);
