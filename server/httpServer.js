const http = require('http');
const app = require('./application.js');

module.exports = http.createServer(app);
