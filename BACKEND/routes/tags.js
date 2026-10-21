// Import express
const express = require('express');

// Take JS file with CRUD operations
const tagsController = require('../controllers/tags_api_controller.js')
// Build router
const routerTags = express.Router();

// =======================
// Routes
// =======================

// Require Authentification
routerTags.use('/', tagsController.authTagsMiddleware);
routerTags.use('/:id', tagsController.authTagsMiddleware);

// POST Method
routerTags.post('/', tagsController.registerTag);

// GET Methods
routerTags.get('/', tagsController.userTags);
routerTags.get('/:id', tagsController.searchTagbyID);

// PATCH Method
routerTags.patch('/:id', tagsController.patchTag);

// DELETE Method
routerTags.delete('/:id', tagsController.deleteTag);

// Export router
module.exports = routerTags;