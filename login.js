// Dados iniciais (simulando um banco de dados local)
let users = JSON.parse(localStorage.getItem('users')) || [];

// Elementos do DOM
const loginForm = document.getElementById('loginForm');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Email ou senha inválidos');
    }
} 