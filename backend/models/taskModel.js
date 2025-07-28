const pool = require('../config/db');

const getAllTasks = async (userId) => {
    const result = await pool.query('SELECT * FROM tasks WHERE owner_id = $1 ORDER BY due_date', [userId]);
    return result.rows;
};

const getTaskById = async (taskId, userId) => {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND owner_id = $2', [taskId, userId]);
    return result.rows[0];
};

const createTask = async (task, userId) => {
    const { title, description, due_date } = task;
    const result = await pool.query('INSERT INTO tasks (title, description, due_date, owner_id) VALUES ($1, $2, $3, $4) RETURNING *', [title, description, due_date, userId]);
    return result.rows[0];
};

const updateTask = async (taskId, task, userId) => {
    const { title, description, due_date, status, priority } = task;
    const result = await pool.query('UPDATE tasks SET title = $1, description = $2, due_date = $3, status = $4, priority = $5 WHERE id = $6 AND owner_id = $7 RETURNING *', [title, description, due_date, status, priority, taskId, userId]);
    return result.rows[0];
};

const deleteTask = async (taskId, userId) => {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND owner_id = $2 RETURNING *', [taskId, userId]);
    return result.rows[0];
};

const updateTaskStatus = async (taskId, status, userId) => {
    const result = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 AND owner_id = $3 RETURNING *', [status, taskId, userId]);
    return result.rows[0];
};

const filterTasks = async (filters, userId) => {
    let query = 'SELECT * FROM tasks WHERE owner_id = $1';
    const params = [userId];
    let paramCount = 1;

    // Filter by due date
    if (filters.dueDate) {
        paramCount++;
        query += ` AND dueDate = $${paramCount}`;
        params.push(filters.dueDate);
    }

    // Filter by status
    if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
    }

    // Filter by priority
    if (filters.priority) {
        paramCount++;
        query += ` AND priority = $${paramCount}`;
        params.push(filters.priority);
    }

    // Filter by due date range (before/after)
    if (filters.dueDateBefore) {
        paramCount++;
        query += ` AND dueDate < $${paramCount}`;
        params.push(filters.dueDateBefore);
    }

    if (filters.dueDateAfter) {
        paramCount++;
        query += ` AND dueDate > $${paramCount}`;
        params.push(filters.dueDateAfter);
    }

    const { rows } = await pool.query(query, params);
    return rows;
};

// Sort tasks by creation date or priority
const sortTasks = async (sortBy = 'created_at', sortOrder = 'ASC', userId) => {
    // Validate sort parameters
    const allowedSortFields = ['created_at', 'priority', 'dueDate', 'title'];
    const allowedSortOrders = ['ASC', 'DESC'];

    if (!allowedSortFields.includes(sortBy)) {
        sortBy = 'created_at';
    }

    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) {
        sortOrder = 'ASC';
    }

    const query = `SELECT * FROM tasks WHERE owner_id = $1 ORDER BY ${sortBy} ${sortOrder}`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
};

// Combined filter and sort
const filterAndSortTasks = async (filters = {}, sortBy = 'created_at', sortOrder = 'ASC', userId) => {
    let query = 'SELECT * FROM tasks WHERE owner_id = $1';
    const params = [userId];
    let paramCount = 1;

    // Apply filters
    if (filters.dueDate) {
        paramCount++;
        query += ` AND dueDate = $${paramCount}`;
        params.push(filters.dueDate);
    }

    if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
    }

    if (filters.priority) {
        paramCount++;
        query += ` AND priority = $${paramCount}`;
        params.push(filters.priority);
    }

    if (filters.dueDateBefore) {
        paramCount++;
        query += ` AND dueDate < $${paramCount}`;
        params.push(filters.dueDateBefore);
    }

    if (filters.dueDateAfter) {
        paramCount++;
        query += ` AND dueDate > $${paramCount}`;
        params.push(filters.dueDateAfter);
    }

    // Apply sorting
    const allowedSortFields = ['created_at', 'priority', 'dueDate', 'title'];
    const allowedSortOrders = ['ASC', 'DESC'];

    if (!allowedSortFields.includes(sortBy)) {
        sortBy = 'created_at';
    }

    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) {
        sortOrder = 'ASC';
    }

    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const { rows } = await pool.query(query, params);
    return rows;
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    filterTasks,
    sortTasks,
    filterAndSortTasks
};