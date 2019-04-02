function markJustSignedUp(request, response, next) {
  if ('new_user' in request.session) {
    request.new_user = request.session.new_user;
    delete request.session.new_user;
  }
  next();
}

module.exports = markJustSignedUp;
