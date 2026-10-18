import { login } from './api.js';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const passwordInput = document.getElementById('loginPassword');
const toggleBtn = document.getElementById('togglePassword');

// Mostrar u ocultar contraseña
if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
        const esPassword = passwordInput.type === 'password';
        passwordInput.type = esPassword ? 'text' : 'password';
        toggleBtn.textContent = esPassword ? '🙈' : '👁️';
        toggleBtn.title = esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
    });
}

// Envío del formulario
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = passwordInput.value.trim();

        loginError.style.display = 'none';
        loginError.textContent = '';

        try {
            await login(email, password);
            window.location.href = '/dashboard.html';
        } catch (error) {
            loginError.textContent = error.message || 'Credenciales incorrectas';
            loginError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
}
