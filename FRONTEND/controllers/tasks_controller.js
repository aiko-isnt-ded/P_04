// =======================
// Tasks Functions
// =======================
const TASKS_URL = LOCAL_URL + 'tasks';

// Load the user tags and no tags
function loadTagOptions(select, selectedId = '') {
    return readTags().then(tags_res => {
        // Clear old options
        select.replaceChildren();

        // First option: No label
        let none_option = document.createElement('option');
        none_option.value = '';
        none_option.innerText = 'No Label';
        select.append(none_option);

        // Allow one tag selection
        for (let i = 0; i < tags_res.data.length; i++) {
            let tag = tags_res.data[i],
                option = document.createElement('option');
            option.value = tag.id;
            option.innerText = tag.name;
            select.append(option);
        }

        // Select the current label
        select.value = (selectedId === undefined || selectedId === null ? '' : String(selectedId));
    });
}

// Fill the label of the new task modal
function fillTagSelect() {
    let select = document.getElementById('newTaskLabel');
    if (!select || !getUser()) return;

    loadTagOptions(select).catch(err => {
        alert(err.message);
    });
}

// Default values when creating tasks
function prepareNewTask() {
    document.getElementById('newTaskDate').value = todayString();
    fillTagSelect();
}

// Create task
function createTask() {
    event.preventDefault();

    // Get logged user
    let user = getUser();
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

        // Refresh page 
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

// Get active user
function getUser() {
    return JSON.parse(sessionStorage.getItem('user'));
}

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
    let user = getUser();
    if (!user) return Promise.reject(new Error('No user logged in'));

    // Get all tasks, which will later be filtered 
    let params = new URLSearchParams({page: 1, limit: 200, ...filters});

    // Call get method
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
    let user = getUser();
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
// Pagination
// =======================

const TASKS_PER_PAGE = 3;
const ALL_TASKS_PER_PAGE = 10;

const widgetState = {
    todayPage: 1,
    labelPage: 1,
    completedPage: 1,
    selectedTagId: null,
    tasksPage: 1,
    tasksTagId: null
};

// Build the pagination
function buildPagination(nav, pages, page, total_pages, widget) {
    // Clear old buttons
    pages.replaceChildren();

    // Show no pagination in case there's only 1 page
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
        btn.addEventListener('click', () => {widget(target);});
        li.append(btn);
        pages.append(li);
    }

    addButton('«', page - 1, page === 1, false);
    for (let i = 1; i <= total_pages; i++) {
        addButton(String(i), i, false, i === page);
    }
    addButton('»', page + 1, page === total_pages, false);
}

// Build a row for a task
function buildTaskRow(task, tags, withActions = false) {
    let row = document.createElement('tr'),
        check_cell = document.createElement('td'),
        title_cell = document.createElement('td'),
        tag_cell = document.createElement('td'),
        date_cell = document.createElement('td'),
        checkbox = document.createElement('input'),
        badge = document.createElement('span');

    // Activate checkboxes based on status
    let finished = task.status === STATUS_FINISHED;
    checkbox.type = 'checkbox';
    checkbox.classList.add('form-check-input');
    checkbox.checked = finished;
    checkbox.addEventListener('change', () => {
        updateTask(task, {status: finished ? STATUS_ACTIVE : STATUS_FINISHED});
    });
    check_cell.append(checkbox);

    // Title and date
    title_cell.innerText = task.title;
    if (finished) title_cell.classList.add('text-decoration-line-through');
    date_cell.innerText = formatDate(task.due_date);

    // Ensure tag is correct
    let tag = tags.find(t => String(t.id) === String(task.tags[0]));
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

    // Merge and return the row (task)
    row.append(check_cell, title_cell, tag_cell, date_cell);
    
    // Actions column (edit, delete)
    if (withActions) {
        let actions_cell = document.createElement('td'),
            actions_div = document.createElement('div'),
            edit_btn = document.createElement('span'),
            edit_icon = document.createElement('i'),
            delete_btn = document.createElement('span'),
            delete_icon = document.createElement('i');

        actions_div.classList.add('d-flex', 'justify-content-evenly');

        // Edit Icon
        edit_icon.classList.add('fas', 'fa-pen');
        edit_icon.style.fontSize = '20px';
        edit_icon.style.color = 'blue';
        edit_btn.style.cursor = 'pointer';
        edit_btn.addEventListener('click', () => { editTaskModal(task); });

        // Delete Icon
        delete_icon.classList.add('fas', 'fa-trash');
        delete_icon.style.fontSize = '20px';
        delete_icon.style.color = 'red';
        delete_btn.style.cursor = 'pointer';
        delete_btn.addEventListener('click', () => { deleteTaskModal(task); });

        // Add buttons
        edit_btn.append(edit_icon);
        delete_btn.append(delete_icon);
        actions_div.append(edit_btn, delete_btn);
        actions_cell.append(actions_div);
        row.append(actions_cell);
    }
    
    return row;
}

// =======================
// Shared Widget Functions
// =======================

// Get every tag of the user
function readTags() {
    let user = getUser();
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

function buildLabelPills(filter, tags, selectedId, onSelect) {
    filter.replaceChildren();
    for (let i = 0; i < tags.length; i++) {
        let tag = tags[i],
            pill = document.createElement('span');
        pill.classList.add('badge', 'rounded-pill', 'label-pill');
        if (String(tag.id) === String(selectedId)) pill.classList.add('selected');
        pill.innerText = tag.name;
        pill.style.backgroundColor = tag.color;
        pill.style.color = textColorFor(tag.color);
        pill.addEventListener('click', () => { onSelect(tag); });
        filter.append(pill);
    }
}

// =======================
// Today Task's Widget
// =======================

// Build the widget
function todayTasksWidget(page = widgetState.todayPage) {
    // Only run on the page that has the widget (tasks.html doesn't)
    let table = document.getElementById('todayTasksTable');
    let div = document.getElementById('todayTasks');
    let empty = document.getElementById('emptyTodayTasksTable');
    let nav = document.getElementById('todayTasksPagination');
    let pages = document.getElementById('todayTasksNavPages');
    if (!table || !div || !empty || !nav || !pages) return;

    // Get logged user
    let user = getUser();
    if (!user) return;

    // Get current page
    widgetState.todayPage = page;

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
        buildPagination(
            nav, pages, page, total_pages, todayTasksWidget
        );

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

        // Build today tasks table
        for (let i = 0; i < tasks_res.data.length; i++) {
            table.append(buildTaskRow(tasks_res.data[i], tags_res.data));
        }
    }).catch(err => {
        alert(err.message);
    });
}

// =======================
// Pending Tasks by Label
// =======================

function labelTasksWidget(page = widgetState.labelPage) {
    // Only run on the page that has the widget (tasks.html doesn't)
    let filter = document.getElementById('labelFilter');
    let div = document.getElementById('labelTasks');
    let table = document.getElementById('labelTasksTable');
    let noLabels = document.getElementById('noLabelsText');
    let empty = document.getElementById('emptyLabelTasks');
    let nav = document.getElementById('labelTasksPagination');
    let pages = document.getElementById('labelTasksNavPages');
    if (!filter || !div || !table || !noLabels || !empty || !nav || !pages) return;

    // Get logged user
    let user = getUser();
    if (!user) return;

    // Read Tags
    readTags().then(tags_res => {
        let tags = tags_res.data;

        // If there's no labels, show only a text indicating so
        if (tags.length === 0) {
            filter.classList.add('d-none');
            div.classList.add('d-none');
            empty.classList.add('d-none');
            nav.classList.add('d-none');
            noLabels.classList.remove('d-none');
            return;
        }
        noLabels.classList.add('d-none');
        filter.classList.remove('d-none');

        // In case tag was deleted or doesn't exist
        if (!tags.some(t => String(t.id) === String(widgetState.selectedTagId))) {
            widgetState.selectedTagId = tags[0].id;
            page = 1;
        }

        // Remember the current page
        widgetState.labelPage = page;
        
        // Build the filter
        buildLabelPills(filter, tags, widgetState.selectedTagId, tag => {
            widgetState.selectedTagId = tag.id;
            labelTasksWidget(1);
        });

        // Build the goddamn table
        return readTasks({
            tag: widgetState.selectedTagId,
            status: STATUS_ACTIVE,
            page: page,
            limit: TASKS_PER_PAGE
        }).then(tasks_res => {
            let total_pages = Math.ceil(tasks_res.total / tasks_res.limit);

            // Ensure pages are valid
            if (total_pages > 0 && page > total_pages) {
                labelTasksWidget(total_pages);
                return;
            }

            // Pagination
            buildPagination(nav, pages, page, total_pages, labelTasksWidget);

            // Clear old rows
            table.replaceChildren();

            // No pending tasks on label
            if (tasks_res.total === 0) {
                div.classList.add('d-none');
                empty.classList.remove('d-none');
                return;
            }
            div.classList.remove('d-none');
            empty.classList.add('d-none');

            // Build the table
            for (let i = 0; i < tasks_res.data.length; i++) {
                table.append(buildTaskRow(tasks_res.data[i], tags));
            }
        });
    }).catch(err => {
        alert(err.message);
    });
}

// =======================
// Completed Tasks Widget
// =======================

function completedTasksWidget(page = widgetState.completedPage) {
    // Only run on the page that has the widget (tasks.html doesn't)
    let table = document.getElementById('completedTasksTable'),
        div = document.getElementById('completedTasks'),
        empty = document.getElementById('emptyCompletedTasks'),
        nav = document.getElementById('completedTasksPagination'),
        pages = document.getElementById('completedTasksNavPages');
        if (!table || !div || !empty || !nav || !pages) return;

        // Get logged user
        let user = getUser();
        if (!user)return;

        // Remember the current page
        widgetState.completedPage = page;

        // Filtered call
        Promise.all([
            readTasks({status: STATUS_FINISHED, page: page, limit: TASKS_PER_PAGE}),
            readTags()
        ]).then(([tasks_res, tags_res]) => {
            let total_pages = Math.ceil(tasks_res.total / tasks_res.limit);

            // Ensure pages are valid
            if (total_pages > 0 && page > total_pages) {
                completedTasksWidget(total_pages);
                return;
            }

            // Pagination
            buildPagination(nav, pages, page, total_pages, completedTasksWidget);

            // Clear old rows
            table.replaceChildren();

            // No finished tasks
            if (tasks_res.total === 0) {
                div.classList.add('d-none');
                empty.classList.remove('d-none');
                return;
            }
            div.classList.remove('d-none');
            empty.classList.add('d-none');

            // Build the table
            for (let i = 0; i < tasks_res.data.length; i++) {
                table.append(buildTaskRow(tasks_res.data[i], tags_res.data));
            }
        }).catch(err => {
            alert(err.message);
        });
}

// =======================
// All Tasks List
// =======================

function allTasksTable(page = widgetState.tasksPage) {
    // Only run on the page that has the table (home.html doesn't)
    let filter = document.getElementById('allTasksFilter'),
        div = document.getElementById('allTasks'),
        table = document.getElementById('allTasksTable'),
        empty = document.getElementById('emptyAllTasks'),
        nav = document.getElementById('allTasksPagination'),
        pages = document.getElementById('allTasksNavPages');
    if (!filter || !div || !table || !empty || !nav || !pages) return;

    // Get logged user
    let user = getUser();
    if (!user) return;

    // Read the tags
    readTags().then(tags_res => {
        let tags = tags_res.data;

        // Selected label no longer exists
        if (widgetState.tasksTagId !== null && !tags.some(t => String(t.id) === String(widgetState.tasksTagId))) {
            widgetState.tasksTagId = null;
            page = 1;
        }

        // Remember current page
        widgetState.tasksPage = page;

        // Label filter (hidden if there are no labels)
        if (tags.length === 0) {
            filter.classList.add('d-none');
        } 
        // If there are labels
        else {
            filter.classList.remove('d-none');

            // Clicking the selected label again removes the filter
            buildLabelPills(filter, tags, widgetState.tasksTagId, tag => {
                let same = String(widgetState.tasksTagId) === String(tag.id);
                widgetState.tasksTagId = same ? null : tag.id;
                allTasksTable(1);
            });
        }

        // Manage calls based on filter vs no filter
        let filters = {page: page, limit: ALL_TASKS_PER_PAGE};
        if (widgetState.tasksTagId !== null) filters.tag = widgetState.tasksTagId;

        return readTasks(filters).then(tasks_res => {
            let total_pages = Math.ceil(tasks_res.total / tasks_res.limit);

            // Ensure pages are valid
            if (total_pages > 0 && page > total_pages) {
                allTasksTable(total_pages);
                return;
            }

            // Pagination
            buildPagination(nav, pages, page, total_pages, allTasksTable);
        
            // Clear old rows
            table.replaceChildren();

            // In case there are no tasks: empty table
            if (tasks_res.total === 0) {
                div.classList.add('d-none');
                empty.classList.remove('d-none');
                return;
            }
            div.classList.remove('d-none');
            empty.classList.add('d-none');

            // Build the fuckass table
            for (let i = 0; i < tasks_res.data.length; i++) {
                table.append(buildTaskRow(tasks_res.data[i], tags, true));
            }
        });
    }).catch(err => {
        alert(err.message);
    });
}

// =======================
// Update
// =======================

function updateTask(task, changes) {
    let user = getUser();
    if (!user) return Promise.resolve(false);

    // Call the patch method
    return fetch(TASKS_URL + '/' + task.id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify(changes)
    }).then(async response => {
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Task update failed: ' + response.status);
        }
        return response.json();
    }).then(data => {
        init()
        return true;
    }).catch(err => {
        alert(err.message);
        init();
        return false;
    });
}

let taskToEdit = null;

// Modal to Update a Task
function editTaskModal(task) {
    // Remember the task to edit
    taskToEdit = task;

    // Fill the form
    document.getElementById('editTaskName').value = task.title;
    document.getElementById('editTaskDate').value = String(task.due_date).slice(0, 10);

    // Fill the labels
    let select = document.getElementById('editTaskLabel');
    loadTagOptions(select, task.tags[0]).then(() => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editTask')).show();
    }).catch(err => {
        alert(err.message);
    });
}

// Button to save changes
function saveTaskChanges() {
    event.preventDefault();
    if (!taskToEdit) return;

    // Get inputs
    let nameInput = document.getElementById('editTaskName');
    let dateInput = document.getElementById('editTaskDate');
    let labelInput = document.getElementById('editTaskLabel');

    // Validate fields
    if (!nameInput.reportValidity()) return;
    if (!dateInput.reportValidity()) return;

    // Only one tag per task, or empty
    let tags = labelInput.value === '' ? [] : [Number(labelInput.value)];

    // Call the update function
    updateTask(taskToEdit, {
        title: nameInput.value.trim(),
        due_date: dateInput.value,
        tags: tags
    }).then(ok => {
        // Modal stays open in case of error
        if (!ok) return;

        // Close modal and clear the selected task
        let modal = document.getElementById('editTask');
        let b_modal = bootstrap.Modal.getInstance(modal);
        if (b_modal) b_modal.hide();
        taskToEdit = null;
    });
}

// =======================
// Delete
// =======================

// Current task to be deleted
let taskToDelete = null;

// Open the delete modal
function deleteTaskModal(task) {
    // Remember task
    taskToDelete = task;

    // Show task title
    document.getElementById('deleteTaskName').innerText = task.title;

    // Launch modal
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteTask')).show();
}

// Delete task
function deleteTask() {
    event.preventDefault();

    // Get logged user
    let user = getUser();
    if (!user || !taskToDelete) return;

    // Call delete method
    fetch(TASKS_URL + '/' + taskToDelete.id, {
        method: 'DELETE',
        headers: {
            'x-auth': user.password
        }
    }).then(async response => {
        // Error occurred
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Task deletion failed: ' + response.status);
        }
        return response.json();
    }).then(data => {
        // Close modal
        let modal = document.getElementById('deleteTask');
        let b_modal = bootstrap.Modal.getInstance(modal);
        if (b_modal) b_modal.hide();

        // Clear selected task and refresh
        taskToDelete = null;
        init();
    }).catch(err => {
        alert(err.message);
    })
}

// =======================
// Execute Functions
// =======================

// Search for forms and buttons
const newTaskModal = document.getElementById('newTask');
const bttnCreateTask = document.getElementById('bttn_create_task');
const urlTag = new URLSearchParams(window.location.search).get('tag');
const bttnUpdateTask = document.getElementById('bttn_update_task');
const bttnDeleteTask = document.getElementById('bttn_delete_task');

// Route functions based on actions
if (newTaskModal) {
    newTaskModal.addEventListener('show.bs.modal', prepareNewTask);
}

if (bttnCreateTask) {
    bttnCreateTask.addEventListener('click', createTask);
}

if (urlTag) {
    widgetState.tasksTagId = urlTag;
}

if (bttnUpdateTask) {
    bttnUpdateTask.addEventListener('click', saveTaskChanges);
}

if (bttnDeleteTask) {
    bttnDeleteTask.addEventListener('click', deleteTask);
}