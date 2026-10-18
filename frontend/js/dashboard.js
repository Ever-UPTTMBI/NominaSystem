import { verificarSesion, logout } from './api.js';
import GestorEmpleados from './gestores/GestorEmpleados.js';
import GestorDepartamentos from './gestores/GestorDepartamentos.js';
import GestorNominas from './gestores/GestorNominas.js';
import GestorRecibos from './gestores/GestorRecibos.js';
import GestorEstadisticas from './gestores/GestorEstadisticas.js';
import GestorReporte from './gestores/GestorReporte.js';
import Notificador from './utilidades/Notificador.js';

/**
 * Enrutador y Orquestador de la aplicación SPA (dashboard)
 */
class SistemaNominaApp {
    constructor() {
        this.vistaActual = 'empleados';
        this.gestorActivo = null;

        // Hacer cargarVista accesible globalmente (ej. desde botones de retorno)
        window.cargarVista = (nombre) => this.cargarVista(nombre);
    }

    async iniciar() {
        // 1. Verificación de sesión activa
        const sesion = await verificarSesion();
        if (!sesion.loggedIn) {
            window.location.href = '/';
            return;
        }

        // 2. Configurar preferencias visuales y eventos globales
        this.aplicarModosGuardados();
        this.configurarNavegacion();
        this.configurarBotonesTema();
        this.configurarCerrarSesion();

        // 3. Cargar la vista inicial
        await this.cargarVista('empleados');
    }

    async cargarVista(nombreVista) {
        const contenedor = document.getElementById('view-container');
        if (!contenedor) return;

        try {
            const respuesta = await fetch(`/views/${nombreVista}.html`);
            if (!respuesta.ok) throw new Error(`Vista '${nombreVista}' no encontrada`);
            
            contenedor.innerHTML = await respuesta.text();

            // Actualizar botones de navegación activos
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === nombreVista);
            });

            this.vistaActual = nombreVista;

            // Instanciar el Gestor correspondiente según la vista cargada
            this.inicializarGestor(nombreVista, contenedor);
        } catch (error) {
            contenedor.innerHTML = `
                <div class="error-panel">
                    <h3>Error al cargar vista</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="window.cargarVista('empleados')">Volver al inicio</button>
                </div>
            `;
            Notificador.error(error.message);
        }
    }

    inicializarGestor(vista, contenedor) {
        switch (vista) {
            case 'empleados':
                this.gestorActivo = new GestorEmpleados(contenedor);
                this.gestorActivo.cargarListado();
                break;

            case 'empleado-form':
                this.gestorActivo = new GestorEmpleados(contenedor);
                this.gestorActivo.cargarFormulario(window.empleadoEditando || null);
                break;

            case 'departamentos':
                this.gestorActivo = new GestorDepartamentos(contenedor);
                this.gestorActivo.cargarListado();
                break;

            case 'nominas':
                this.gestorActivo = new GestorNominas(contenedor);
                this.gestorActivo.cargarListado();
                break;

            case 'recibos':
                this.gestorActivo = new GestorRecibos(contenedor);
                this.gestorActivo.cargarListado();
                break;

            case 'estadisticas':
                this.gestorActivo = new GestorEstadisticas(contenedor);
                this.gestorActivo.cargarMetricas();
                break;

            case 'reporte':
                this.gestorActivo = new GestorReporte(contenedor);
                this.gestorActivo.cargarReporte();
                break;

            default:
                console.warn(`Vista no reconocida: ${vista}`);
        }
    }

    configurarNavegacion() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const vista = btn.dataset.view;
                if (vista && vista !== this.vistaActual) {
                    this.cargarVista(vista);
                }
            });
        });
    }

    configurarBotonesTema() {
        const nightBtn = document.getElementById('nightModeBtn');
        const visualBtn = document.getElementById('visualProtectionBtn');

        if (nightBtn) {
            nightBtn.addEventListener('click', () => {
                const esNocturno = document.body.classList.toggle('night-mode');
                nightBtn.textContent = esNocturno ? '☀️' : '🌙';
                localStorage.setItem('nightMode', esNocturno);
                Notificador.info(esNocturno ? '🌙 Modo nocturno activado' : '☀️ Modo diurno activado');
            });
        }

        if (visualBtn) {
            visualBtn.addEventListener('click', () => {
                const esProtegido = document.body.classList.toggle('visual-protection');
                localStorage.setItem('visualProtection', esProtegido);
                visualBtn.style.background = esProtegido ? '#f59e0b' : '';
                visualBtn.style.color = esProtegido ? '#78350f' : '';
                Notificador.info(esProtegido ? '👁️ Protección visual activada' : '👁️ Protección desactivada');
            });
        }
    }

    aplicarModosGuardados() {
        const esNocturno = localStorage.getItem('nightMode') === 'true';
        const esProtegido = localStorage.getItem('visualProtection') === 'true';

        document.body.classList.toggle('night-mode', esNocturno);
        document.body.classList.toggle('visual-protection', esProtegido);

        const nightBtn = document.getElementById('nightModeBtn');
        if (nightBtn) nightBtn.textContent = esNocturno ? '☀️' : '🌙';
    }

    configurarCerrarSesion() {
        const btnLogout = document.getElementById('logoutBtn');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                await logout();
                window.location.href = '/';
            });
        }
    }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new SistemaNominaApp();
    app.iniciar();
});
