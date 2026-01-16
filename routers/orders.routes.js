const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus } = require('../controllers/orders.controller');

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id', updateOrderStatus);

module.exports = router;
