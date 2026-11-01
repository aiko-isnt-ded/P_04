// =======================
// Tasks Functions
// =======================
const TASKS_URL = LOCAL_URL + 'tasks';

// Fill tags
function fillTagSelect() {
    // Find select HTML
    let select = document.getElementById('newTaskLabel');

    // Find active user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!select || !user) return;

    // Get every tag
    fetch(LOCAL_URL + 'tags?page=1&limit=200', {
        method: 'GET',
        headers: {
            'x-auth': user.password
        }
    }).then(async response => {
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Error loading labels: ' + response.status);
        }
        return response.json();
    }).then(data => {
        // Clear old options
        select.replaceChildren();

        // First option: No label
        let none_option = document.createElement('option');
        none_option.value = '';
        none_option.innerText = 'No Label';
        select.append(none_option);

        // Allow one tag selection
        for (let i = 0; i < data.data.length; i++) {
            let tag = data.data[i],
                option = document.createElement('option');
            option.value = tag.id;
            option.innerText = tag.name;
            select.append(option);
        }
    }).catch(err => {
        alert(err.message);
    });
}

// Create task
function createTask() {
    event.preventDefault();

    // Get logged user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Get inputs
    let nameInput = document.getElementById('newTaskName');
    let dateInput = document.getElementById('newTaskDate');
    let labelSelect = document.getElementById('newTaskLabel');

    // Validate fields
    if (!nameInput.reportValidity()) return;
    if (!dateInput.reportValidity()) return;

    // Only one tag per task, or empty tag
    let tags = labelSelect.value === '' ? [] : [Number(labelSelect.value)];

    // Call the post method
    fetch(TASKS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify({
            id_user: user.id,
            title: nameInput.value.trim(),
            due_date: dateInput.value,
            tags: tags
        })
    }).then(async response => {
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Task creation failed: ' + response.status);
        }
        return response.json();
    }).then(data => {
        // Reset modal inputs
        nameInput.value = '';
        dateInput.value = '';

        // Close modal
        let modal = document.getElementById('newTask');
        let b_modal = bootstrap.Modal.getInstance(modal);
        if (b_modal) b_modal.hide();

        // Send alert and refresh page state
        alert(data.message);
        init();
    }).catch(err => {
        alert(err.message);
    });
}

// =======================
// Read Functions
// =======================

const STATUS_ACTIVE = 'A';
const STATUS_FINISHED = 'F';
const STATUS_CANCELLED = 'C';

// Get today date
function todayString() {
    let d = new Date();
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + month + '-' + day;
}

// Read tasks, implementing all filters (status, today date, and tags)
function readTasks(filters = {}) {
    // Get current user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Get ALL tasks
    let params = new URLSearchParams({page: 1, limit: 200, ...filters});

    // Call post method
    return fetch(TASKS_URL + "?" + params.toString(), {
        method: 'GET',
        headers: {
            'x-auth': user.password
        }
    }).then(async response => {
        // Error occured
        if(!response.ok){
            let msg = await response.text();
            throw new Error(msg || 'Error loading tasks: ' + response.status);
        }
        return response.json();
    });
}

// Function to bold text and stuff
function boldText(text) {
    let b = document.createElement('b');
    b.innerText = text;
    return b;
}

// User Summary Widget
function userSummary() {
    // Get DOM elements
    let nameElem = document.getElementById('userNameWidget');
    let completedElem = document.getElementById('completedTodayWidget');
    let pendingElem = document.getElementById('pendingTodayWidget');
    let summaryElem = document.getElementById('summaryTextWidget');
    if (!completedElem || !pendingElem || !summaryElem) return;

    // Get logged user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Filter tasks
    let today = todayString();
    Promise.all([
        readTasks({due_date: today, status: STATUS_FINISHED}),
        readTasks({due_date: today, status: STATUS_ACTIVE}),
    ]).then(([done_res, pending_res]) => {
        // Data
        let done = done_res.total;
        let pending = pending_res.total;
        let all = done + pending;

        // Update HTML elements
        if (nameElem) nameElem.innerText = user.name;
        completedElem.innerText = done;
        pendingElem.innerText = pending;

        // Create Summary Text
        if (all === 0) {
            summaryElem.replaceChildren(user.name + ' has no tasks scheduled for today.');
        }
        else {
            let percent = Math.round((done / all) * 1000) / 10;
            summaryElem.replaceChildren(
                user.name + ' is a user who has completed ', boldText(done),
                ' tasks today. They still have ', boldText(pending),
                ' pending tasks, so they have ', boldText(percent + '%'),
                ' of their work done today.'
            );
        }
    }).catch(err => {
        alert(err.message)
    });
}

// =======================
// Today Task's Widget
// =======================

const TASKS_PER_PAGE = 3;
let todayPage = 1;

// Get every tag of the user
function readTags() {
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return Promise.reject(new Error('No user logged in'));

    // Call get method
    return fetch(LOCAL_URL + 'tags?page=1&limit=200', {
        method: 'GET',
        headers: {
            'x-auth': user.password
        }
    }).then(async response => {
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Error loading labels: ' + response.status);
        }
        return response.json();
    });
}

// Formatting date
function formatDate(iso) {
    let parts = String(iso).slice(0, 10).split('-');
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}

// Changing color of the label text depending on the background color
function textColorFor(hex) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
}

// Enabling checkbox to mark tasks as finished
function completeTask(task) {
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Call update method
    fetch(TASKS_URL + '/' + task.id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify({
            status: STATUS_FINISHED
        })
    }).then(async response => {
        // Error occurred
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Task update failed: ' + response.status);
        }
        return response.json();
    }).then(data => {
        init();
    }).catch(err => {
        alert(err.message);
        init();
    });
}

// Build the pagination
function buildTodayPagination(page, total_pages) {
    let nav = document.getElementById('todayTasksPagination');
    let pages = document.getElementById('todayTasksNavPages');

    // Clear old buttons
    pages.replaceChildren();

    // In case there's only 1 page
    if (total_pages <= 1) {
        nav.classList.add('d-none');
        return;
    }
    nav.classList.remove('d-none');

    // Add pagination buttons
    function addButton(label, target, disabled, active) {
        let li = document.createElement('li'),
            btn = document.createElement('button');
        li.classList.add('page-item');
        if (disabled) li.classList.add('disabled');
        if (active) li.classList.add('active');
        btn.type = 'button';
        btn.classList.add('page-link');
        btn.innerText = label;
        btn.addEventListener('click', () => { todayTasksWidget(target); });
        li.append(btn);
        pages.append(li);
    }

    addButton('«', page - 1, page === 1, false);
    for (let i = 1; i <= total_pages; i++) {
        addButton(String(i), i, false, i === page);
    }
    addButton('»', page + 1, page === total_pages, false);
}

// Build the widget
function todayTasksWidget(page) {
    // Only run on the page that has the widget (tasks.html doesn't)
    let table = document.getElementById('todayTasksTable');
    let div = document.getElementById('todayTasks');
    let empty = document.getElementById('emptyTodayTasksTable');
    if (!table || !div || !empty) return;

    // Get logged user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // No page given
    if (!page) page = todayPage;
    todayPage = page;

    // Filter call based on page (and tags
    Promise.all([
        readTasks({due_date: todayString(), status: STATUS_ACTIVE, page: page, limit:TASKS_PER_PAGE}),
        readTags()
    ]).then(([tasks_res, tags_res]) => {
        let total_pages = Math.ceil(tasks_res.total / tasks_res.limit);

        // Ensure pages are valid
        if (total_pages > 0 && page > total_pages) {
            todayTasksWidget(total_pages);
            return;
        }

        // Pagination
        buildTodayPagination(page, total_pages);

        // Clear old rows
        table.replaceChildren();

        // In case there are no tasks, show text
        if (tasks_res.total === 0) {
            div.classList.add('d-none');
            empty.classList.remove('d-none');
            return;
        }
        div.classList.remove('d-none');
        empty.classList.add('d-none');

        // Build rows in table
        for (let i = 0; i < tasks_res.data.length; i++) {
            let task = tasks_res.data[i],
                row = document.createElement('tr'),
                check_cell = document.createElement('td'),
                title_cell = document.createElement('td'),
                tag_cell = document.createElement('td'),
                date_cell = document.createElement('td'),
                checkbox = document.createElement('input'),
                badge = document.createElement('span');

            // Activate checkboxes
            checkbox.type = 'checkbox';
            checkbox.classList.add('form-check-input');
            checkbox.addEventListener('change', () => {completeTask(task);});
            check_cell.append(checkbox);

            // Title and date
            title_cell.innerText = task.title;
            date_cell.innerText = formatDate(task.due_date);

            // Ensure tag is correct
            let tag = tags_res.data.find(t => String(t.id) === String(task.tags[0]));
            badge.classList.add('badge', 'rounded-pill');
            if (tag) {
                badge.innerText = tag.name;
                badge.style.backgroundColor = tag.color;
                badge.style.color = textColorFor(tag.color);
            } else {
                badge.classList.add('bg-secondary');
                badge.innerText = 'No Label';
            }
            tag_cell.append(badge);

            // Merge rows
            row.append(check_cell, title_cell, tag_cell, date_cell);
            table.append(row);
        }
    }).catch(err => {
        alert(err.message);
    });
}


// =======================
// Execute Functions
// =======================

// Search for forms and buttons
const newTaskModal = document.getElementById('newTask');
const bttnCreateTask = document.getElementById('bttn_create_task');

// Route functions based on actions
if (newTaskModal) {
    newTaskModal.addEventListener('show.bs.modal', fillTagSelect);
}

if (bttnCreateTask) {
    bttnCreateTask.addEventListener('click', createTask);
}