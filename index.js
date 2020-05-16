const http = require('http');

const app = require('./application');
//const chatsWSServer = require('./common/chatsWSServer');


const httpServer = http.createServer(app);
//chatsWSServer(httpServer);

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Listening on ${PORT}...`);
});
