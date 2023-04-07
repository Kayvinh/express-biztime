'use strict';

const express = require('express');
const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const router = new express.Router();

/**GET /invoices : Returns list of invoices
 *
 *  Output:
 *     {invoices: [{id, comp_code}, ...]}
 */
router.get('', async function (req, res) {
	const results = await db.query(
		`SELECT id, comp_code
          FROM invoices`
	);

	const invoices = results.rows;
	return res.json({ invoices });
});

/**GET /invoices/[id] : Returns obj on given invoice. If invoice cannot be
 *                      found, returns 404.
 *
 * Input:
 *   URL parameter
 *
 * Output:
 *   {invoice:
 *      {id,
 *       amt,
 *       paid,
 *       add_date,
 *       paid_date,
 *       company: { code, name, description }
 *     }
 *   }
 */

router.get('/:id', async function (req, res) {
	const id = Number(req.params.id);

	const invoiceResults = await db.query(
		`SELECT id, amt, paid, add_date, paid_date, comp_code
          FROM invoices
          WHERE id = $1`,
		[id]
	);

	const invoice = invoiceResults.rows[0];
	if (!invoice) throw new NotFoundError(`Invoice ID#${id} not found`);

	const companyResults = await db.query(
		`SELECT code, name, description
          FROM companies
          WHERE code = $1`,
		[invoice.comp_code]
	);

	const company = companyResults.rows[0];
	if (!company) throw new NotFoundError(`Company not found for invoice ID #${id}`);

	invoice.company = company;
	delete invoice.comp_code;

	return res.json({ invoice });
});

/** POST /invoices/ : Adds an invoice.
 *
 * Input:
 *   {comp_code, amt}
 *
 * Output:
 *   {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.post('', async function (req, res) {
	if (!req.body) throw new BadRequestError();
	const { comp_code, amt } = req.body;

	const results = await db.query(
		`INSERT INTO invoices (comp_code, amt)
          VALUES ($1, $2)
          RETURNING id, comp_code, amt, paid, add_date, paid_date`,
		[comp_code, amt]
	);

	const invoice = results.rows[0];

	return res.status(201).json({ invoice });
});

/**PUT /invoices/[id] : Updates an invoice. If invoice cannot be found,
 *                      returns a 404.
 *
 * Input:
 *   {amt}
 *
 * Output:
 *   {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put('/:id', async function (req, res) {
	if (!req.body) throw new BadRequestError();

	const id = Number(req.params.id);
	const { amt } = req.body;

	const results = await db.query(
		`UPDATE invoices
          SET amt=$1
          WHERE id = $2
          RETURNING id, comp_code, amt, paid, add_date, paid_date`,
		[amt, id]
	);

	const invoice = results.rows[0];

	if (!invoice) throw new NotFoundError();

	return res.json({ invoice });
});

/**DELETE /invoices/[id] : Deletes an invoice. If invoice cannot be found,
 *                         returns a 404.
 *
 * Input:
 *   URL parameter
 *
 * Output:
 *   {status: "deleted"}
 */

router.delete('/:id', async function (req, res) {
	const id = req.params.id;
  if (isNaN(Number(id))) throw new NotFoundError();

	const results = await db.query(
		`DELETE FROM invoices
          WHERE id = $1
          RETURNING id`,
		[id]
	);

	const invoiceIdObj = results.rows[0];
	if (!invoiceIdObj) throw new NotFoundError();

	return res.json({ status: 'deleted' });
});

module.exports = router;
