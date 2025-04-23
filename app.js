// Dados iniciais (simulando um banco de dados local)
let users = JSON.parse(localStorage.getItem('users')) || [];
let classes = JSON.parse(localStorage.getItem('classes')) || [];
let enrollments = JSON.parse(localStorage.getItem('enrollments')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];

// Estado atual do usuário
let currentUser = null;

// Elementos do DOM
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const classesSection = document.getElementById('classesSection');
const instructorSection = document.getElementById('instructorSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');
const loginLink = document.getElementById('loginLink');
const registerLink = document.getElementById('registerLink');
const classesList = document.getElementById('classesList');
const instructorClassesList = document.getElementById('instructorClassesList');
const addClassBtn = document.getElementById('addClassBtn');

// Event Listeners
showRegisterLink.addEventListener('click', () => toggleAuthSections('register'));
showLoginLink.addEventListener('click', () => toggleAuthSections('login'));
loginLink.addEventListener('click', () => toggleAuthSections('login'));
registerLink.addEventListener('click', () => toggleAuthSections('register'));
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
addClassBtn.addEventListener('click', showAddClassModal);

// Funções de Autenticação
function toggleAuthSections(section) {
    loginSection.style.display = section === 'login' ? 'block' : 'none';
    registerSection.style.display = section === 'register' ? 'block' : 'none';
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showUserDashboard();
    } else {
        alert('Email ou senha incorretos');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const type = document.getElementById('registerType').value;

    if (users.some(u => u.email === email)) {
        alert('Email já cadastrado');
        return;
    }

    const newUser = { id: Date.now(), name, email, password, type };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Cadastro realizado com sucesso!');
    toggleAuthSections('login');
}

// Funções de Dashboard
function showUserDashboard() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    classesSection.style.display = 'block';
    
    if (currentUser.type === 'instructor') {
        instructorSection.style.display = 'block';
        loadInstructorClasses();
    } else {
        instructorSection.style.display = 'none';
    }
    
    loadClasses();
}

// Funções de Aulas
function loadClasses() {
    classesList.innerHTML = '';
    classes.forEach(classItem => {
        const isEnrolled = enrollments.some(e => 
            e.classId === classItem.id && e.userId === currentUser.id
        );
        
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card class-card">
                <div class="card-body">
                    <h5 class="card-title">${classItem.name}</h5>
                    <p class="card-text">${classItem.description}</p>
                    <p class="card-text"><small class="text-muted">Data: ${classItem.date}</small></p>
                    <p class="card-text"><small class="text-muted">Horário: ${classItem.time}</small></p>
                    ${isEnrolled ? 
                        `<button class="btn btn-success" onclick="checkAttendance(${classItem.id})">Confirmar Presença</button>` :
                        `<button class="btn btn-primary" onclick="enrollInClass(${classItem.id})">Inscrever-se</button>`
                    }
                </div>
            </div>
        `;
        classesList.appendChild(card);
    });
}

function loadInstructorClasses() {
    instructorClassesList.innerHTML = '';
    const instructorClasses = classes.filter(c => c.instructorId === currentUser.id);
    
    instructorClasses.forEach(classItem => {
        const enrolledStudents = enrollments.filter(e => e.classId === classItem.id);
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${classItem.name}</h5>
                <p class="card-text">${classItem.description}</p>
                <p class="card-text"><small class="text-muted">Data: ${classItem.date}</small></p>
                <h6>Alunos Inscritos:</h6>
                <div class="student-list">
                    ${enrolledStudents.map(e => {
                        const student = users.find(u => u.id === e.userId);
                        const studentAttendance = attendance.filter(a => 
                            a.classId === classItem.id && a.userId === student.id
                        );
                        const attendanceCount = studentAttendance.length;
                        return `
                            <div class="student-item">
                                ${student.name} - 
                                <span class="presence-status ${attendanceCount > 0 ? 'present' : 'absent'}">
                                    ${attendanceCount > 0 ? 'Presente' : 'Ausente'}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        instructorClassesList.appendChild(card);
    });
}

function enrollInClass(classId) {
    if (enrollments.some(e => e.classId === classId && e.userId === currentUser.id)) {
        alert('Você já está inscrito nesta aula');
        return;
    }

    enrollments.push({
        id: Date.now(),
        classId,
        userId: currentUser.id,
        date: new Date().toISOString()
    });

    localStorage.setItem('enrollments', JSON.stringify(enrollments));
    loadClasses();
}

function checkAttendance(classId) {
    const today = new Date().toISOString().split('T')[0];
    if (attendance.some(a => 
        a.classId === classId && 
        a.userId === currentUser.id && 
        a.date.split('T')[0] === today
    )) {
        alert('Você já confirmou presença hoje');
        return;
    }

    attendance.push({
        id: Date.now(),
        classId,
        userId: currentUser.id,
        date: new Date().toISOString()
    });

    localStorage.setItem('attendance', JSON.stringify(attendance));
    loadClasses();
}

function showAddClassModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Adicionar Nova Aula</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addClassForm">
                        <div class="mb-3">
                            <label class="form-label">Nome da Aula</label>
                            <input type="text" class="form-control" id="className" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Descrição</label>
                            <textarea class="form-control" id="classDescription" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Data</label>
                            <input type="date" class="form-control" id="classDate" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Horário</label>
                            <input type="time" class="form-control" id="classTime" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="addNewClass()">Adicionar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();

    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

function addNewClass() {
    const name = document.getElementById('className').value;
    const description = document.getElementById('classDescription').value;
    const date = document.getElementById('classDate').value;
    const time = document.getElementById('classTime').value;

    const newClass = {
        id: Date.now(),
        name,
        description,
        date,
        time,
        instructorId: currentUser.id
    };

    classes.push(newClass);
    localStorage.setItem('classes', JSON.stringify(classes));
    
    const modal = document.querySelector('.modal');
    const modalInstance = bootstrap.Modal.getInstance(modal);
    modalInstance.hide();
    
    loadInstructorClasses();
}

// Verificar se há usuário logado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserDashboard();
    }
}); 