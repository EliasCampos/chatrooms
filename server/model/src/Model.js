const db = require('../../db_connection.js');

class Model {
  /**
  * Provides methods for work will database table.
  */

  constructor(tableName) {
    /**
    * Takes a table on what the object will manipulate.
    */
    this._table = tableName;
  }

  insert(data) {
    /**
    * Takes a data object in where keys represents columns,
    * and values represents new fields' value.
    * Returns a promise, which resolves a query result.
    */
    const items = Object.keys(data);
    const values = Object.values(data);

    const itemsStr = items.join(", "); // [a, b, c, ..] => "a, b, c, ..."
    const paramsStr = Array(values.length).fill("?").join(","); // "?, ?, ?..."

    const queryText = `INSERT INTO ${this._table}
    (${itemsStr}) VALUES (${paramsStr}) `;

    return db.query(queryText, values);
  }

  select(criterias, items, params = {}) {
    /**
    * Takes criterias what founded fields should match;
    * arrays of strings - names of required columns;
    * params:
    *  one: boolean, if true will take only one field,
    *  criteriaGlue: could be 'ALL' or 'OR', determinates a way of
    *    accepting criterias - each or any criteria should be passed,
    *  aligner: column on what will based fields sorting,
    *  desc: boolen, indicates order of sorting
    */
    const configuration = Object.assign({}, Model.selectDefaultParams, params);
    const {one, criteriaGlue, aligner, desc} = configuration;

    const queryBase = `SELECT ${!items ? '*' : items.join(', ')} FROM ${this._table}`;
    const criteriasPart = !criterias ? ''
      : " WHERE "
        + Object.keys(criterias).map(c => c + " = ?").join(` ${criteriaGlue} `);
    const orderPart = one || !aligner ? ''
      : ` ORDER BY ${aligner}` + (desc ? " DESC " : '');

    const criteriaValues = !criterias ? null : Object.values(criterias);
    const queryText = queryBase + criteriasPart + orderPart;
    return (one ? db.queryOne : db.query)(queryText, criteriaValues);
  }

  // TODO: update, delete
}
Model.selectDefaultParams = {
  one: false,
  criteriaGlue: 'AND',
  aligner: null,
  desc: false
}

// TODO: Handle wrong input; write tests for the module

module.exports = Model;
