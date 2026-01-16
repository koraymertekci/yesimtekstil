const express = require('express');
const router = express.Router();
const { getMachines, updateMachineStatus } = require('../controllers/machines.controller');

router.get('/', getMachines);
router.put('/:id', updateMachineStatus);

module.exports = router;
