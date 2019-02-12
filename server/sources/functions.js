const fs = require('fs');
const path = require('path');

const BASEDIR = '/home/elias/programming/projects/chatrooms/client';
const HTML_SPECIAL_CHARS = {
  '&': '&amp;',
  '"': '&quot;',
  '\'': '&#039;',
  '<': '&lt;',
  '>': '&gt;'
}

function readStream(readable) {
  return new Promise((resolve, reject) => {
    readable.setEncoding('utf8');
    let data = "";
    readable.on('data', chunk => data += chunk);
    readable.on('end', () => resolve(data));
    readable.on('error', reject);
  });
}

function replyWithFile(response, relFilePath, mimeType) {
  let file = fs.createReadStream(BASEDIR + relFilePath);
  file.on('error', err => {
    if (err.code === 'ENOENT') {
      response.writeHead(404, "Not Found");
    } else {
      console.error(err.stack);
      response.writeHead(500, "Internal Server Error");
    }
    response.end(`Can't load ${relFilePath}`);
  });
  file.once('readable', () => {
    response.setHeader('Content-Type', mimeType);
    response.writeHead(200, "OK");
  });
  file.pipe(response);
}

function replaceHTMLSpecialChars(string) {
  let pattern = new RegExp(Object.keys(HTML_SPECIAL_CHARS).join('|'), 'g');
  return string.replace(pattern, char => HTML_SPECIAL_CHARS[char]);
}// But, actually, EJS convert html special characters automaticaly!!!

function addIfNotPresent(array) {
  return function(element) {
    if (!array.includes(element)) array.push(element);
  }
}

module.exports = {
  readStream,
  replyWithFile,
  replaceHTMLSpecialChars,
  addIfNotPresent
}
