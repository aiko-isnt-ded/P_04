// =======================
// API stuff
// =======================

const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '../database/users.json');

// Function to read user data
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function getNextUserID() {
    let max = 0;
    for (const i of readUsers()) {
        if (Number(i.id > max)) max = Number(i.id);
    }
    return max + 1;
}

// =======================
// Model
// =======================

class UserException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}

class User {

    // ====================
    // Attributes
    // ====================
    #id;
    #name;
    #email;
    #password;
    #joined_at;

    // ====================
    // Constructor
    // ====================
    constructor(name, email, password) {
        this.name = name;
        this.email = email;                        
        this.password = password;
        this.#joined_at = new Date();               // Auto-generated & unmodifiable
        this.#id = getNextUserID();                 // Auto-generated & unmodifiable
    }

    // ====================
    // Setters
    // ====================
    set id(value) {
        throw new UserException("IDs are auto-generated.")
    }

    // NOT empty
    set name(name) {
        if (!name || name.trim() === "") {
            throw new UserException("Name CANNOT be empty.")
        }

        this.#name = name;
    }

    set email(email) {
        if (!email || email.trim() === "") {
            throw new UserException("Email CANNOT be empty.")
        }

        // Check if email is unique
        if (readUsers().some(user => user.email == email && user.id != this.#id)) {
            throw new UserException("Email is already in use.")
        }

        this.#email = email;
    }

    set password(password) {
        if(!password || password.trim() === "") {
            throw new UserException("Password CANNOT be empty.")
        }
        if(password.length < 8) {
            throw new UserException("Password must have a minimum of 8 characters.")
        }
        // Check if password is unique
        if (readUsers().some(user => user.password == password && user.id != this.#id)) {
            throw new UserException("Password has to be unique.")
        }

        this.#password = password;
    }

    set joined_at(value) {
        throw new UserException("Join Date is auto-generated.")
    }

    // ====================
    // Getters
    // ====================

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    get email() {
        return this.#email;
    }

    get password() {
        return this.#password;
    }

    get joined_at() {
        return this.#joined_at;
    }

    // ====================
    // To Object
    // ====================

    toObj() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            password: this.password,
            joined_at: this.joined_at
        };
    }
}

module.exports = User;