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
    debugger;
}

document.getElementById('formLogin').addEventListener('submit', login);