const session = require('express-session');

const sessionParams = {
  cookie: {
    // By default:
    path: '/',
    httpOnly: true,
    secure: false,
    maxAge: null
  },
  // Set manually:
  secret: process.env.COOKIES_SECRET,
  resave: false,
  saveUninitialized: false
};

module.exports = session(sessionParams);
