const express = require('express');
const router = express.Router();
const { getFinanceSummary, getTransactions } = require('../controllers/finance.controller');

router.get('/summary', getFinanceSummary);
router.get('/transactions', getTransactions);

module.exports = router;
