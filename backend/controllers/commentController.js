const commentModel = require('../models/commentModel');

const addComment = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const userId = req.user.userId;

        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: 'Comment is required' });
        }

        const result = await commentModel.addComment(taskId, comment, userId);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

const getComments = async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const comments = await commentModel.getComments(taskId);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

module.exports = {
    addComment,
    getComments,
};  