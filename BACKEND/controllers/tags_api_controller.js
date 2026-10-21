// =======================
// API Imports
// =======================

// Import Library
const fs = require('fs');
// Import Tag Model
const Tag = require('../models/tag');
// Load JSON DBs
let tags = JSON.parse(fs.readFileSync('./database/tags.json'));
let tasks = JSON.parse(fs.readFileSync('./database/tasks.json'));
let users = JSON.parse(fs.readFileSync('./database/users.json'));

// =======================
// API Functions
// =======================

exports.authTagsMiddleware = (req, res, next) => {
    try {
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
        return res.status(400).send(err.message);
    }
}

// POST Method to create tag
exports.registerTag = (req, res) => {
    try {
        // Get body params
        let name = req.body.name;
        let color = req.body.color;

        if (!name || !color) return res.status(400).send('Tag MUST have both name and color');

        // Create new Tag
        let new_tag = new Tag(name, color, req.user.id);

        // Send req
        tags.push(new_tag.toObj());
        fs.writeFileSync('./database/tags.json', JSON.stringify(tags, null, 2));
        res.send('Tag Created');
    } catch(err) {
        return res.status(400).send(err.message);
    }
}

// GET Method to Search ALL tags
exports.userTags = (req, res) => {
    try {
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
        return res.status(400).send(err.message);
    }
}

// GET Method to Search a Tag based on ID
exports.searchTagbyID = (req, res) => {
    try {
        // Search for a tag based on ID
        let found_tag = tags.find(i => String(i.id_user) === String(req.user.id) && String(i.id) === req.params.id);
        
        // If no tag was found
        if (!found_tag) return res.status(404).send('Tag not Found');
    
        // Return response
        res.json(found_tag);
    } catch(err) {
        return res.status(400).send(err.message);
    }
}

// PATCH Method to Update a Tag by ID
exports.patchTag = (req, res) => {
    try {
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
        let updated_tags = [...tags];
        updated_tags[index] = updated_tag;
    
        fs.writeFileSync('./database/tags.json', JSON.stringify(updated_tags, null, 2));
        tags = updated_tags;

        res.json ({
            message: "Tag updated successfully!",
            tag: updated_tag
        });
    } catch(err) {
        return res.status(400).send(err.message);
    }
}

// DELETE method
exports.deleteTag = (req, res) => {
    try {
        // Get tag index
        let index = tags.findIndex(i => String(i.id) === req.params.id && String(i.id_user) === String(req.user.id));

        // If no index found
        if (index === -1) return res.status(404).send('Tag not Found');

        // If task was found
        let tag_id = tags[index].id;

        // Check if tag is used by any task
        let tag_used = tasks.some(i => Array.isArray(i.tags) && i.tags.some(j => j === tag_id)); 
        if (tag_used) return res.status(400).send('Tag is in use by a task and CANNOT be deleted');

        // If task isn't being used
        let deleted_tag = tags[index];
        let new_tags = tags.filter(i => String(i.id) !== String(tag_id));

        // Write new file
        fs.writeFileSync('./database/tags.json', JSON.stringify(new_tags, null, 2));
        tags = new_tags;

        // Send response
        res.json({
            message: `Tag with ID ${req.params.id} was successfully deleted`,
            tag: deleted_tag
        });
    } catch(err) {
        return res.status(400).send(err.message);
    }
}

// =======================
// Functions
// =======================

function createTag(name, color) {
    let obj = new Tag(name, color);
    data.tags.push(obj);
}

function getTagById(id) {
    let tag = data.tags.find(tag => tag.id == id);
    return tag || "404 - Tag not found.";
}

function searchTags(attribute, value) {
    if (!Tag.prototype.hasOwnProperty(attribute)) {
        throw new TagException(`Attribute ${attribute} does NOT exist.`)
    }

    return data.tags.filter(tag => {
        // Return filtered value
        return String(tag[attribute]).includes(String(value))
    });
}

function getAllTags() {
    return data.tags;
}

function updateTag(id, obj_new_info) {
    let updated = false;
    // Search Tag
    let tag = data.tags.find(tag => tag.id == id);

    // Check if tag exists
    if (!tag) {
        throw new TagException(`Tag with ID ${id} does NOT exist.`);
    }

    // Iterate through attributes until we find the correct one
    for (let attr in obj_new_info) {
        // Check if attribute exists and is not id
        if (Tag.prototype.hasOwnProperty(attr) && attr != "id") {
            tag[attr] = obj_new_info[attr];
            updated = true;
        }
    }

    // Exception if there was no update
    if (!updated) {
        throw new TagException("Invalid attribute.");
    }

    return updated;
}

function oldDeleteTag(id) {
    let index = data.tags.findIndex(tag => tag.id == id);

    if (index == -1) {
        throw new TagException(`User with ID ${id} does NOT exist.`);
    }
    // Check all tasks on data
    for (let i = 0; i < data.tasks.length; i++) {
        // Check every tag in a task
        for (let j = 0; j < data.tasks[i].tags.length; j++) {
            // Check if tag is assigned
            if (data.tasks[i].tags[j] == id) {
                throw new TagException(`Tag with ID ${id} CANNOT be deleted because it is assigned to Task with ID ${data.tasks[i].id}.`);
            }
        }
    }

    // Delete record
    data.tags.splice(index, 1)

    return `Tag with ID ${id} was deleted successfully.`;
}