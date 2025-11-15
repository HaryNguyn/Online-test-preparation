const path = require('path');
const mysql = require('mysql2/promise');

// Resolve .env relative to project root reliably
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

// create the connection to database
// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     database: process.env.DB_NAME,
//     port: process.env.DB_PORT,
//     password: process.env.DB_PASSWORD
// });

// Provide safe defaults and convert port to number
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbName = process.env.DB_NAME || 'harringuyn';
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbPassword = process.env.DB_PASSWORD || '';

// Helpful (non-sensitive) debug output when starting the app
console.log(`DB config -> host=${dbHost} user=${dbUser ? dbUser : '<empty>'} database=${dbName} port=${dbPort}`);

const connection = mysql.createPool({
    host: dbHost,
    user: dbUser,
    database: dbName,
    port: dbPort,
    password: dbPassword,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = connection;