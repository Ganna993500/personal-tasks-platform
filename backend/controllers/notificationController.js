const notificationModel = require('../models/notificationModel');

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        //console.log(userId);
        const notifications = await notificationModel.getNotificationsDueSoon(userId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await notificationModel.markAsRead(userId);
        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getNotifications,
    markAllNotificationsRead
};