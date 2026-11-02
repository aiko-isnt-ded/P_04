// =======================
// API Imports
// =======================

// Import Library
const fs = require('fs');
const path = require('path');
// Import Task Model
const Task = require('../models/task');

// =======================
// DBs
// =======================

const TASKS_PATH = path.join(__dirname, '../database/tasks.json');
const USERS_PATH = path.join(__dirname, '../database/users.json');

// Read functions
function readTasks() {
    return JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
}

function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

// Write functions
function writeTasks(tasks) {
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

// =======================
// API Functions
// =======================

exports.authTasksMiddleware = (req, res, next) => {
    try {
        // Read users
        let users = readUsers();

        // Check whether a password was entered
        let pwd = req.get('x-auth');
        if (!pwd) return res.status(401).send('Password is missing');

        // Task Authentification depends on User Existence
        let id_user = req.body.id_user;
        if (!id_user) return res.status(400).send('User ID is required');

        // Find user
        let user = users.find(i => String(i.id) === String(id_user));
        if (!user) return res.status(404).send('User Not Found');

        // Check whether password is valid
        if (user.password !== pwd) return res.status(401).send('Wrong password');

        // If everything's well
        req.user = user;
        next()
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

exports.authTasksMiddleware2 = (req, res, next) => {
    try {
        // Read users
        let users = readUsers();

        // Check whether a password was entered
        let pwd = req.get('x-auth');
        if (!pwd) return res.status(401).send("Password is missing");

        // Find users based on password
        let found_user = users.find(i => String(i.password) === pwd);
        if (!found_user) return res.status(404).send("User not Found");

        req.user = found_user;
        next();
    } catch (err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// POST Method to Create Task
exports.registerTask = (req, res) => {
    try {
        // Read data
        let tasks = readTasks();

        // Get fields from JSON request
        let title = req.body.title;
        let description = req.body.description;
        let due_date = req.body.due_date;
        let status = req.body.status;
        let tags = req.body.tags;

        // Validate Fields
        if (!title) return res.status(400).send("Task must have a title");
        if (tags !== undefined && !Array.isArray(tags)) return res.status(400).send("Tags must be an array");

        // Populate fields if everything went well
        let new_description = description || "";
        let new_due_date = due_date ? new Date(due_date) : new Date();
        let new_status = status || 'A';
        let new_tags = tags || [];

        // Create new task
        let new_task = new Task(title, new_description, new_due_date, req.user.id, new_status, new_tags);
        let task_obj = new_task.toObj();

        // Save to file
        tasks.push(task_obj);
        writeTasks(tasks);

        return res.status(201).json({
            message: 'Task created successfully!',
            task: task_obj
        });
    } catch (err) {
        res.status(400).send(err.errorMessage || err.message);
    }
}

// GET Method to Search ALL tasks of a user
exports.userTasks = (req, res) => {
    try {
        // Read
        let tasks = readTasks();

        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        // Get user tasks
        let user_tasks = tasks.filter(i => String(i.id_user) === String(req.user.id));
        
        // Filter: Status
        if (req.query.status) {
            user_tasks = user_tasks.filter(i => i.status === req.query.status);
        }

        // Filter: Date
        if (req.query.due_date) {
            user_tasks = user_tasks.filter(i => String(i.due_date).slice(0, 10) === req.query.due_date);
        }

        // Filter: Tag
        if (req.query.tag) {
            user_tasks = user_tasks.filter(i => Array.isArray(i.tags) && i.tags.some(t => String(t) === req.query.tag));
        }

        let start = (page - 1) * limit;
        let end = start + limit;

        // Send response
        res.json({
            page: page,
            next_page: page + 1,
            limit: limit,
            total: user_tasks.length,
            data: user_tasks.slice(start, end)
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// GET Method to Search a Task based on ID
exports.searchTaskbyID = (req, res) => {
    try {
        // Read
        let tasks = readTasks();

        // Search for a task based on ID
        let found_task = tasks.find(i => String(i.id_user) === String(req.user.id) && String(i.id) === req.params.id);
        
        // If no task was found
        if (!found_task) return res.status(404).send('Task not Found');
    
        // Return response
        res.json(found_task);
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// PATCH Method to Update a Task by ID
exports.patchTask = (req, res) => {
    try {
        // Read
        let tasks = readTasks();

        // Get body of the request
        let body = req.body;

        // Updatable fields
        let fields = ['title', 'description', 'due_date', 'status', 'tags'];
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

        // Find the task
        let index = tasks.findIndex(i => String(i.id) === req.params.id && String(i.id_user) === String(req.user.id));
        if (index === -1) {
            return res.status(404).send("Task not Found");
        }

        // Create updated task
        let data = {...tasks[index], ...changes};
        let new_task = new Task(data.title, data.description, data.due_date, data.id_user, data.status, data.tags);
        let updated_task = {...new_task.toObj(), id: tasks[index].id};

        // Update the task
        let updated_tasks = [...tasks];
        updated_tasks[index] = updated_task;
    
        writeTasks(updated_tasks);

        res.json ({
            message: "Task updated successfully!",
            task: updated_task
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// DELETE method
exports.deleteTask = (req, res) => {
    try {
        // Read
        let tasks = readTasks();
        
        // Get task index
        let index = tasks.findIndex(i => String(i.id) === req.params.id && String(i.id_user) === String(req.user.id));

        // If no index found
        if (index === -1) return res.status(404).send('Task not Found');

        // If task was found
        let deleted_task = {...tasks[index]};
        let new_tasks = tasks.filter(i => String(i.id) !== req.params.id);

        // Write new file
        writeTasks(new_tasks);

        // Send response
        res.json({
            message: `Task with ID ${req.params.id} was successfully deleted`,
            task: deleted_task
        });
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}