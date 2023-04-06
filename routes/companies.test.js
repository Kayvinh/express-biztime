const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompanyCode;

beforeEach(async function () {
    await db.query("DELETE FROM companies");
    const results = await db.query(
          `INSERT INTO companies (code, name, description)
           VALUES ('apple', 'Apple', 'Maker of OSX')
           RETURNING code`);

        testCompanyCode = results.rows[0].code;
  });
  
  afterAll(async function () {
    await db.end();
  });
  

// GET ROUTES
test("list of companies", async function () {
    const resp = await request(app).get("/companies");

    expect(resp.body).toEqual({
        companies: [{
            code: "apple",
            name: "Apple",
        }],
    });
});

describe("GET companies/:[code]", function () {
    test("Success: display single company data", async function () {
        const resp = await request(app)
        .get(`/companies/${testCompanyCode}`);
    
        expect(resp.body).toEqual({
            company: {
                code: "apple",
                name: "Apple",
                description: "Maker of OSX",
		        invoices: []
            },
        });
    });
    
    test("Fail: display single company data", async function () {
        const resp = await request(app).get(`/companies/badCode`);
    
        expect(resp.statusCode).toEqual(404);
    });
});

// POST ROUTES
describe("POST /companies", function () {
    test("Success: Creating new company", async function () {
        const resp = await request(app)
            .post(`/companies`)
            .send({
                code: "newCompany",
                name: "new company",
                description: "new company"
            });
    
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            company: {
                code: "newCompany",
                name: "new company",
                description: "new company",
            },
        });
    });
    
    test("Fail: Creating new company", async function () {
        const resp = await request(app)
            .post(`/companies`)
            .send();
    
        expect(resp.statusCode).toEqual(400);
    });
});

// PUT ROUTES
describe("PUT /companies:code", function () {
    test("Success: Update company info", async function () {
        const resp = await request(app)
            .put(`/companies/${testCompanyCode}`)
            .send({ name: "Apple2", description: "New Apple" });
    
        expect(resp.body).toEqual({
            company: {
                code: "apple",
                name: "Apple2",
                description: "New Apple",
            },
        });
    });

    test("Fail: Update company info", async function () {
        const resp = await request(app)
            .put(`/companies/${testCompanyCode}`)
            .send();
    
        expect(resp.statusCode).toEqual(400);
    });
});

// DELETE ROUTES
describe("DELETE /companies:code", function () {
    test("Success: Delete company", async function () {
        const resp = await request(app).delete(`/companies/${testCompanyCode}`)
    
        expect(resp.body).toEqual({status: "deleted"});
        expect(resp.statusCode).toEqual(200);
    });

    test("Fail: Update company info", async function () {
        const resp = await request(app).delete(`/companies/badCompanyCode`)
    
        expect(resp.statusCode).toEqual(404);
    });
});