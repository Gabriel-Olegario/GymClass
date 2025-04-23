// Dados iniciais (simulando um banco de dados local)
let users = JSON.parse(localStorage.getItem('users')) || [];

// Elementos do DOM
const registerForm = document.getElementById('registerForm');

// Event Listeners
registerForm.addEventListener('submit', handleRegister);

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const type = document.getElementById('userType').value;

    if (users.some(u => u.email === email)) {
        alert('Este email já está cadastrado');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        type
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Cadastro realizado com sucesso!');
    window.location.href = 'login.html';
} 