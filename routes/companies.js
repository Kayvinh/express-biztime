"use strict";

const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const router = new express.Router();

/**GET /companies : Returns list of companies
 *
 *  Output:
 *     {companies: [{code, name}, ...]}
*/
router.get("", async function (req, res) {
    const results = await db.query(
        `SELECT code, name
            FROM companies`);

    const companies = results.rows;
    return res.json({ companies });
});

/**GET /companies/[code] : Get specific company data
 *
 * Input:
 *   URL parameter
 *
 * Output:
 *   {company: {code, name, description, invoices: [id, ...]}}
 */

router.get("/:code", async function (req, res) {
    const code = req.params.code;

    const results = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);

    const invoiceResults = await db.query(
        `SELECT id
            FROM invoices
            WHERE comp_code = $1`, [code]);

    const company = results.rows[0];
    const invoices = invoiceResults.rows;
    company.invoices = invoices.map(inv => inv.id);

    if (!company) throw new NotFoundError();

    return res.json({ company });
});

/**POST /companies : Create new company data
 *
 * Input:
 *   {code, name, description}
 *
 * Output:
 *   {company: {code, name, description}}
 */

router.post("", async function (req, res) {
    if (!req.body) throw new BadRequestError();

    const { code, name, description } = req.body;
    const results = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, [code, name, description]
    );
    const company = results.rows[0];

    return res.status(201).json({ company });
});

/**PUT /companies/[code] : Edit existing company.
 *
 * Input:
 *   {name, description}
 *
 * Output:
 *   {company: {code, name, description}}
 */
router.put("/:code", async function (req, res) {
    if (!req.body) throw new BadRequestError();

    const code = req.params.code;
    const { name, description } = req.body;

    const results = await db.query(
        `UPDATE companies
            SET name=$1,
                description=$2
            WHERE code = $3
            RETURNING code, name, description`,
        [name, description, code]
    );

    const company = results.rows[0];

    if (!company) throw new NotFoundError();

    return res.json({ company });
});

/**DELETE /companies/[code] : Delete existing company.
 *
 * Input:
 *   URL parameter
 *
 * Output:
 *   {message: "Company Deleted"}
 */

router.delete("/:code", async function (req, res) {

    const code = req.params.code;

    const results = await db.query(
        `DELETE FROM companies
            WHERE code = $1
            RETURNING code`,
        [code]
    );

    const companyCode = results.rows[0];
    console.log("!!!!!!!!!!!!!!!!", companyCode)

    if(!companyCode) throw new NotFoundError();

    return res.json({ status: "deleted" });
});




module.exports = router;