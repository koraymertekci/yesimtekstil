const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const stocks = require('./stocks.routes');
const orders = require('./orders.routes');
const sales = require('./sales.routes');
const machines = require('./machines.routes');
const finance = require('./finance.routes');
const dashboard = require('./dashboard.routes');
const charts = require('./charts.routes');

router.use('/auth', auth);
router.use('/stocks', stocks);
router.use('/orders', orders);
router.use('/sales', sales);
router.use('/machines', machines);
router.use('/finance', finance);
router.use('/dashboard', dashboard);
router.use('/charts', charts);

module.exports = router;
