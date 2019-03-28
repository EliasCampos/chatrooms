const {Router} = require('express');
// Warning: the line above can produce a problem

// routers:
const mainPage = require('./routers/mainPage.js');
const signUp = require('./routers/signUp.js');
const takeChatAccess = require('./routers/takeChatAccess.js');
const takeChatList = require('./routers/takeChatList.js');
const getChatRoom = require('./routers/chatRoom.js');
const createChat = require('./routers/createChat.js');

const router = new Router();

router.get('/', mainPage.get);
router.post('/', mainPage.post);
router.get('/signup', signUp.get);
router.post('/signup', signUp.post);
router.get('/chatrooms/getaccess', takeChatAccess);
router.get('/chatrooms/list', takeChatList);
router.get('/chatrooms/create', createChat.get);
router.post('/chatrooms/create', createChat.post);
router.get('/chatrooms/:room_id', getChatRoom);

module.exports = router;
