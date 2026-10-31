// =======================
// API Imports
// =======================

// Import Library
const fs = require('fs');
const path = require('path');
// Import Tag Model
const Tag = require('../models/tag');

// =======================
// DBs
// =======================

const TAGS_PATH = path.join(__dirname, '../database/tags.json');
const TASKS_PATH = path.join(__dirname, '../database/tasks.json');
const USERS_PATH = path.join(__dirname, '../database/users.json');

// Read Functions
function readTags() {
    return JSON.parse(fs.readFileSync(TAGS_PATH, 'utf8'));
}

function readTasks() {
    return JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
}

function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

// Write functions
function writeTags(users) {
    fs.writeFileSync(TAGS_PATH, JSON.stringify(users, null, 2));
}

// =======================
// API Functions
// =======================

exports.authTagsMiddleware = (req, res, next) => {
    try {
        // Read users
        let users = readUsers();

        // Check whether a password was entered
        let pwd = req.get('x-auth');
        if (!pwd) return res.status(401).send('Password is missing');

        // Validate user
        let found_user = users.find(i => String(i.password) === pwd);
        if (!found_user) return res.status(404).send('Invalid Password');

        // If everything's well
        req.user = found_user;
        next()
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// POST Method to create tag
exports.registerTag = (req, res) => {
    try {
        // Read tags
        let tags = readTags();

        // Get body params
        let name = req.body.name;
        let color = req.body.color;

        // Validation
        if (!name || !color) return res.status(400).send('Tag MUST have both name and color');

        // Create new Tag
        let new_tag = new Tag(name, color, req.user.id);
        let tag_obj = new_tag.toObj();

        // Save to file
        tags.push(tag_obj);
        writeTags(tags);
        
        return res.status(201).json({
            message: 'Tag created successfully!',
            tag: tag_obj
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// GET Method to Search ALL tags
exports.userTags = (req, res) => {
    try {
        // Read tags
        let tags = readTags();

        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);

        // Get user tags
        let user_tags = tags.filter(i => String(i.id_user) === String(req.user.id));
        
        let start = (page - 1) * limit;
        let end = start + limit;

        // Send response
        res.json({
            page: page,
            next_page: page + 1,
            limit: limit,
            total: tags.length,
            data: user_tags.slice(start, end)
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// GET Method to Search a Tag based on ID
exports.searchTagbyID = (req, res) => {
    try {
        // Read tags
        let tags = readTags();

        // Search for a tag based on ID
        let found_tag = tags.find(i => String(i.id_user) === String(req.user.id) && String(i.id) === req.params.id);
        
        // If no tag was found
        if (!found_tag) return res.status(404).send('Tag not Found');
    
        // Return response
        return res.json(found_tag);
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// PATCH Method to Update a Tag by ID
exports.patchTag = (req, res) => {
    try {
        // Read tags
        let tags = readTags();

        // Get body of the request
        let body = req.body;

        // Updatable fields
        let fields = ['name', 'color'];
        let changes = {};

        // Iterate through the fields of the request body
        for (const i of fields) {
            // If field exists, change the field in body
            if (i in body) {
                changes[i] = body[i];
            }
        }

        // Error message: No valid fields
        if (Object.keys(changes).length === 0) {
            return res.status(400).send('No valid fields were given');
        }

        // Find the tag
        let index = tags.findIndex(i => String(i.id) === req.params.id && String(i.id_user) === String(req.user.id));
        if (index === -1) {
            return res.status(404).send("Tag not Found");
        }

        // Create updated tag
        let data = {...tags[index], ...changes};
        let new_tag = new Tag(data.name, data.color, data.id_user);
        let updated_tag = {...new_tag.toObj(), id: tags[index].id};

        // Update the tag
        tags[index] = updated_tag;
        writeTags(tags);

        return res.json ({
            message: "Tag updated successfully!",
            tag: updated_tag
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// DELETE method
exports.deleteTag = (req, res) => {
    try {
        // Read files
        let tags = readTags();
        let tasks = readTasks();

        // Get tag index
        let index = tags.findIndex(i => String(i.id) === req.params.id && String(i.id_user) === String(req.user.id));

        // If no index found
        if (index === -1) return res.status(404).send('Tag not Found');

        // If task was found
        let deleted_tag = tags[index];

        // Check if tag is used by any task
        let tag_used = tasks.some(i => Array.isArray(i.tags) && i.tags.some(j => j === tag_id)); 
        if (tag_used) return res.status(400).send('Tag is in use by a task and CANNOT be deleted');

        // Remove if tag isn't being used
        tags.splice(index, 1);
        writeTags(tags);

        // Send response
        res.json({
            message: `Tag with ID ${req.params.id} was successfully deleted`,
            tag: deleted_tag
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}