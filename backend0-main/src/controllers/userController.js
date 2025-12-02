const connection = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userController = {
    getAllUsers: async (req, res) => {
        try {
            // Try to select with avatar_url, fallback if column doesn't exist
            let users;
            try {
                [users] = await connection.query(
                    'SELECT id, name, email, role, grade, avatar_url, created_at FROM Users ORDER BY created_at DESC'
                );
            } catch (error) {
                [users] = await connection.query(
                    'SELECT id, name, email, role, grade, created_at FROM Users ORDER BY created_at DESC'
                );
            }
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
            const { name, email, role, grade, avatar_url, password } = req.body;

            // Get current user to preserve existing values
            const [currentUser] = await connection.query(
                'SELECT * FROM Users WHERE id = ?',
                [id]
            );

            if (currentUser.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const current = currentUser[0];

            // If email is provided, check if it's already taken by another user
            if (email && email !== current.email) {
                const [existing] = await connection.query('SELECT id FROM Users WHERE email = ? AND id != ?', [email, id]);
                if (existing.length > 0) {
                    return res.status(400).json({ error: 'Email is already in use by another account' });
                }
            }

            // Build update query dynamically based on provided fields
            const updateFields = [];
            const updateValues = [];

            // For profile updates (self-service), allow updating name and avatar_url without email/role
            // For admin updates, require email and role
            if (name !== undefined) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }
            if (avatar_url !== undefined) {
                updateFields.push('avatar_url = ?');
                updateValues.push(avatar_url);
            }
            if (email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(email);
            }
            if (role !== undefined) {
                updateFields.push('role = ?');
                updateValues.push(role);
            }
            if (grade !== undefined) {
                updateFields.push('grade = ?');
                updateValues.push(role === 'student' ? grade : null);
            }
            if (password !== undefined) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateFields.push('password = ?');
                updateValues.push(hashedPassword);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            updateValues.push(id);

            // Check if avatar_url column exists, if not, skip it
            try {
                await connection.query(
                    `UPDATE Users SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            } catch (dbError) {
                // If avatar_url column doesn't exist, try without it
                if (dbError.code === 'ER_BAD_FIELD_ERROR' && dbError.sqlMessage && dbError.sqlMessage.includes('avatar_url')) {
                    const fieldsWithoutAvatar = updateFields.filter(f => !f.includes('avatar_url'));
                    const valuesWithoutAvatar = updateValues.filter((v, i) => !updateFields[i]?.includes('avatar_url'));
                    if (fieldsWithoutAvatar.length > 0) {
                        await connection.query(
                            `UPDATE Users SET ${fieldsWithoutAvatar.join(', ')} WHERE id = ?`,
                            valuesWithoutAvatar
                        );
                    }
                } else {
                    throw dbError;
                }
            }

            // Get updated user - try to include avatar_url if column exists
            let updatedUser;
            try {
                [updatedUser] = await connection.query(
                    'SELECT id, email, name, role, grade, avatar_url, created_at FROM Users WHERE id = ?',
                    [id]
                );
            } catch (selectError) {
                // If avatar_url column doesn't exist, select without it
                [updatedUser] = await connection.query(
                    'SELECT id, email, name, role, grade, created_at FROM Users WHERE id = ?',
                    [id]
                );
            }

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