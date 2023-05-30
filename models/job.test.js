"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new job",
    salary: 60000,
    equity: "0.01",
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new job",
      salary: 60000,
      equity: "0.01",
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new job'`
    );

    expect(result.rows).toEqual([
      {
        title: "new job",
        salary: 60000,
        equity: "0.01",
        company_handle: "c1",
      },
    ]);
  });
});

// /************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "new job 1",
        salary: 100000,
        equity: "0.01",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "new job 2",
        salary: 200000,
        equity: "0.02",
        company_handle: "c2",
      },
    ]);
  });
});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    let jobId = jobs[0].id;
    let job = await Job.get(jobId);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new job 1",
      salary: 100000,
      equity: "0.01",
      company_handle: "c1",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Title",
    salary: 999999,
    equity: "0.09",
  };

  test("works", async function () {
    let res = await Job.findAll();
    let job1 = res[0];
    let job = await Job.update(job1.id, updateData);
    expect(job).toEqual({
      id: job1.id,
      ...updateData,
      company_handle: job1.company_handle,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${job1.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job1.id,
        title: "New Title",
        salary: 999999,
        equity: "0.09",
        company_handle: job1.company_handle,
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let res = await Job.findAll();
    let job1 = res[0];

    let job = await Job.update(job1.id, updateDataSetNulls);
    expect(job).toEqual({
      id: job1.id,
      ...updateDataSetNulls,
      company_handle: job1.company_handle,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = ${job1.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job1.id,
        title: "New",
        salary: null,
        equity: null,
        company_handle: job1.company_handle,
      },
    ]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(0, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let result = await Job.findAll();
    let job1 = result[0];

    await Job.remove(job1.id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=${job1.id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
