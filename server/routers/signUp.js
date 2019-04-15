const user = require('../model/user.js');

const TEMPLATE_NAME = "signUp";

function get(request, response) {
  // If it's already existen user, let redirect him to main:
  if (request.isAuthorize && !request.new_user) {
    return response.redirect('/');
  }

  let isSignUp = 'new_user' in request;
  let newUser = isSignUp ? request.new_user : null;
  let params = {isSignUp, issue:null, currentName:"", newUser}
  response.render(TEMPLATE_NAME, params);
}

function post(request, response) {
  let {login, firstPassword, secondPassword} = request.body;

  user.signUp(login, firstPassword, secondPassword)
    .then(signUpResult => {
      if (signUpResult.ok) {
        request.session.user = signUpResult.user;
        request.session.new_user = signUpResult.user.name;
        response.redirect('/signup');
      } else {
        let issue = signUpResult.issue;
        let currentName = /exists/.test(issue) ? "" : login;
        let viewParams = {isSignUp: false, issue, currentName, newUser: null}
        response.render(TEMPLATE_NAME, viewParams);
      }
    })
    .catch(error => {
      console.error(error);
      response
        .status(500)
        .render('error', {status: 500,  message: "Internal Server Error"});
    });
}

module.exports = {
  get,
  post
}
