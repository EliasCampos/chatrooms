const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const {readStream} = require('./sources/functions.js');

async function render(templateString, data) {
  let html = await ejs.render(
    templateString,
    data,
    {async:true}
  );
  return html;
}
function deployPage(response, templateName, data, responseHead) {
  /* head should contain response status and response message */
  let head = responseHead || {status:200, message:"OK"}

  let templatePath = path
    .resolve(__dirname, "../templates/"+templateName);
  let templateFile = fs.createReadStream(templatePath);

  readStream(templateFile)
    .then(template => render(template, data))
    .then(htmlString => {
      response.setHeader('Content-Type', 'text/html');
      response.writeHead(head.status, head.message);
      response.write(htmlString);
      response.end();
    })
    .catch(error => {
      console.error(error.stack);
      response.writeHead(500, "Internal Server Error");
      response.end('Problem on the server');
    });
};
module.exports = deployPage ;
