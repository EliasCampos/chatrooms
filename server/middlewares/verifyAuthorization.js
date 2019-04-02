function verifyAuthorization(request, response, next) {
  request.isAuthorize = ('user' in request.session);
  request.error = request.isAuthorize ?
    null
    : {status:403, message:"Forbidden"};
  next();
}

module.exports = verifyAuthorization;
