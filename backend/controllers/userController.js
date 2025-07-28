const userModel = require('../models/userModel');

const getAllUsers = async (req, res) => {
    try {

        const users = await userModel.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const user = await userModel.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log(id);
        if (id != req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (req.body.role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const updatedUser = await userModel.updateUser(id, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getAllUsers,
    getUserProfile,
    updateUserProfile,
};  