const connection = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const authController = {
    register: async (req, res) => {
        try {
            const { email, password, name, role } = req.body;
            
            // Validate input
            if (!email || !password || !name || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }
            
            // Check if user exists
            const [existing] = await connection.query(
                'SELECT * FROM Users WHERE email = ?',
                [email]
            );
            
            if (existing.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create user
            const userId = uuidv4();
            await connection.query(
                'INSERT INTO Users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
                [userId, email, hashedPassword, name, role]
            );
            
            // Try to select with avatar_url, fallback if column doesn't exist
            let user;
            try {
                [user] = await connection.query(
                    'SELECT id, email, name, role, grade, avatar_url, created_at FROM Users WHERE id = ?',
                    [userId]
                );
            } catch (error) {
                [user] = await connection.query(
                    'SELECT id, email, name, role, grade, created_at FROM Users WHERE id = ?',
                    [userId]
                );
            }
            
            res.status(201).json({ 
                message: 'User registered successfully',
                user: user[0] 
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },
    
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            
            const [users] = await connection.query(
                'SELECT * FROM Users WHERE email = ?',
                [email]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = users[0];
            const validPassword = await bcrypt.compare(password, user.password);
            
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Don't send password in response
            delete user.password;
            
            // Try to include avatar_url if column exists
            let userResponse;
            try {
                [userResponse] = await connection.query(
                    'SELECT id, email, name, role, grade, avatar_url, created_at FROM Users WHERE id = ?',
                    [user.id]
                );
            } catch (error) {
                [userResponse] = await connection.query(
                    'SELECT id, email, name, role, grade, created_at FROM Users WHERE id = ?',
                    [user.id]
                );
            }
            
            res.json({ 
                message: 'Login successful',
                user: userResponse[0] || user
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },
    
    getCurrentUser: async (req, res) => {
        try {
            // This would typically use JWT token authentication
            // For now, we'll use a simple user ID from query/header
            const userId = req.query.userId || req.headers['x-user-id'];
            
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            
            // Try to select with avatar_url, fallback if column doesn't exist
            let users;
            try {
                [users] = await connection.query(
                    'SELECT id, email, name, role, grade, avatar_url, created_at FROM Users WHERE id = ?',
                    [userId]
                );
            } catch (error) {
                [users] = await connection.query(
                    'SELECT id, email, name, role, grade, created_at FROM Users WHERE id = ?',
                    [userId]
                );
            }
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ user: users[0] });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    },
    
    logout: async (req, res) => {
        res.json({ message: 'Logged out successfully' });
    },

    changePassword: async (req, res) => {
        try {
            // This logic is for a "forgot password" flow where the user provides an email.
            // A real-world application would have a token verification step.
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({ error: 'Email and new password are required' });
            }

            // Get user
            const [users] = await connection.query(
                'SELECT * FROM Users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await connection.query(
                'UPDATE Users SET password = ? WHERE id = ?',
                [hashedNewPassword, users[0].id]
            );

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }
};

module.exports = authController;
