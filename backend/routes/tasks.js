const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const sharedTaskController = require('../controllers/sharedTaskController');
const commentController = require('../controllers/commentController');

router.post('/:id/comments', commentController.addComment);
router.get('/:id/comments', commentController.getComments);

router.get('/', taskController.getAllTasks);
router.get('/filter', taskController.filterTasks);
router.get('/sort', taskController.sortTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.put('/:id/status', taskController.updateTaskStatus);
router.post('/:id/share', sharedTaskController.shareTask);





module.exports = router;

