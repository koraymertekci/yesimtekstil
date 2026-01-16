const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');

router.get('/', getDashboardStats);

module.exports = router;
