// =======================
// API stuff
// =======================

const fs = require('fs');

// Read database files
let tasks_data = JSON.parse(fs.readFileSync('./database/tasks.json'))
let users_data = JSON.parse(fs.readFileSync('./database/users.json'))
let tags_data = JSON.parse(fs.readFileSync('./database/tags.json'))

function getNextTaskID() {
    return tasks_data.length + 1;
}

// =======================
// Model
// =======================

class TaskException {
    constructor(errorMessage) {
        this.errorMessage = errorMessage;
    }
}

class Task {
    
    // ====================
    // Attributes
    // ====================
    #id;
    #title;
    #description;
    #due_date;
    #id_user;
    #status;
    #tags;

    // ====================
    // Constructor
    // ====================
    constructor(title, description, due_date, id_user, status, tags = []) {
        this.title = title;
        this.description = description;
        this.due_date = due_date;
        this.id_user = id_user;
        this.status = status;
        this.tags = tags;
        this.#id = getNextTaskID();
    }

    // Setters
    set id(value) {
        throw new TaskException("IDs are auto-generated.")
    }

    set title(title) {
        if (!title || title.trim() === "") {
            throw new TaskException("Title CANNOT be empty.")
        }

        this.#title = title;
    }

    set description(description) {
        this.#description = description;    
    }

    set due_date(due_date) {
        if (isNaN(new Date(due_date).getTime())) {
            throw new TaskException("Due Date is NOT valid (must be yyyy/mm/dd).")
        }

        this.#due_date = due_date;
    }

    set id_user(id_user) {
        if (id_user.length === 0)
        {
            throw new TaskException("User CANNOT be empty.");
        }

        // Check if user exists
        if (users_data.filter(i => i['id'] === id_user).length === 0) {
            throw new TaskException(`User with ID ${id_user} does NOT exist.`);
        }

        this.#id_user = id_user;
    }

    set status(status) {
        // Ensure valid values are entered
        if (!["A", "F", "C"].includes(status)) {
            throw new TaskException("Status MUST be either A/F/C");
        }

        this.#status = status;
    }

    set tags(tags) {
        // Convert empty values to an array
        if (tags == "" || tags == null) {
            tags = [];
        }

        // Check that tag is an array
        if (!Array.isArray(tags)) {
            throw new TaskException("Tags MUST be an array.");
        }

        // Check that tag exists
        for (let i = 0; i < tags.length; i++) {
            // Match a tag with the id
            let tagExists = tags_data.some(tag => tag.id == tags[i]);

            // Case: Tag doesn't exist
            if (!tagExists) {
                throw new TaskException(`Tag with ID ${tags[i]} does NOT exist.`);
            }
        }

        this.#tags = tags;
    }

    // ====================
    // Getters
    // ====================

    get id() {
        return this.#id;
    }

    get title() {
        return this.#title;
    }

    get description() {
        return this.#description;
    }

    get due_date() {
        return this.#due_date;
    }

    get id_user() {
        return this.#id_user;
    }

    get status() {
        return this.#status;
    }

    get tags() {
        return this.#tags;
    }

    // ====================
    // To Object
    // ====================

    toObj() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            due_date: this.due_date,
            id_user: this.id_user,
            status: this.status,
            tags: this.tags
        };
    }
}

module.exports = Task;