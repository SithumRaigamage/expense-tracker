const express = require('express');
const router = express.Router();
const { getRates, getSupportedCurrencies } = require('../controllers/currencyController');

router.get('/rates', getRates);
router.get('/supported', getSupportedCurrencies);

module.exports = router;
