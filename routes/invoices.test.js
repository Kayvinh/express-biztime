const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoiceId;
let testCompany;

beforeEach(async function () {
	await db.query('DELETE FROM companies');
  await db.query('DELETE FROM invoices');

  const companyResults = await db.query(
		`INSERT INTO companies (code, name, description)
         VALUES ('apple', 'Apple', 'Maker of OSX')
         RETURNING code, name, description`
	);

  testCompany = companyResults.rows[0];

	const results = await db.query(
		`INSERT INTO invoices (amt, comp_code)
           VALUES (5, 'apple')
           RETURNING id`
	);

	testInvoiceId = results.rows[0].id;
});

afterAll(async function () {
	await db.end();
});

// GET ROUTES
test('list of invoices', async function () {
	const resp = await request(app).get('/invoices');

	expect(resp.body).toEqual({
		invoices: [
			{
				id: expect.any(Number),
				comp_code: 'apple',
			},
		],
	});
});

describe('GET invoices/:[id]', function () {
	test('Success: display single invoice data', async function () {
		const resp = await request(app).get(`/invoices/${testInvoiceId}`);

		expect(resp.body).toEqual({
			invoice: {
				id: expect.any(Number),
				amt: "5.00",
				paid: false,
				add_date: expect.any(String),
        paid_date: null,
        company: testCompany
			},
		});
	});

	test('Fail: display single invoice data', async function () {
		const resp = await request(app).get(`/invoice/0`);

		expect(resp.statusCode).toEqual(404);
	});
});

// // POST ROUTES
describe('POST /invoices', function () {
	test('Success: Creating new invoice', async function () {
		const resp = await request(app).post(`/invoices`).send({
			comp_code: 'apple',
			amt: '25.00',
		});

		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			invoice: {
				id: expect.any(Number),
				amt: "25.00",
				paid: false,
				add_date: expect.any(String),
        paid_date: null,
        comp_code: 'apple'
			},
		});
	});

	test('Fail: Creating new invoice', async function () {
		const resp = await request(app).post(`/invoices`).send();

		expect(resp.statusCode).toEqual(400);
	});
});

// // PUT ROUTES
describe('PUT /invoices/:id', function () {
	test('Success: Update invoice info', async function () {
		const resp = await request(app)
			.put(`/invoices/${testInvoiceId}`)
			.send({ amt: '900.00' });

		expect(resp.body).toEqual({
			invoice: {
				id: expect.any(Number),
				amt: "900.00",
				paid: false,
				add_date: expect.any(String),
        paid_date: null,
        comp_code: 'apple'
			},
		});
	});

	test('Fail: Update invoice info', async function () {
		const resp = await request(app).put(`/invoices/${testInvoiceId}`).send();

		expect(resp.statusCode).toEqual(400);
	});
});

// // DELETE ROUTES
describe('DELETE /invoices/:id', function () {
	test('Success: Delete invoice', async function () {
		const resp = await request(app).delete(`/invoices/${testInvoiceId}`);

		expect(resp.body).toEqual({ status: 'deleted' });
		expect(resp.statusCode).toEqual(200);
	});

	test('Fail: Update invoice info', async function () {
		const resp = await request(app).delete(`/invoices/0`);

		expect(resp.statusCode).toEqual(404);
	});
});
