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