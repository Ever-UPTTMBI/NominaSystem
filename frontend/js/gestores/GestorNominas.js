import {
    obtenerNominas,
    crearNomina,
    generarRecibosNomina,
    cambiarEstadoNomina,
    eliminarNomina
} from '../api.js';
import Notificador from '../utilidades/Notificador.js';

/**
 * GestorNominas
 * Clase controladora para la administración de periodos de liquidación y generación de recibos.
 */
export default class GestorNominas {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.nominas = [];

        this.#capturarElementosDOM();
        this.inicializarEventos();
    }

    #capturarElementosDOM() {
        this.tablaBody = this.contenedor.querySelector('#tablaNominasBody');
        this.modal = this.contenedor.querySelector('#nomina-modal');
        this.modalTitulo = this.contenedor.querySelector('#nominaModalTitle');
        this.formulario = this.contenedor.querySelector('#nominaForm');
        this.inputId = this.contenedor.querySelector('#nominaId');
        this.inputPeriodo = this.contenedor.querySelector('#nominaPeriodo');
        this.inputFechaInicio = this.contenedor.querySelector('#nominaFechaInicio');
        this.inputFechaFin = this.contenedor.querySelector('#nominaFechaFin');
        this.inputFechaPago = this.contenedor.querySelector('#nominaFechaPago');
        this.buscador = this.contenedor.querySelector('#buscadorNomina');
        this.btnNuevo = this.contenedor.querySelector('#btnNuevaNomina');
        this.btnCancelar = this.contenedor.querySelector('#btnNominaCancelar');
    }

    inicializarEventos() {
        if (this.btnNuevo) {
            this.btnNuevo.addEventListener('click', () => this.mostrarModalCrear());
        }

        if (this.btnCancelar) {
            this.btnCancelar.addEventListener('click', () => this.cerrarModal());
        }

        if (this.formulario) {
            this.formulario.addEventListener('submit', (e) => this.guardar(e));
        }

        if (this.buscador) {
            this.buscador.addEventListener('input', () => this.filtrar());
        }

        if (this.tablaBody) {
            this.tablaBody.addEventListener('click', (e) => this.#manejarAccionesTabla(e));
        }
    }

    async cargarListado() {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="6">Cargando periodos de nómina...</td></tr>';

        try {
            this.nominas = await obtenerNominas();
            this.renderizar(this.nominas);
        } catch (error) {
            this.tablaBody.innerHTML = `<tr class="fila-vacia"><td colspan="6" class="text-danger">Error: ${error.message}</td></tr>`;
            Notificador.error(error.message);
        }
    }

    renderizar(lista) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';

        if (!lista || lista.length === 0) {
            this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="6">No hay periodos de nómina creados. Crea uno con el botón superior.</td></tr>';
            return;
        }

        const obtenerBadgeEstado = (estado) => {
            const est = (estado || 'Borrador').toLowerCase();
            let clase = 'badge-borrador';
            let icono = '📝';
            if (est === 'procesada') { clase = 'badge-procesada'; icono = '⚙️'; }
            if (est === 'pagada') { clase = 'badge-pagada'; icono = '✅'; }
            if (est === 'anulada') { clase = 'badge-anulada'; icono = '🚫'; }
            return `<span class="badge ${clase}">${icono} ${estado}</span>`;
        };

        lista.forEach(nom => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${nom.id}</strong></td>
                <td><div class="font-bold">${nom.periodo}</div></td>
                <td>${Notificador.formatearFecha(nom.fechaInicio)} al ${Notificador.formatearFecha(nom.fechaFin)}</td>
                <td>${Notificador.formatearFecha(nom.fechaPago)}</td>
                <td class="text-center">${obtenerBadgeEstado(nom.estado)}</td>
                <td class="text-right">
                    <div class="action-buttons-group">
                        <button class="btn-primary btn-sm btn-generar" data-id="${nom.id}" title="Calcular y generar recibos automáticamente">⚡ Recibos</button>
                        <button class="btn-secondary btn-sm btn-ver-detalle" data-id="${nom.id}" title="Ver recibos de este periodo">📋 Detalle</button>
                        <button class="btn-edit btn-estado" data-id="${nom.id}" data-estado="${nom.estado}" title="Cambiar estado del periodo">🔄</button>
                        <button class="btn-delete btn-eliminar" data-id="${nom.id}" title="Eliminar periodo">🗑️</button>
                    </div>
                </td>
            `;
            this.tablaBody.appendChild(tr);
        });
    }

    filtrar() {
        const query = (this.buscador ? this.buscador.value : '').toLowerCase().trim();
        const filtrados = this.nominas.filter(n => n.periodo.toLowerCase().includes(query));
        this.renderizar(filtrados);
    }

    mostrarModalCrear() {
        this.formulario.reset();
        this.inputId.value = '';
        this.modalTitulo.textContent = 'Nuevo Periodo de Nómina';

        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        this.inputFechaInicio.value = `${yyyy}-${mm}-01`;
        this.inputFechaFin.value = `${yyyy}-${mm}-15`;
        this.inputFechaPago.value = `${yyyy}-${mm}-15`;
        this.inputPeriodo.value = `Quincena ${mm}/${yyyy}`;

        this.modal.style.display = 'flex';
        this.modal.classList.add('activo');
        this.inputPeriodo.focus();
    }

    cerrarModal() {
        this.modal.style.display = 'none';
        this.modal.classList.remove('activo');
        this.formulario.reset();
    }

    async guardar(evento) {
        evento.preventDefault();
        const datos = {
            periodo: this.inputPeriodo.value.trim(),
            fechaInicio: this.inputFechaInicio.value,
            fechaFin: this.inputFechaFin.value,
            fechaPago: this.inputFechaPago.value
        };

        try {
            await crearNomina(datos);
            Notificador.exito('Periodo de nómina abierto correctamente');
            this.cerrarModal();
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    async generarRecibos(id) {
        const confirmado = await Notificador.confirmar(`¿Deseas calcular y generar automáticamente los recibos para todos los empleados de la nómina #${id}?`);
        if (!confirmado) return;

        try {
            const respuesta = await generarRecibosNomina(id);
            Notificador.exito(`¡Nómina procesada! Se generaron ${respuesta.recibosGenerados} recibos de pago`);
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    async cambiarEstado(id, estadoActual) {
        let siguiente = 'Procesada';
        if (estadoActual === 'Procesada') siguiente = 'Pagada';
        else if (estadoActual === 'Pagada') siguiente = 'Borrador';

        const confirmado = await Notificador.confirmar(`¿Deseas cambiar el estado de la nómina #${id} a "${siguiente}"?`);
        if (!confirmado) return;

        try {
            await cambiarEstadoNomina(id, siguiente);
            Notificador.exito(`Estado actualizado a: ${siguiente}`);
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    async eliminar(id) {
        const confirmado = await Notificador.confirmar(`¿Eliminar la nómina #${id} y todos sus recibos asociados? Esta acción no se puede deshacer.`);
        if (!confirmado) return;

        try {
            await eliminarNomina(id);
            Notificador.exito('Periodo de nómina eliminado correctamente');
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    #manejarAccionesTabla(evento) {
        const btnGenerar = evento.target.closest('.btn-generar');
        const btnDetalle = evento.target.closest('.btn-ver-detalle');
        const btnEstado = evento.target.closest('.btn-estado');
        const btnEliminar = evento.target.closest('.btn-eliminar');

        if (btnGenerar) {
            const id = btnGenerar.getAttribute('data-id');
            this.generarRecibos(id);
        }

        if (btnDetalle) {
            const id = btnDetalle.getAttribute('data-id');
            window.filtroNominaSeleccionada = id;
            window.cargarVista('recibos');
        }

        if (btnEstado) {
            const id = btnEstado.getAttribute('data-id');
            const estadoActual = btnEstado.getAttribute('data-estado');
            this.cambiarEstado(id, estadoActual);
        }

        if (btnEliminar) {
            const id = btnEliminar.getAttribute('data-id');
            this.eliminar(id);
        }
    }
}
