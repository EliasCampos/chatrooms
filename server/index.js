const WebSocket = require('ws');
const httpServer = require('./httpServer.js');
const db = require('./db_connection.js');
const {formatPrettyDate} = require('./functions.js');

const chats = {};

const server = new WebSocket.Server({
  server: httpServer
});
server.on('connection', handleConnection);

function handleConnection(client) {
  let wsChatId, wsUserId;
  const handleMessage = event => {
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
        };
      });

  }
  const stopKeep = () => {
    console.log(`A WS disconnected on '${wsChatId}'`);
    delete chats[wsChatId][wsUserId];
    console.log("Total connections:", Object.keys(chats[wsChatId]).length);
  }

  client.on('message', handleMessage);
  client.on('close', stopKeep);
  client.on('error', console.error);
}

module.exports = port => httpServer.listen(port, () => {
  console.log(`Listening on ${port}...`);
  db.connect().catch(err => {console.error("Can't connect database.")});
});
