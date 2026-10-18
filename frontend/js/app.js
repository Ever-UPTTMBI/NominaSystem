import { verificarSesion } from './api.js';

/**
 * Enrutador inicial: Redirige al dashboard si hay sesión activa, o al login si no.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const sesion = await verificarSesion();
        if (sesion.loggedIn) {
            window.location.href = '/dashboard.html';
        } else {
            window.location.href = '/login.html';
        }
    } catch {
        window.location.href = '/login.html';
    }
});
