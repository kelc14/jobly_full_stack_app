const { BadRequestError, ExpressError } = require("../expressError");

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // create an array of the keys to be updated:
  const keys = Object.keys(dataToUpdate);

  // if there are no keys, that means no data in the patch request, return error:
  if (keys.length === 0) throw new BadRequestError("No data");

  // Take columns and create a sql string.  If column name is JS, convert it to sql-friendly based on inputs provided otherwise just use the col name.  Also add argument index for sql $1, $2, etc...
  //
  // *      Example:
  // *      {firstName: 'Aliya', age: 32} =>
  // *      ['"first_name"=$1', '"age"=$2']
  //
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  // return two things:
  //
  //      setCols: a string of column names joined
  //              together by a ", "
  //            ex: "first_name, email"
  //
  //      values: an array of the values from the data
  //
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// *   Function that filters based on certain keys:
//
//  ({key: var, key:var })
//               => {statement: string,
//                   terms: []}
//
//  possible keys: minEmployee, maxEmployeee, name
//
//

function sqlForFiltering(filtersObj) {
  let statements = [];
  let terms = [];

  // if the filtering obj exists:
  if (filtersObj) {
    // ********* name is in query string:
    //
    if (filtersObj["name"]) {
      let statement = `WHERE name ILIKE $1`;
      statements.push(statement);
      terms.push(`%${filtersObj["name"]}%`);
    }

    // ******** minEmployee or maxEmployee in query string
    if (filtersObj["minEmployees"] || filtersObj["maxEmployees"]) {
      // check for errors if a number is not used:
      if (filtersObj["minEmployees"] && !Number(filtersObj["minEmployees"])) {
        throw new BadRequestError("Minimum employees must be a number", 400);
      }
      if (filtersObj["maxEmployees"] && !Number(filtersObj["maxEmployees"])) {
        throw new BadRequestError("Maxmimum employees must be a number", 400);
      }
      // if min or max employees is NOT a number or does not exist, set a default:
      // this should also protect against SQL injection ?
      let minEmployees = Number(filtersObj["minEmployees"]) || 0;
      let maxEmployees = Number(filtersObj["maxEmployees"]) || 999999;

      // create a statement:
      let statement;
      if (filtersObj["name"]) {
        // this will be the second part of the statement if we already created a NAME SELECT STATEMENT so we do not include WHERE
        statement = `num_employees BETWEEN ${minEmployees} AND ${maxEmployees}`;
      } else {
        statement = `WHERE num_employees BETWEEN ${minEmployees} AND ${maxEmployees}`;
      }
      statements.push(statement);
    }
  }
  // console.log("statement", statements);
  // console.log("terms", terms);

  return {
    statement: statements.join(" AND "),
    terms,
  };
}

module.exports = { sqlForPartialUpdate, sqlForFiltering };
