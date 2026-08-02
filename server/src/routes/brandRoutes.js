const express = require('express');
const router = express.Router();
const { getBrandSettings, updateBrandSettings } = require('../controllers/brandController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', getBrandSettings);
router.put('/', protect, authorize('admin', 'manager'), updateBrandSettings);

module.exports = router;
