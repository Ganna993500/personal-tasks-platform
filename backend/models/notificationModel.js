const pool = require('../config/db');
const taskModel = require('./taskModel');

const getNotificationsDueSoon = async (userId) => {
    const now = new Date();
    const dueSoonDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);


    // First, get all tasks for the user
    const allTasks = await taskModel.getAllTasks(userId);

    // Filter tasks due in next 24 hours and insert notifications for them
    const tasksDueSoon = allTasks.filter(task => {
        const taskDueDate = new Date(task.due_date);
        return taskDueDate <= dueSoonDate && task.status !== 'completed';
    });

    console.log(tasksDueSoon);

    // Insert notifications for tasks due soon (avoiding duplicates)
    for (const task of tasksDueSoon) {
        const existingNotification = await pool.query(
            'SELECT id FROM notifications WHERE task_id = $1 AND user_id = $2 AND due_date = $3',
            [task.id, userId, task.due_date]
        );

        if (existingNotification.rows.length === 0) {
            await pool.query(
                'INSERT INTO notifications (user_id, task_id, message, due_date, is_read) VALUES ($1, $2, $3, $4, $5)',
                [userId, task.id, `Task "${task.title}" is due soon`, task.due_date, false]
            );
        }
    }

    // Get all notifications for tasks due in the next 24 hours
    const { rows } = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY due_date',
        [userId]
    );

    return rows;
};

const markAsRead = async (userId) => {
    const { rows } = await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    return rows;
};

module.exports = {
    getNotificationsDueSoon,
    markAsRead
};