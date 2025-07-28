const pool = require('../config/db');

const addComment = async (taskId, comment, userId) => {

    const result = await pool.query('INSERT INTO comments (task_id, comment, user_id) VALUES ($1, $2, $3) RETURNING *', [taskId, comment, userId]);

    return result.rows[0];
};

const getComments = async (taskId) => {
    const result = await pool.query('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = $1', [taskId]);
    return result.rows;
};


module.exports = {
    addComment,
    getComments,
};