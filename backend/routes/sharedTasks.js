const express = require('express');
const router = express.Router();
const sharedTaskController = require('../controllers/sharedTaskController');

router.get('/', sharedTaskController.getSharedTasks);
router.get('/:id', sharedTaskController.getSharedTask);
router.put('/:id', sharedTaskController.updateSharedTask);
router.delete('/:id', sharedTaskController.removeSharedTask);

module.exports = router;    
