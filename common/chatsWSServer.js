const WebSocket = require('ws');

const db = require('./db_connection.js');
const {formatPrettyDate} = require('../utils');


module.exports = (httpServer) => {
    const chats = {};

    const server = new WebSocket.Server({server: httpServer});
    server.on('connection', (client) => {
        let wsChatId, wsUserId;

        client.on('error', console.error);
        client.on('close', () => {
            console.log(`A WS disconnected on '${wsChatId}'`);
            delete chats[wsChatId][wsUserId];
            console.log("Total connections:", Object.keys(chats[wsChatId]).length);
        });
        client.on('message', (event) => {
            let dataObj;
            try {dataObj = JSON.parse(event);}
            catch(err) {return console.error(err);}
            let {chatID, userID, isInit, content} = dataObj;
            if (!(chatID in chats)) chats[chatID] = {};
            if (isInit) {
                console.log(`A new WS connection on '${chatID}'`);
                wsChatId = chatID;
                wsUserId = userID;
                chats[chatID][userID] = client;
                console.log("Total connections:", Object.keys(chats[chatID]).length);
                return;
            }
            console.log("Got a message");
            let dbSaveQuery = `INSERT INTO messages
    (message_id, author, text, date, room_id, user_id)
    VALUES (0, ?, ?, ?, ?, ?)`;
            let {author, text} = content;
            let date = new Date();
            content.date = formatPrettyDate(date);
            let params = [author, text, date, chatID, userID];
            db.query(dbSaveQuery, params)
                .then(() => {
                    for (let user in chats[chatID]) {
                        let ws = chats[chatID][user];
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(content));
                        }
                    }
                });
        });
    });

    return server;
};
