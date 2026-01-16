const express = require('express');
const router = express.Router();
const { getStocks, getStockById, createStock, updateStock, deleteStock } = require('../controllers/stocks.controller');

router.get('/', getStocks);
router.get('/:id', getStockById);
router.post('/', createStock);
router.put('/:id', updateStock);
router.delete('/:id', deleteStock);

module.exports = router;
