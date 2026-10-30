// Imports
const express = require('express');
const path = require('path');
const router = require('./routes/api.js');

// Constants
const app = express();
const port = 3000;

// Root directory
app.get('/', (req, res) => {
    res.redirect('/views/login.html');
});

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static('FRONTEND'));

// Add loading of static elements
app.use('/controllers', express.static('../FRONTEND/controllers'));
app.use('/views', express.static('../FRONTEND/views'));
app.use('/assets', express.static('../FRONTEND/assets'));

// API routes
app.use(router);

// Initialize server
app.listen(port, () => {
    console.log(`Practice 4 running at port: ${port}`);
});
