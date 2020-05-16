const WebSocket = require('ws');

const parseSession = require('../middlewares/startSession');
const { User, ChatMessage } = require('../models');

const AUTHOR_INCLUDE = {model: User, as: 'author', attributes: ['id', 'username']};


module.exports = (httpServer) => {
    const chats = new Map();

    const server = new WebSocket.Server({ clientTracking: false, noServer: true });

    httpServer.on('upgrade', async (request, socket, head) => {
        parseSession(request, {}, () => {
            if (!request.session.chatID) return socket.destroy();
            server.handleUpgrade(request, socket, head, function(client) {
                server.emit('connection', client, request);
            });
        });
    });

    server.on('connection', (client, request) => {
        const userId = request.session.user.id;
        const chatId = request.session.chatID;

        console.log(`A new ws connection in ${chatId} - user ${userId}`);

        if (!chats.has(chatId)) {
            chats.set(chatId, new Map());
        }
        chats.get(chatId).set(userId, client);

        client.on('error', console.error);
        client.on('close', () => {
            console.log(`A WS disconnected on '${chatId}'`);
            chats.get(chatId).delete(userId);
        });
        client.on('message', (data) => {
            try {
                let text = JSON.parse(data).text || null;

                let msg = new ChatMessage();
                msg.text = text;
                msg.ChatroomId = chatId;
                msg.authorId = userId;
                msg.save()
                    .then((savedMsg) => savedMsg.reload({include: AUTHOR_INCLUDE}))
                    .then((savedMsg) => {
                        let msgText = JSON.stringify(savedMsg);
                        let chatClients = chats.get(savedMsg.ChatroomId).values();
                        for (let cl of chatClients) {
                            cl.send(msgText);
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        client.close();
                    });

            } catch (e) {
                console.error(e);
                client.close();
            }
        });
    });

    return server;
};
