const {Router} = require('./sources/classes.js');
// Warning: the line above can produce a problem

// routers:
const mainPage = require('./routers/mainPage.js');
const signUp = require('./routers/signUp.js');
const takeChatAccess = require('./routers/takeChatAccess.js');
const takeChatList = require('./routers/takeChatList.js');
const getChatRoom = require('./routers/chatRoom.js');
const createChat = require('./routers/createChat.js');
const provideStaticFiles = require('./routers/publicStatic.js');

const router = new Router();

router.addHandler('GET', /^\/$|^\/main$/, mainPage.get);
router.addHandler('POST', /^\/$/, mainPage.post);
router.addHandler('GET', /^\/signup$/, signUp.get);
router.addHandler('POST', /^\/signup$/, signUp.post);
router.addHandler('GET', /^\/chatrooms\/getaccess$/, takeChatAccess);
router.addHandler('GET', /^\/chatrooms\/list$/, takeChatList);
router.addHandler('GET', /^\/chatrooms\/(\d+)$/, getChatRoom);
router.addHandler('GET', /^\/chatrooms\/create$/, createChat.get);
router.addHandler('POST', /^\/chatrooms\/create$/, createChat.post);
router.addHandler('GET', /^(\/\w+\/\w+\.[a-zA-Z]+)$/, provideStaticFiles);

module.exports = router;
