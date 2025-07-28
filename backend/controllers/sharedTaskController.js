const sharedTaskModel = require('../models/sharedTaskModel');

const shareTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const { sharedWithId, permission } = req.body;
        const userId = req.user.userId;
        const task = await sharedTaskModel.shareTask(taskId, userId, sharedWithId, permission);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error sharing task', error: error.message });
    }
};

const getSharedTasks = async (req, res) => {
    try {
        const tasks = await sharedTaskModel.getSharedTasks(req.user.userId);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shared tasks', error: error.message });
    }
};

const getSharedTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await sharedTaskModel.getSharedTask(taskId, req.user.userId);
        if (!task) {
            return res.status(404).json({ message: 'Shared task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shared task', error: error.message });
    }
};

const updateSharedTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        console.log(req.user.userId);
        console.log(req.body);
        console.log(taskId);
        const task = await sharedTaskModel.updateSharedTask(taskId, req.user.userId, req.body);
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating shared task', error: error.message });
    }
};

const removeSharedTask = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        console.log('Removing access for task:', taskId, 'by user:', req.user.userId);
        const task = await sharedTaskModel.removeSharedTask(taskId, req.user.userId);
        if (!task) {
            return res.status(404).json({ message: 'Shared task not found or access already removed' });
        }
        res.status(200).json({ message: 'Access removed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error removing shared task', error: error.message });
    }
};

module.exports = {
    shareTask,
    getSharedTasks,
    getSharedTask,
    updateSharedTask,
    removeSharedTask,
};