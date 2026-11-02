// =======================
// API Imports
// =======================

// Import Libraries
const fs = require('fs');
const path = require('path');
// Import User Model
const User = require('../models/user');

// =======================
// DBs
// =======================

const USERS_PATH = path.join(__dirname, '../database/users.json');
const TASKS_PATH = path.join(__dirname, '../database/tasks.json');
const TAGS_PATH = path.join(__dirname, '../database/tags.json');

function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// =======================
// Login
// =======================

exports.login = (req, res) => {
    // Reload users
    const users = readUsers();
    
    let data = req.body,
        user = users.find(user => (user.email == data.email && user.password == data.password));

    if (user) res.send(user);
    else res.sendStatus(401);
}

// =======================
// API Functions
// =======================

exports.authUsersMiddleware = (req, res, next) => {
    try {
        // Reload users
        const users = readUsers();

        // Check whether a password was entered
        let pwd = req.get('x-auth');
        if (!pwd) return res.status(401).send('Password is missing');

        // Find a user
        let res_user = users.find(i => String(i.id) === req.params.id);
        if (!res_user) return res.status(404).send('User Not Found');

        // Check whether password is valid
        if (res_user.password !== pwd) return res.status(401).send('Wrong password');

        // If everything's well
        req.user = res_user;
        next()
    } catch(err) {
        return res.status(400).send(err.errorMessage || err.message);
    }
}

// POST Method to Register User
exports.registerUser = (req, res) => {
    try {
        // Reload users
        const users = readUsers();

        // Check that both passwords match
        if (req.body.password != req.body.confirm_password) return res.status(400).send('Password Mismatch');
        
        // If password is correct
        let new_user = new User(req.body.name, req.body.email, req.body.password);
        // Create new user
        users.push(new_user.toObj());
        // Write in database
        writeUsers(users);
        res.status(201).json(new_user.toObj());
    } catch (err) {
        res.status(400).send(err.errorMessage || err.message);
    }
}

// GET all users
exports.usersPage = (req, res) => {
    try {
        // Reload users
        const users = readUsers();

        // Check whether user has valid permits
        if (req.get('x-auth') !== 'admin_auth') res.status(401).send("Wrong Admin Credentials");
        // If user has valid permits
        else {
            let page = parseInt(req.query.page) || 1;
            let limit = parseInt(req.query.limit) || 10;

            let start = (page - 1) * limit;
            let end = start + limit;
            let res_users = users.slice(start, end);

            // Send response to user
            res.json({
                page: page,
                next_page: page + 1,
                limit: limit, 
                total: users.length,
                data: res_users
            })
        }
    } catch (err) {
        res.status(400).send(err.errorMessage || err.message);
    }
}

// GET user based on ID
exports.getUserFromID = (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        res.status(400).send(err.errorMessage || err.message);
    }
}

// PATCH user based on ID
exports.patchUser = (req, res) => {
    try {
        // Reload users
        const users = readUsers();

        // Get body of the request
        let body = req.body;

        // Updatable fields
        let fields = ['name', 'email', 'password'];
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
        // Error message: Empty username
        if ('name' in changes && String(changes.name).trim() === '') {
            return res.status(400).send('Name CANNOT be empty.');
        }
        // Error message: Empty email
        if ('email' in changes && String(changes.email).trim() === '') {
            return res.status(400).send('Email CANNOT be empty.');
        }
        // Error message: Password
        if ('password' in changes) {
            let pwd = String(changes.password);
            if (pwd.trim() === '') return res.status(400).send('Password CANNOT be empty.');
            if (pwd.length < 8) return res.status(400).send('Password must have a minimum of 8 characters.');
            // Password must be unique
            if (users.some(i => String(i.password) === pwd && String(i.id) !== req.params.id)) {
                return res.status(400).send('Password has to be unique.');
            }
        }
        // Error message: email is already in use
        if (changes.email && users.some(i => String(i.email) === changes.email && String(i.id) !== req.params.id)) {
            return res.status(403).send("Email already in use");
        }

        // Find the user 
        let index = users.findIndex(i => String(i.id) === req.params.id);
        if (index === -1) return res.status(404).send('User Not Found');
        
        // Update user
        let new_user = { ...users[index], ...changes };
        users[index] = new_user;
        writeUsers(users);

        res.json ({
            message: "User updated successfully!",
            user: new_user
        });
    } catch (err) {
        console.error('Update error: ', err);
        res.status(400).send(err.errorMessage || err.message);
    }
}

// DELETE User based on ID
exports.deleteUser = (req, res) => {
    try {
        // Reload users
        const users = readUsers();

        let index = users.findIndex(i => String(i.id) === req.params.id);
        if (index === -1) return res.status(404).send('User Not Found');

        let deleted_user = users[index];
        let users_updated = users.filter(i => String(i.id) !== req.params.id);

        // Update users
        writeUsers(users_updated)

        // Remove all data related to the user
        let tasks = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
        fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks.filter(i => String(i.id_user) !== req.params.id), null, 2));
        let tags = JSON.parse(fs.readFileSync(TAGS_PATH, 'utf8'));
        fs.writeFileSync(TAGS_PATH, JSON.stringify(tags.filter(i => String(i.id_user) !== req.params.id), null, 2));

        // Response
        res.json ({
            message: `User with ID ${req.params.id} deleted`,
            user: deleted_user
        });
    } catch (err) {
        res.status(400).send(err.errorMessage || err.message);
    }
}