const mysql = require('mysql');

const dbConnection = mysql.createConnection({});

function connect() {
  return new Promise((resolve, reject) => {
    dbConnection.connect(err => {
      if (err) reject(err);
      else resolve(console.log(`Connected to DB '${DB_PARAMS.database}'`));
    });
  });
}
function disconnect() {
  return new Promise((resolve, reject) => {
    dbConnection.end(err => {
      if (err) reject (err);
      else {
        console.log(`End of connection with DB '${DB_PARAMS.database}'`);
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
