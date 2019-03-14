const url = require('url');
const crypto = require('crypto');
const errors = require('./errors.js');

class Cookie {
  constructor(cookieString) {
    this.str = cookieString;
    this.obj = Cookie.parse(cookieString);
  }
  static parse(cookieString) {
    let cookObj = Object.create(null);
    let matches;
    while ((matches = Cookie.pattern.exec(cookieString)) !== null) {
      cookObj[matches[1]] = matches[2];
    }
    return cookObj;
  }
}
Cookie.pattern = /([^;=\s]+)=([^;=\s]+)(;|\s?$)/g;

class Middleware {
  constructor() {
    this.handlers = [];
  }
  use(handler) {
    this.handlers.push(handler);
  }
  operate(request, response) {
    this.handlers.forEach(handler => handler(request, response));
  }
}

class Router {
  constructor() {
    this.handlers = [];
  }
  addHandler(method, pattern, handler) {
    /* Handler should be a function which takes
    request, response and specific string, founded
    in pattern (if it is). Pattern is a regExp which
    describes URI
    */
    this.handlers.push({method, pattern, handler});
  }
  route(req, res) {
    let {pathname} = url.parse(req.url);
    let match;
    for (let obj of this.handlers) {
      match = obj.pattern.exec(pathname);
      if (obj.method === req.method
        && match !== null) {
            return obj.handler(req, res, match[1]);
        }
    }
    throw new errors.HTTPError(404, "Not Found");
  }
}

class Session {
  constructor(request, response) {
    let sessid;
    if (request.headers.hasOwnProperty('cookie')) {
      let cookies = Cookie.parse(request.headers.cookie);
      sessid = cookies['SESSID'];
    }
    if (!sessid) {
      this._id = crypto.randomBytes(32).toString('hex');
      Session.storages[this._id] = Object.create(null);
      let newCooks = response.getHeader('Set-Cookie') || [];
      newCooks.push(`SESSID=${this._id}; HttpOnly`)
      response.setHeader('Set-Cookie', newCooks);
    } else this._id = sessid;
    this.storage = Session.storages[this._id];
  }
  get id() {
    return this._id;
  }
}
Session.storages = {};

module.exports = {
  Cookie,
  Middleware,
  Router,
  Session
}
