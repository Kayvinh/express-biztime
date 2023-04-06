const express = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const router = new express.Router();

router.get("", async function (req, res) {
    const results = await db.query(
        `SELECT code, name
            FROM companies`);

    const companies = results.rows;
    return res.json({ companies });
});

router.get("/:code", async function (req, res) {
    const code = req.params.code;
    if (!code) throw new BadRequestError();

    const results = await db.query(
        `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);

    if (results.rowCount === 0) throw new NotFoundError();

    const company = results.rows[0];
    return res.json({ company });
});

router.post("", async function (req, res) {
    if(!req.body) throw new BadRequestError();

    const { code, name, description } = req.body;
    const results = await db.query(
        `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, [code, name, description]
    );

    const company = results.row;
    return res.status(201).json({ company });
});







module.exports = router;