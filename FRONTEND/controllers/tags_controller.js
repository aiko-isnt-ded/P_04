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
        colorInput.value = '563d7c';

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

function init() {

}

// =======================
// Execute Functions
// =======================

// Search for forms and buttons
const bttnCreateLabel = document.getElementById('bttn_create_label');

// Route functions based on actions
if (bttnCreateLabel) {
    bttnCreateLabel.addEventListener('click', createTag);
}

init();