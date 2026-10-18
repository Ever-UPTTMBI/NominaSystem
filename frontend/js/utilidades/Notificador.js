/**
 * Notificador
 * Clase utilitaria para retroalimentación visual (Toasts, Modales de confirmación y formato de datos).
 * Cumple con el principio de Responsabilidad Única (SRP).
 */
export default class Notificador {
    static exito(mensaje) {
        this.#mostrarToast(mensaje, 'exito', '✅');
    }

    static error(mensaje) {
        this.#mostrarToast(mensaje, 'error', '❌');
    }

    static info(mensaje) {
        this.#mostrarToast(mensaje, 'info', 'ℹ️');
    }

    static #mostrarToast(mensaje, tipo, icono) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-alerta ${tipo}`;
        toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('mostrar'), 10);
        setTimeout(() => {
            toast.classList.remove('mostrar');
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    /**
     * Muestra el modal de confirmación personalizado del sistema y retorna una Promesa.
     * @param {string} mensaje
     * @returns {Promise<boolean>}
     */
    static confirmar(mensaje) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const msgSpan = document.getElementById('confirm-modal-msg');
            const btnConfirmar = document.getElementById('btn-modal-confirmar');
            const btnCancelar = document.getElementById('btn-modal-cancelar');

            if (!modal || !btnConfirmar || !btnCancelar) {
                // Fallback de seguridad al confirm nativo si no existe el modal en el DOM
                return resolve(window.confirm(mensaje));
            }

            msgSpan.textContent = mensaje;
            modal.style.display = 'flex';
            modal.classList.add('activo');

            const limpiar = () => {
                btnConfirmar.removeEventListener('click', alConfirmar);
                btnCancelar.removeEventListener('click', alCancelar);
                modal.style.display = 'none';
                modal.classList.remove('activo');
            };

            const alConfirmar = () => { limpiar(); resolve(true); };
            const alCancelar = () => { limpiar(); resolve(false); };

            btnConfirmar.addEventListener('click', alConfirmar);
            btnCancelar.addEventListener('click', alCancelar);
        });
    }

    static formatearMoneda(monto) {
        return (Number(monto) || 0).toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' Bs';
    }

    static formatearFecha(fechaStr) {
        if (!fechaStr) return '--/--/----';
        const d = new Date(fechaStr);
        return isNaN(d) ? fechaStr : d.toLocaleDateString('es-VE', { timeZone: 'UTC' });
    }
}
