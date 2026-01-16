const express = require('express');
const router = express.Router();
const { getMonthlySales } = require('../controllers/charts.controller');

router.get('/monthly-sales', getMonthlySales);

module.exports = router;
