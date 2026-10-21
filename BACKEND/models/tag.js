// =======================
// API stuff
// =======================

const fs = require('fs');

// Read database files
let tags_data = JSON.parse(fs.readFileSync('./database/tags.json'))
let users_data = JSON.parse(fs.readFileSync('./database/users.json'))


function getNextTagID() {
    return tags_data.length + 1;
}

// =======================
// Model
// =======================

class TagException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}

class Tag {

    // ====================
    // Attributes
    // ====================
    #id;
    #name;
    #color;
    #id_user;

    // ====================
    // Constructor
    // ====================
    constructor(name, color, id_user) {
        this.#id = getNextTagID();                 // Auto-generated & unmodifiable                     
        this.name = name;
        this.color = color;   
        this.id_user = id_user;
    }

    // ====================
    // Setters
    // ====================
    set id(value) {
        throw new TagException("IDs are auto-generated.")
    }

    // NOT empty
    set name(name) {
        if (!name || name.trim() === "") {
            throw new TagException("Name CANNOT be empty.")
        }

        this.#name = name;
    }

    // NOT empty & hexadecimal
    set color(color) {
        if (!color || color.trim() === "") {
            throw new TagException("Color CANNOT be empty.")
        }

        // Check if RGB is correct using regex
        let hex = /^#[0-9a-fA-F]{6}$/;
        if (!hex.test(color)) {
            throw new TagException("Color must be hexadecimal.")
        }

        this.#color = color;
    }

    // NOT empty
    set id_user(id_user) {
        if (!id_user) {
            throw new TagException("User ID CANNOT be empty.")
        }

        // Check if ID exists
        if (users_data.filter(i => i["id"] === id_user).length === 0) {
            throw new TagException("User ID does NOT exist");
        }

        this.#id_user = id_user;
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

    get color() {
        return this.#color;
    }

    get id_user() {
        return this.#id_user;
    }

    // ====================
    // To Object
    // ====================

    toObj() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            id_user: this.id_user,
        };
    }
}

module.exports = Tag;