const taskModel = require('../models/taskModel');

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskModel.getAllTasks(req.user.userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

const getTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await taskModel.getTaskById(taskId, req.user.userId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching task', error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const task = await taskModel.createTask(req.body, req.user.userId);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await taskModel.updateTask(taskId, req.body, req.user.userId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await taskModel.deleteTask(taskId, req.user.userId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { status } = req.body;
        const task = await taskModel.updateTaskStatus(taskId, status, req.user.userId);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task status', error: error.message });
    }
};

// Filter tasks by due date, status, priority
const filterTasks = async (req, res) => {
    try {
        const filters = {};

        // Extract filter parameters from query string
        if (req.query.dueDate) filters.dueDate = req.query.dueDate;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.dueDateBefore) filters.dueDateBefore = req.query.dueDateBefore;
        if (req.query.dueDateAfter) filters.dueDateAfter = req.query.dueDateAfter;

        const tasks = await taskModel.filterTasks(filters, req.user.userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sort tasks by creation date or priority
const sortTasks = async (req, res) => {
    try {
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'ASC';

        const tasks = await taskModel.sortTasks(sortBy, sortOrder, req.user.userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Combined filter and sort
const filterAndSortTasks = async (req, res) => {
    try {
        const filters = {};

        // Extract filter parameters
        if (req.query.dueDate) filters.dueDate = req.query.dueDate;
        if (req.query.sortBy) filters.sortBy = req.query.sortBy;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.dueDateBefore) filters.dueDateBefore = req.query.dueDateBefore;
        if (req.query.dueDateAfter) filters.dueDateAfter = req.query.dueDateAfter;

        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder || 'ASC';

        const tasks = await taskModel.filterAndSortTasks(filters, sortBy, sortOrder, req.user.userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    filterTasks,
    sortTasks,
    filterAndSortTasks
};  