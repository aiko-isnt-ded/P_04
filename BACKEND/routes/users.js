// Import express
const express = require('express');

// Take JS file with CRUD operations
const usersController = require('../controllers/users_api_controller.js')
// Build router
const routerUsers = express.Router();

// =======================
// Routes
// =======================

// POST Method
routerUsers.post('/', usersController.registerUser);

// GET Methods
routerUsers.get("/", usersController.usersPage);

routerUsers.use('/:id', usersController.authUsersMiddleware);
routerUsers.get('/:id', usersController.getUserFromID);

// PATCH Method
routerUsers.patch('/:id', usersController.patchUser);

// DELETE Method
routerUsers.delete('/:id', usersController.deleteUser);

// Export router
module.exports = routerUsers;