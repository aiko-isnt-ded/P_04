// Import express
const express = require('express');

// Take JS file with CRUD operations
const tasksController = require('../controllers/tasks_api_controller.js')
// Build router
const routerTasks = express.Router();

// =======================
// Routes
// =======================

// Require Authentification
// routerTasks.use(tasksController.authTasksMiddleware);

// POST Method
routerTasks.post('/', tasksController.authTasksMiddleware, tasksController.registerTask);

// GET Methods
routerTasks.get('/', tasksController.authTasksMiddleware2, tasksController.userTasks);

routerTasks.get('/:id', tasksController.authTasksMiddleware2, tasksController.searchTaskbyID);

// PATCH Method
routerTasks.patch('/:id', tasksController.authTasksMiddleware2, tasksController.patchTask);

// DELETE Method
routerTasks.delete('/:id', tasksController.authTasksMiddleware2, tasksController.deleteTask);

// Export router
module.exports = routerTasks;