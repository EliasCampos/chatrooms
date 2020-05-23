const WebSocket = require('ws');

const parseSession = require('../middlewares/startSession');
const { User, ChatMessage } = require('../models');

const AUTHOR_INCLUDE = {model: User, as: 'author', attributes: ['id', 'username']};
const MSG_MAX_LENGTH = 50;


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
                let error = extractMessageTextError(text);
                if (!!error) return client.send(JSON.stringify({'error': error}));

                let msg = new ChatMessage();
                msg.text = text;
                msg.ChatroomId = chatId;
                msg.authorId = userId;
                msg.save()
                    .then((savedMsg) => savedMsg.reload({include: AUTHOR_INCLUDE}))
                    .then((savedMsg) => {
                        let msgResponse = JSON.stringify({'message': savedMsg});
                        let chatClients = chats.get(savedMsg.ChatroomId).values();
                        for (let cl of chatClients) {
                            cl.send(msgResponse);
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


function extractMessageTextError(text) {
    let error = null;

    if (text === null || text === '') {
        error = 'Text of message is required';
    }
    else if (text.length > MSG_MAX_LENGTH) {
        error = `Text should contain at most ${MSG_MAX_LENGTH} characters.`;
    }

    return error;
}