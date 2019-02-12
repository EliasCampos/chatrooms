const EventEmitter = require('events');

const logger = new EventEmitter();
/* logger will emit an message
  represented as an object with
  properties 'type','info',['date']*/

logger.on('message', message => {
  let {type, info} = message;
  switch (type) {
    case "request":
      console.log(`${message.date}:request from ${info}`)
      break;
    case "db_connection":
      console.log("DB:", info);
      break;
    /* Here will be more cases... */
    default:
      console.log(`${type} message: ${info}`);
  }
});

module.exports = {
  logger
}
