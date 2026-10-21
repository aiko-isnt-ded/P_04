// Imports
const express = require('express');
const router = require('./routes/api.js');

// Constants
const app = express();
const port = 3000;

// Middlewares
app.use(express.json());
app.use(router);

// Initialize server
app.listen(port, () => {
    console.log(`Practice 3 running at port: ${port}`);
});