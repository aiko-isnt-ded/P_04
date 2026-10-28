// Imports
const express = require('express');
const path = require('path');

// Build router
const routerApi = express.Router();

// =======================
// Controllers
// =======================

const usersController = require('../controllers/users_api_controller.js')

// =======================
// User Routes
// =======================

routerApi.post('/login', usersController.login);
routerApi.post('/registerUser', usersController.registerUser);

// ======================= 
// Routes Middlewares
// =======================

const userRoutes = require('./users');
routerApi.use('/users', userRoutes);

const taskRoutes = require('./tasks');
routerApi.use('/tasks', taskRoutes);

const tagRoutes = require('./tags');
routerApi.use('/tags', tagRoutes);

// =======================
// Route paths
// =======================

// routerApi.get(
//     '/', 
//     (req, res) => {
//         if(req.headers['x-auth']) {
//             res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/home.html"));
//         }
//         else {
//             res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/login.html"));
//         }
//     }
// );

// // Public
// routerApi.get(
//     '/login.html',
//     (req, res) => res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/login.html"))
// );

// // Protected
// routerApi.get(
//     '/home.html', authMiddleware,
//     (req, res) => res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/home.html"))
// );

// // Protected
// routerApi.get(
//     '/tasks.html', authMiddleware,
//     (req, res) => res.sendFile(path.resolve(__dirname + "/../../FRONTEND/views/tasks.html"))
// );

// Export router
module.exports = routerApi;