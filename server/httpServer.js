const http = require('http');
const requestListener = require('./httpRequestListener.js');

const server = http.createServer();
server.on('request', requestListener);
server.on('error', err => console.error(err));

module.exports = server; 
