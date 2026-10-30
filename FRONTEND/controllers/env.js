const LOCAL_URL = "http://localhost:3000/";

function validateLogin() {
    const isLoggedIn = sessionStorage.getItem('user');
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/views/login.html';

    if (!isLoggedIn && !isLoginPage) {
        document.body.style.display = 'none';
        alert('Log in first');
        window.location.href = LOCAL_URL + 'views/login.html';
        return;
    }

    if (isLoggedIn && isLoginPage) {
        window.location.href = LOCAL_URL + 'views/home.html';
    }
}

validateLogin();
