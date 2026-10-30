// =======================
// Login Functions
// =======================

function toggleForms(){
    let form_login = document.getElementById('formLogin'),
        form_register = document.getElementById('formRegister');
    
    if(form_register.style.display == 'none'){
        form_login.style.display = 'none';
        form_register.style.display = 'block';
    }
    else{
        form_login.style.display = 'block';
        form_register.style.display = 'none';
    }
}

function login() {
    event.preventDefault();
    let data = new FormData(event.target);

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    }).then(response => {
      if (!response.ok) alert('Incorrect email or password');
      return response.json(); 
    }).then( user=> {
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = LOCAL_URL + 'views/home.html';
    }).catch (err => {
        console.error('Login error: ', err);
    })
}

function logout() {
    sessionStorage.clear();
    window.location.href = LOCAL_URL + 'views/login.html';
}

// =======================
// User Functions
// =======================

// Create new user
function register() {
    event.preventDefault();
    let data = new FormData(event.target);

    fetch('/registerUser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    }).then(async response => {
      if (!response.ok) {
        let msg = await response.text()
        throw new Error(msg || 'Registration failed: ' + response.status);
      }
      return response.json(); 
    }).then( user=> {
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = LOCAL_URL + 'views/home.html';
    }).catch (err => {
        console.error('Registration error: ', err);
        alert(err.message);
    })
}

// Populate Edit User Modal
function populateModal() {
    event.preventDefault();

    // Get the logged-in user
    let user = JSON.parse(sessionStorage.getItem('user'));

    // Fill modal
    document.getElementById('edit_name').value = user.name;
    document.getElementById('edit_email').value = user.email;
    document.getElementById('edit_password').value = user.password;
}

// Update User
function updateUser() {
    event.preventDefault();

    // Get current user
    let user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // CONFIRM: Make sure all data is entered for some reason?
    let inputs = document.querySelectorAll('#editUserModal input');
    for (let i of inputs) {
        if (!i.reportValidity()) return;
    }

    let data = {
        name: document.getElementById('edit_name').value,
        email: document.getElementById('edit_email').value,
        password: document.getElementById('edit_password').value
    };

    fetch('/users/' + user.id, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.password 
        },
        body: JSON.stringify(data)
    }).then(async response => {
        if (!response.ok) {
            let msg = await response.text();
            throw new Error(msg || 'Update failed: ' + response.status);
        }
        return response.json();
    }).then(result => {
        // Update session storage w the new user
        sessionStorage.setItem('user', JSON.stringify(result.user));

        // Close modal
        let modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        if (modal) modal.hide();

        alert(result.message);
    }).catch(err => {
        alert(err.message);
    })
}

// No idea what this does
function init() {

}

// Delete User

// =======================
// Execute Functions
// =======================

// Search for forms and buttons
const loginForm = document.getElementById('formLogin');
const registerForm = document.getElementById('formRegister');
const logoutButton = document.getElementById('bttn_logout');
// Related to user CRUD
const editUserModal = document.getElementById('editUserModal');
const updateButton = document.getElementById('bttn_update');

// Route functions based on actions
if (loginForm) {
    loginForm.addEventListener('submit', login);
}

if (registerForm) {
    registerForm.addEventListener('submit', register);
}

if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}

if (editUserModal) {
    editUserModal.addEventListener('shown.bs.modal', populateModal);
}

if (updateButton) {
    updateButton.addEventListener('click', updateUser);
}

init();