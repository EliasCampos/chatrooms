const startSession = require('./startSession');

function setUser(request, response, next) {
    if ('new_user' in request.session) {
        request.new_user = request.session.new_user;
        delete request.session.new_user;
    }
    next();
}

function checkAuth(request, response, next) {
    request.isAuthorize = ('user' in request.session);
    request.error = request.isAuthorize ?
        null
        : {status:403, message:"Forbidden"};
    next();
}

module.exports = {
    checkAuth,
    setUser,
    startSession
};
