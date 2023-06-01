"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New Job",
    salary: 10000,
    equity: 0.1,
    company_handle: "c1",
  };

  test("ok for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "New Job",
        salary: 10000,
        equity: "0.1",
        company_handle: "c1",
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new title",
        company_handle: "c1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "New Job",
        salary: "10000",
        equity: 0.1,
        company_handle: "c1",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100000,
          equity: "0.01",
          company_handle: "c1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 200000,
          equity: "0.02",
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 300000,
          equity: "0.03",
          company_handle: "c3",
        },
      ],
    });
  });

  test("filter job title", async function () {
    const resp = await request(app).get("/jobs?title=job");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100000,
          equity: "0.01",
          company_handle: "c1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 200000,
          equity: "0.02",
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 300000,
          equity: "0.03",
          company_handle: "c3",
        },
      ],
    });
  });

  test("filter job minSalary", async function () {
    const resp = await request(app).get("/jobs?minSalary=100000");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 200000,
          equity: "0.02",
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 300000,
          equity: "0.03",
          company_handle: "c3",
        },
      ],
    });
  });

  test("filter job hasEquity", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job1",
          salary: 100000,
          equity: "0.01",
          company_handle: "c1",
        },
        {
          id: expect.any(Number),
          title: "Job2",
          salary: 200000,
          equity: "0.02",
          company_handle: "c2",
        },
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 300000,
          equity: "0.03",
          company_handle: "c3",
        },
      ],
    });
  });

  test("filter job all three", async function () {
    const resp = await request(app).get(
      "/jobs?title=job&minSalary=200000&hasEquity=true"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "Job3",
          salary: 300000,
          equity: "0.03",
          company_handle: "c3",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];

    const resp = await request(app).get(`/jobs/${job.id}`);
    expect(resp.body).toEqual({
      job: {
        id: job.id,
        title: "Job1",
        salary: 100000,
        equity: "0.01",
        company_handle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("work for admin users", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        title: "Job-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      job: {
        id: job.id,
        title: "Job-new",
        salary: 100000,
        equity: "0.01",
        company_handle: "c1",
      },
    });
  });

  test("does not work for non-admin users", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        title: "Job-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app).patch(`/jobs/${job.id}`).send({
      title: "Job-new",
    });

    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        id: 100,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        equity: 1.5,
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app)
      .delete(`/jobs/${job.id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({ deleted: `${job.id}` });
  });

  test("does not work for non-admin users", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app)
      .delete(`/jobs/${job.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    let job1 = await Job.findAll({});
    let job = job1[0];
    const resp = await request(app).delete(`/jobs/${job.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
