require('dotenv').config({path: '../.env'});
const express = require('express');//commonjs
const cors = require('cors');
const configViewEngine = require('./config/viewEngine');
const webRoutes = require('./routes/web');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const connection = require('./config/database');

const app = express();//app express
const port = process.env.PORT || 8081;//port => hardcode . uat . prod
const hostname = process.env.HOST_NAME;

// Enable CORS for frontend
const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
const allowedOrigins = new Set(defaultOrigins);

if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
        .forEach(origin => allowedOrigins.add(origin));
}

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
}));

// config req.body
app.use(express.json()); //utilizes the body-parser package
app.use(express.urlencoded({ extended: true }));

// config template engine
configViewEngine(app);

// API routes (mount before web routes)
app.use('/api', apiRoutes);
app.use('/api/users', userRoutes); // Mount user routes

// khai bao route
app.use('/', webRoutes);

// test connection
 
// Thêm dòng này nếu chưa có
app.use(express.static('public'));

//simple query
// connection.query(
//     'SELECT * FROM Users u',
//     function (err, results, fields) {
//         console.log(results); // results contains rows returned by server
//         console.log(fields); // fields contains extra meta data about results, if available
//     }
// );

app.listen(port, () => {
    console.log(`🚀 Backend server running on http://${hostname}:${port}`);
    console.log(`📊 API available at http://${hostname}:${port}/api`);
    console.log(`🌐 Web routes at http://${hostname}:${port}`);
});