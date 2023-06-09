const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");
const {
  sqlForPartialUpdate,
  sqlForFiltering,
  sqlForFilteringJobs,
} = require("./sql");
const { BadRequestError } = require("../expressError");

describe("USER: create sql from js inputs", function () {
  // for all
  let jsToSql = {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin",
  };

  test("firstName becomes first_name", function () {
    let dataToUpdate = {
      firstName: "Sunshine",
    };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1',
      values: ["Sunshine"],
    });
  });

  test("Two updates turn into a string for setCols", function () {
    let dataToUpdate = {
      firstName: "Sunshine",
      lastName: "River",
    };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2',
      values: ["Sunshine", "River"],
    });
  });
});

describe("Test filter SQL strings for Companies", function () {
  test("no query string returns no statement or terms", function () {
    const result = sqlForFiltering({});

    expect(result).toEqual({
      statement: "",
      terms: [],
    });
  });

  test("query string: ?name:at", function () {
    const result = sqlForFiltering({ name: "at" });

    expect(result).toEqual({
      statement: "WHERE name ILIKE $1",
      terms: ["%at%"],
    });
  });

  test("query string: ?minEmployees:100", function () {
    const result = sqlForFiltering({ minEmployees: 100 });
    expect(result).toEqual({
      statement: "WHERE num_employees BETWEEN 100 AND 999999",
      terms: [],
    });
  });

  test("query string: ?maxEmployees:500", function () {
    const result = sqlForFiltering({ maxEmployees: 500 });
    expect(result).toEqual({
      statement: "WHERE num_employees BETWEEN 0 AND 500",
      terms: [],
    });
  });

  test("query string: ?minEmployees=10&maxEmployees:500", function () {
    const result = sqlForFiltering({ minEmployees: 10, maxEmployees: 500 });
    expect(result).toEqual({
      statement: "WHERE num_employees BETWEEN 10 AND 500",
      terms: [],
    });
  });

  test("query string: ?name=at&minEmployees=10&maxEmployees:500", function () {
    const result = sqlForFiltering({
      name: "at",
      minEmployees: 10,
      maxEmployees: 500,
    });
    console.log("result", result);
    expect(result).toEqual({
      statement: "WHERE name ILIKE $1 AND num_employees BETWEEN 10 AND 500",
      terms: ["%at%"],
    });
  });
});

describe("Test filter SQL strings for Jobs", function () {
  test("no query string returns no statement or terms", function () {
    const result = sqlForFilteringJobs({});

    expect(result).toEqual({
      statement: "",
      terms: [],
    });
  });

  test("query string: ?title:engineer", function () {
    const result = sqlForFilteringJobs({ title: "engineer" });

    expect(result).toEqual({
      statement: "WHERE title ILIKE $1",
      terms: ["%engineer%"],
    });
  });

  test("query string: ?minSalary:10000", function () {
    const result = sqlForFilteringJobs({ minSalary: 10000 });
    expect(result).toEqual({
      statement: "WHERE salary > $1",
      terms: [10000],
    });
  });

  test("query string: ?title=engineer&minSalary:500", function () {
    const result = sqlForFilteringJobs({ title: "engineer", minSalary: 500 });
    expect(result).toEqual({
      statement: "WHERE title ILIKE $1 AND salary > $2",
      terms: ["%engineer%", 500],
    });
  });

  test("query string: ?hasEquity=true", function () {
    const result = sqlForFilteringJobs({
      hasEquity: "true",
    });
    expect(result).toEqual({
      statement: "WHERE equity > 0",
      terms: [],
    });
  });

  test("query string: ?title=engineer&minSalary=10000&hasEquity=true", function () {
    const result = sqlForFilteringJobs({
      title: "engineer",
      minSalary: 10000,
      hasEquity: "true",
    });
    expect(result).toEqual({
      statement: "WHERE title ILIKE $1 AND salary > $2 AND equity > 0",
      terms: ["%engineer%", 10000],
    });
  });
});
