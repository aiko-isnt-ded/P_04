// =======================
// Tags Functions
// =======================

const TAGS_URL = LOCAL_URL + 'tags';

// Create new tag
function createTag() {
    event.preventDefault();

    // Get logged user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Get inputs
    let nameInput = document.getElementById('labelName');
    let colorInput = document.getElementById('labelColor');
    
    // Validate fields
    if (!nameInput.reportValidity()) return;
    if (!colorInput.reportValidity()) return;

    // Call the POST method
    fetch(TAGS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify({
            name: nameInput.value.trim(),
            color: colorInput.value
        })
    }).then(async response => {
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Tag Creation failed: ' + response.status);
        }
        return response.json();
    }).then(data => {
        // Reset modal
        nameInput.value = '';
        colorInput.value = '#563d7c';

        // Close modal
        let modal = document.getElementById('newLabel');
        let b_modal = bootstrap.Modal.getInstance(modal);
        if (b_modal) b_modal.hide();

        // Send alert
        alert(data.message);
        init();
    }).catch(err => {
        alert(err.message);
    }); 
}

// Tag to be edited
let tagToEdit = null;
// Edit Tag Function
function editTagModal(tag) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remember which tag is being edited
    tagToEdit = tag;

    // Fill the form
    document.getElementById('editLabelName').value = tag.name;
    document.getElementById('editLabelColor').value = tag.color;

    // Close the dropdown (stopPropagation kept it open)
    let dropdownToggle = document.getElementById('navbarDropdown');
    let dropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
    if (dropdown) dropdown.hide();

    // Launch the modal
    let edit_tag_modal = new bootstrap.Modal(document.getElementById('editLabel'));
    edit_tag_modal.show();
}

function updateTag() {
    event.preventDefault();

    // Get logged user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || !tagToEdit) return;

    // Get inputs
    let nameInput = document.getElementById('editLabelName');
    let colorInput = document.getElementById('editLabelColor');

    // Validate fields
    if (!nameInput.reportValidity()) return;
    if (!colorInput.reportValidity()) return;

    // Call the method
    fetch(TAGS_URL + '/' + tagToEdit.id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password
        },
        body: JSON.stringify({
            name: nameInput.value.trim(),
            color: colorInput.value
        })
    }).then(async response => {
        // Occurred an error
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Tag update failed: ' + response.status);
        }
        return response.json();
    }).then(data => {
        // Close modal
        let modal = document.getElementById('editLabel');
        let b_modal = bootstrap.Modal.getInstance(modal);
        if (b_modal) b_modal.hide();

        // Clear the tag to update
        tagToEdit = null;

        // Send alert and refresh the data
        alert(data.message);
        init();
    }).catch(err => {
        alert(err.message);
    });
}

function init() {
    // Check if there's a dropdown label
    let tagsList = document.getElementById('dropdownLabels');
    let addLabel = document.getElementById('addLabel');
    if (!tagsList || !addLabel) return;

    // Get user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Get every tag
    fetch(TAGS_URL + '?page=1&limit=200', {
        method: 'GET',
        headers: {
            'x-auth': user.password
        }
    }).then(async response => {
        // Error ocurred
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Error loading labels: ' + response.status);
        }
        return response.json();
    }).then(data => {
        // Get tags
        let tags = data.data;

        // Prevent re-duplication of tags
        tagsList.querySelectorAll('.tag-item').forEach(item => item.remove());

        // Build tags :) 
        for (let i = 0; i < tags.length; i++) {
            let tag = tags[i],
                tag_item = document.createElement('li'),
                tag_container = document.createElement('a'),
                edit_btn = document.createElement('span'),
                edit_icon = document.createElement('i');
                
            tag_item.classList.add('tag-item');

            // bootstrap shit
            tag_container.classList.add('dropdown-item', 'd-flex', 'justify-content-between', 'align-items-center');
            tag_container.href = '#';
            tag_container.innerText = tag.name;

            // more bootstrap shit for the icon
            edit_icon.classList.add('fa-solid', 'fa-pen');
            edit_btn.classList.add('ms-3');
            edit_btn.style.cursor = 'pointer';
            edit_btn.addEventListener('click', () => { editTagModal(tag); });
            edit_btn.append(edit_icon);

            // Merge all the HTML and shit
            tag_container.append(edit_btn);
            tag_item.append(tag_container);
            tagsList.insertBefore(tag_item, addLabel.closest('li'));
        }
    }).catch(err => {
        alert(err.message);
    });
}

// =======================
// Execute Functions
// =======================

// Search for forms and buttons
const bttnCreateLabel = document.getElementById('bttn_create_label');
const bttnUpdateLabel = document.getElementById('bttn_update_label');

// Route functions based on actions
if (bttnCreateLabel) {
    bttnCreateLabel.addEventListener('click', createTag);
}

if (bttnUpdateLabel) {
    bttnUpdateLabel.addEventListener('click', updateTag);
}

init();