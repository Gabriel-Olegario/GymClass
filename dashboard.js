// Simulando um banco de dados local
let users = JSON.parse(localStorage.getItem('users')) || [];
let classes = JSON.parse(localStorage.getItem('classes')) || [];
let enrollments = JSON.parse(localStorage.getItem('enrollments')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];

// Obtendo o usuário atual
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Elementos do DOM
const userDashboardSection = document.getElementById('userDashboard');
const instructorSection = document.getElementById('instructorSection');
const addClassBtn = document.getElementById('addClassBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addClassModal = new bootstrap.Modal(document.getElementById('addClassModal'));
const addClassForm = document.getElementById('addClassForm');

// Event Listeners
if (addClassBtn) {
    addClassBtn.addEventListener('click', showAddClassModal);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}

// Verificar se o usuário está logado
if (!currentUser) {
    window.location.href = 'login.html';
} else {
    displayUserDashboard();
}

// Função para mostrar o modal de adicionar classe
function showAddClassModal() {
    addClassModal.show();
}

// Função principal para exibir o dashboard do usuário
function displayUserDashboard() {
    if (currentUser.type === 'instructor') {
        loadInstructorClasses();
        if (instructorSection) {
            instructorSection.style.display = 'block';
        }
        if (userDashboardSection) {
            userDashboardSection.style.display = 'none';
        }
    } else {
        loadClasses();
        if (instructorSection) {
            instructorSection.style.display = 'none';
        }
        if (userDashboardSection) {
            userDashboardSection.style.display = 'block';
        }
    }
}

// Função para carregar classes disponíveis para alunos
function loadClasses() {
    const classesContainer = document.getElementById('classesContainer');
    if (!classesContainer) return;

    classesContainer.innerHTML = '';
    const now = new Date();

    classes.forEach(classItem => {
        const classStartTime = new Date(classItem.date + ' ' + classItem.time);
        const isEnrolled = enrollments.some(e => e.classId === classItem.id && e.userId === currentUser.id);
        const enrollmentCount = enrollments.filter(e => e.classId === classItem.id).length;
        const isFullyBooked = enrollmentCount >= classItem.maxStudents;
        const isPastClass = now > classStartTime;
        const hasAttended = attendance.some(a => a.classId === classItem.id && a.userId === currentUser.id);
        const canConfirmAttendance = isEnrolled && !hasAttended && 
            Math.abs(now - classStartTime) <= 5 * 60 * 1000; // 5 minutos antes ou depois do início

        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${classItem.name}</h5>
                <p class="card-text">
                    Instrutor: ${classItem.instructor}<br>
                    Data: ${classItem.date}<br>
                    Horário: ${classItem.time}<br>
                    Vagas: ${enrollmentCount}/${classItem.maxStudents}
                </p>
                ${isEnrolled ? 
                    `<div class="d-flex align-items-center">
                        ${!isPastClass ? 
                            `<button class="btn btn-danger me-2" onclick="cancelEnrollment('${classItem.id}')">
                                Cancelar Matrícula
                            </button>` : ''
                        }
                        ${canConfirmAttendance ? 
                            `<button class="btn btn-success me-2" onclick="confirmAttendance('${classItem.id}')">
                                Confirmar Presença
                            </button>` : ''
                        }
                        ${isPastClass ? 
                            (hasAttended ? 
                                '<span class="text-success"><i class="bi bi-check-circle"></i> Presença Confirmada</span>' : 
                                '<span class="text-danger"><i class="bi bi-x-circle"></i> Falta Registrada</span>'
                            ) : ''
                        }
                    </div>` :
                    `<button class="btn btn-primary" 
                        onclick="enrollInClass('${classItem.id}')"
                        ${isFullyBooked || isPastClass ? 'disabled' : ''}>
                        ${isFullyBooked ? 'Turma Lotada' : (isPastClass ? 'Aula Encerrada' : 'Matricular')}
                    </button>`
                }
            </div>
        `;
        classesContainer.appendChild(card);
    });
}

// Função para carregar classes do instrutor
function loadInstructorClasses() {
    const instructorClassesContainer = document.getElementById('instructorClassesContainer');
    if (!instructorClassesContainer) return;

    instructorClassesContainer.innerHTML = '';
    const instructorClasses = classes.filter(c => c.instructor === currentUser.name);

    instructorClasses.forEach(classItem => {
        const classEnrollments = enrollments.filter(e => e.classId === classItem.id);
        const card = document.createElement('div');
        card.className = 'card mb-3';
        
        // Criar lista de alunos matriculados
        const enrolledStudents = classEnrollments.map(enrollment => {
            const student = users.find(u => u.id === enrollment.userId);
            const hasAttended = attendance.some(a => 
                a.classId === classItem.id && a.userId === enrollment.userId
            );
            return student ? `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${student.name}
                    ${hasAttended ? 
                        '<span class="text-success"><i class="bi bi-check-circle"></i> Presente</span>' : 
                        '<span class="text-secondary">Aguardando confirmação</span>'
                    }
                </li>
            ` : '';
        }).join('');

        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title">${classItem.name}</h5>
                    <button class="btn btn-danger btn-sm" onclick="deleteClass('${classItem.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <p class="card-text">
                    Data: ${classItem.date}<br>
                    Horário: ${classItem.time}<br>
                    Alunos Matriculados: ${classEnrollments.length}/${classItem.maxStudents}
                </p>
                <button class="btn btn-info mb-2" onclick="toggleStudentList('${classItem.id}')">
                    Ver Alunos
                </button>
                <ul id="studentList-${classItem.id}" class="list-group" style="display: none;">
                    ${enrolledStudents}
                </ul>
            </div>
        `;
        instructorClassesContainer.appendChild(card);
    });
}

// Função para matricular em uma classe
function enrollInClass(classId) {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return;

    const enrollmentCount = enrollments.filter(e => e.classId === classId).length;
    if (enrollmentCount >= classItem.maxStudents) {
        alert('Desculpe, esta turma está lotada.');
        return;
    }

    const now = new Date();
    const classStartTime = new Date(classItem.date + ' ' + classItem.time);
    if (now > classStartTime) {
        alert('Não é possível se matricular em uma aula que já aconteceu.');
        return;
    }

    const newEnrollment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        classId: classId,
        enrollmentDate: new Date().toISOString()
    };

    enrollments.push(newEnrollment);
    localStorage.setItem('enrollments', JSON.stringify(enrollments));
    loadClasses();
}

// Função para cancelar matrícula
function cancelEnrollment(classId) {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return;

    const now = new Date();
    const classStartTime = new Date(classItem.date + ' ' + classItem.time);
    const minutesDifference = (classStartTime - now) / (1000 * 60);

    if (minutesDifference < 10) {
        alert('Não é possível cancelar a matrícula com menos de 10 minutos de antecedência.');
        return;
    }

    if (confirm('Tem certeza que deseja cancelar sua matrícula nesta aula?')) {
        enrollments = enrollments.filter(e => !(e.classId === classId && e.userId === currentUser.id));
        localStorage.setItem('enrollments', JSON.stringify(enrollments));
        loadClasses();
    }
}

// Função para confirmar presença (agora para o aluno)
function confirmAttendance(classId) {
    const newAttendance = {
        id: Date.now().toString(),
        classId: classId,
        userId: currentUser.id,
        date: new Date().toISOString()
    };

    attendance.push(newAttendance);
    localStorage.setItem('attendance', JSON.stringify(attendance));
    loadClasses();
}

// Função para mostrar/ocultar lista de alunos
function toggleStudentList(classId) {
    const studentList = document.getElementById(`studentList-${classId}`);
    if (studentList) {
        studentList.style.display = studentList.style.display === 'none' ? 'block' : 'none';
    }
}

// Função para excluir uma aula
function deleteClass(classId) {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) {
        return;
    }

    // Verificar se há alunos matriculados
    const classEnrollments = enrollments.filter(e => e.classId === classId);
    if (classEnrollments.length > 0) {
        if (!confirm('Esta aula possui alunos matriculados. Deseja realmente excluí-la?')) {
            return;
        }
    }

    // Remover a aula
    classes = classes.filter(c => c.id !== classId);
    localStorage.setItem('classes', JSON.stringify(classes));

    // Remover matrículas relacionadas
    enrollments = enrollments.filter(e => e.classId !== classId);
    localStorage.setItem('enrollments', JSON.stringify(enrollments));

    // Remover registros de presença relacionados
    attendance = attendance.filter(a => a.classId !== classId);
    localStorage.setItem('attendance', JSON.stringify(attendance));

    // Atualizar a interface
    loadInstructorClasses();
}

// Event listener para adicionar nova classe
if (addClassForm) {
    addClassForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newClass = {
            id: Date.now().toString(),
            name: document.getElementById('className').value,
            instructor: currentUser.name,
            date: document.getElementById('classDate').value,
            time: document.getElementById('classTime').value,
            maxStudents: parseInt(document.getElementById('maxStudents').value)
        };

        classes.push(newClass);
        localStorage.setItem('classes', JSON.stringify(classes));
        addClassModal.hide();
        addClassForm.reset();
        loadInstructorClasses();
    });
} 