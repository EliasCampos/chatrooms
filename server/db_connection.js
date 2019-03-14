const mysql = require('mysql');
const {logger} = require('./sources/events.js');
const {DB_PARAMS} = require('../config.js');

const dbConnection = mysql.createConnection(DB_PARAMS);

function connect() {
  return new Promise((resolve, reject) => {
    dbConnection.connect(err => {
      if (err) reject(err);
      else {
        let message = {
          type:"db_connection",
          info:`Connected to Database '${DB_PARAMS.database}'`,
          date:(new Date()).toUTCString()
        }
        logger.emit('message', message);
        resolve();
      }
    });
  });
}
function disconnect() {
  return new Promise((resolve, reject) => {
    dbConnection.end(err => {
      if (err) reject (err);
      else {
        let message = {
          type:"db_connection",
          info:`End of connection with Database '${DB_PARAMS.database}'`,
          date:(new Date()).toUTCString()
        }
        logger.emit('message', message);
        resolve();
      }
    });
  });
}
function query(sql, values = null) {
  return new Promise((resolve, reject) => {
    dbConnection.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
function queryOne(sql, values = null) {
  return new Promise((resolve, reject) => {
    let query = dbConnection.query(sql, values);
    query.on('error', reject);
    query.on('result', resolve);
    query.on('end', resolve);
  });
}


module.exports = {
  connect,
  disconnect,
  query,
  queryOne
}
