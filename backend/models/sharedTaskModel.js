const pool = require('../config/db');

const shareTask = async (taskId, userId, sharedWithId, permission = 'read') => {
    const result = await pool.query('INSERT INTO shared_tasks (task_id, user_id,shared_with_id, permission) VALUES ($1, $2, $3, $4) RETURNING *', [taskId, userId, sharedWithId, permission]);
    return result.rows[0];
};

const getSharedTasks = async (userId) => {
    const result = await pool.query('SELECT t.*, st.permission FROM tasks t JOIN shared_tasks st ON t.id = st.task_id WHERE st.shared_with_id = $1', [userId]);
    return result.rows;
};

const getSharedTask = async (taskId, userId) => {
    const result = await pool.query('SELECT t.*, st.permission FROM tasks t JOIN shared_tasks st ON t.id = st.task_id WHERE t.id = $1 AND st.shared_with_id = $2', [taskId, userId]);
    return result.rows[0];
};

const updateSharedTask = async (taskId, userId, data) => {
    const { title, description, due_date, status, priority } = data;
    const permissionCheck = await pool.query('SELECT permission FROM shared_tasks WHERE task_id = $1 AND shared_with_id = $2', [taskId, userId]);
    if (permissionCheck.rows[0]?.permission !== 'write') {
        throw new Error('You do not have permission to edit this task');
    }

    const result = await pool.query('UPDATE tasks SET title = $1, description = $2, due_date = $3, status = $4, priority = $5 WHERE id = $6 RETURNING *', [title, description, due_date, status, priority, taskId]);
    return result.rows[0];
};

const removeSharedTask = async (taskId, userId) => {
    // Remove the shared task record where the current user is the shared_with_id
    const result = await pool.query('DELETE FROM shared_tasks WHERE task_id = $1 AND shared_with_id = $2 RETURNING *', [taskId, userId]);
    return result.rows[0];
};

module.exports = {
    shareTask,
    getSharedTasks,
    getSharedTask,
    updateSharedTask,
    removeSharedTask,
}