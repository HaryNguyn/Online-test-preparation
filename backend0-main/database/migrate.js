const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});
const connection = require('../src/config/database');
const fs = require('fs');

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const seedDemoUsers = async () => {
    const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM Users');
    if (rows[0].cnt > 0) {
        console.log('ℹ️ Users table already has data, skipping seed.');
        return;
    }

    const password = await bcrypt.hash('password123', 10);
    const users = [
        { id: uuidv4(), email: 'admin@example.com', name: 'Admin User', role: 'admin' },
        { id: uuidv4(), email: 'student@example.com', name: 'John Student', role: 'student' },
        { id: uuidv4(), email: 'teacher@example.com', name: 'Sarah Teacher', role: 'teacher' },
        { id: uuidv4(), email: 'parent@example.com', name: 'Mike Parent', role: 'parent' },
    ];
    for (const u of users) {
        await connection.query(
            'INSERT INTO Users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
            [u.id, u.email, password, u.name, u.role]
        );
    }
    console.log('✅ Seeded demo users (password: password123).');
}

const seedUserMapping = async () => {
    const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM UserMapping');
    if (rows[0].cnt > 0) {
        console.log('ℹ️ UserMapping table already has data, skipping seed.');
        return;
    }

    const userMappings = [
        { mock_id: '0', email: 'admin@example.com' },
        { mock_id: '1', email: 'student@example.com' },
        { mock_id: '2', email: 'teacher@example.com' },
        { mock_id: '3', email: 'parent@example.com' },
        { mock_id: '4', email: 'math.teacher@example.com' },
        { mock_id: '5', email: 'science.teacher@example.com' },
        { mock_id: '6', email: 'english.teacher@example.com' },
        { mock_id: '7', email: 'student2@example.com' }
    ];

    for (const mapping of userMappings) {
        // Find the backend user ID by email
        const [backendUsers] = await connection.query(
            'SELECT id FROM Users WHERE email = ?',
            [mapping.email]
        );

        if (backendUsers.length > 0) {
            await connection.query(
                'INSERT INTO UserMapping (mock_id, backend_id, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE backend_id = VALUES(backend_id)',
                [mapping.mock_id, backendUsers[0].id, mapping.email]
            );
        }
    }

    console.log('✅ Seeded user mapping table.');
}

const runMigration = async () => {
    try {
        console.log('🔄 Starting database migration...');
        
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('✅ Executed statement successfully');
            }
        }
        
    console.log('✅ Database migration completed successfully!');
    console.log('📊 Tables created: Users, UserMapping, Exams, Questions, Submissions, Leaderboard');

    // Seed demo users if empty
    await seedDemoUsers();

    // Seed user mapping
    await seedUserMapping();

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
