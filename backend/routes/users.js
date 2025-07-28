const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', authorizeRoles('admin'), userController.getAllUsers);
router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);

module.exports = router;