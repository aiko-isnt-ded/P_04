// Import constant
import {LOCAL_URL} from './env.js';

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


// Search for loginForm
const loginForm = document.getElementById('formLogin');

if (loginForm) {
    loginForm.addEventListener('submit', login);
}

// Search for LogOut button
const logoutButton = document.getElementById('bttn_logout');

if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}
