const {HTTPError} = require('../sources/errors.js');
const {replyWithFile} = require('../sources/functions.js');

const FILE_TYPES = {
  //extension:mime-type
  'html':'text/html',
  'css':'text/css',
  'js':'text/javascript',
  'png':'image/png',
  'jpg':'image/jpeg',
  'gif':'image/gif',
  'json':'application/json'
}

function get(request, response, filePath) {
  let extension = /.([a-zA-Z]+)$/.exec(filePath)[1];
  if (!(extension in FILE_TYPES)) {
    throw new HTTPError(400, "Bad Request");
  }
  replyWithFile(response, filePath, FILE_TYPES[extension]);
}

module.exports = get;
