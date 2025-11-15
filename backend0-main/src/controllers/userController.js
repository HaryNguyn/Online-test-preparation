const connection = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userController = {
    getAllUsers: async (req, res) => {
        try {
            const [users] = await connection.query(
                'SELECT id, name, email, role, grade, created_at FROM Users ORDER BY created_at DESC'
            );
            res.json({ users });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({ error: 'Failed to retrieve users' });
        }
    },

    createUser: async (req, res) => {
        try {
            const { email, password, name, role, grade } = req.body;

            if (!email || !password || !name || !role) {
                return res.status(400).json({ error: 'Email, password, name, and role are required' });
            }

            const [existing] = await connection.query('SELECT id FROM Users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            await connection.query(
                'INSERT INTO Users (id, email, password, name, role, grade) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, name, role, role === 'student' ? grade : null]
            );

            const [newUser] = await connection.query(
                'SELECT id, email, name, role, grade, created_at FROM Users WHERE id = ?',
                [userId]
            );

            res.status(201).json({ message: 'User created successfully', user: newUser[0] });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role, grade } = req.body;

            if (!name || !email || !role) {
                return res.status(400).json({ error: 'Name, email, and role are required' });
            }

            // Check if email is already taken by another user
            const [existing] = await connection.query('SELECT id FROM Users WHERE email = ? AND id != ?', [email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email is already in use by another account' });
            }

            await connection.query(
                'UPDATE Users SET name = ?, email = ?, role = ?, grade = ? WHERE id = ?',
                [name, email, role, role === 'student' ? grade : null, id]
            );

            const [updatedUser] = await connection.query(
                'SELECT id, email, name, role, grade, created_at FROM Users WHERE id = ?',
                [id]
            );

            if (updatedUser.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ message: 'User updated successfully', user: updatedUser[0] });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            const [result] = await connection.query('DELETE FROM Users WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            // Handle foreign key constraint error if user has related data
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ error: 'Cannot delete user. They have associated data (e.g., test results). Please reassign or delete the data first.' });
            }
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
};

module.exports = userController;