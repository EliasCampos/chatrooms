const pg = require('pg');

const client = new pg.Client({
  host: 'db',
  port:5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

function connect() {
  return client.connect();
}

function disconnect() {
  return client.end();
}

function query(sql, values = null) {
  console.log(sql);
  return new Promise((resolve, reject) => {
    client.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result.rows);
    });
  });
}

function queryOne(sql, values = null) {
  console.log(sql);
  return new Promise((resolve, reject) => {
    client.query(sql, values, (err, result) => {
      if (err) reject(err);
      else if (result.rows.length === 0) resolve(null);
      else resolve(result.rows[0]);
    });
  });
}


module.exports = {
  connect,
  disconnect,
  query,
  queryOne
};
