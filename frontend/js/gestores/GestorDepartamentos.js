import {
    obtenerDepartamentos,
    crearDepartamento,
    actualizarDepartamento,
    eliminarDepartamento,
    obtenerEmpleados
} from '../api.js';
import Notificador from '../utilidades/Notificador.js';

/**
 * GestorDepartamentos
 * Clase controladora para la vista de Departamentos.
 * Sigue el ciclo de vida estándar: inicializarEventos -> cargarListado -> guardar / eliminar.
 */
export default class GestorDepartamentos {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.departamentos = [];
        this.empleados = [];

        this.#capturarElementosDOM();
        this.inicializarEventos();
    }

    #capturarElementosDOM() {
        this.tablaBody = this.contenedor.querySelector('#tablaDeptosBody');
        this.modal = this.contenedor.querySelector('#departamento-modal');
        this.modalTitulo = this.contenedor.querySelector('#deptoModalTitle');
        this.formulario = this.contenedor.querySelector('#deptoForm');
        this.inputId = this.contenedor.querySelector('#deptoId');
        this.inputNombre = this.contenedor.querySelector('#deptoNombre');
        this.inputDescripcion = this.contenedor.querySelector('#deptoDescripcion');
        this.buscador = this.contenedor.querySelector('#buscadorDepto');
        this.btnNuevo = this.contenedor.querySelector('#btnNuevoDepartamento');
        this.btnCancelar = this.contenedor.querySelector('#btnDeptoCancelar');
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
        this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="5">Cargando departamentos...</td></tr>';

        try {
            const [deptos, emps] = await Promise.all([
                obtenerDepartamentos(),
                obtenerEmpleados().catch(() => [])
            ]);
            this.departamentos = deptos;
            this.empleados = emps;
            this.renderizar(this.departamentos);
        } catch (error) {
            this.tablaBody.innerHTML = `<tr class="fila-vacia"><td colspan="5" class="text-danger">Error: ${error.message}</td></tr>`;
            Notificador.error(error.message);
        }
    }

    renderizar(lista) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';

        if (!lista || lista.length === 0) {
            this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="5">No se encontraron departamentos.</td></tr>';
            return;
        }

        lista.forEach(depto => {
            const tr = document.createElement('tr');
            const personalAsignado = this.empleados.filter(e => Number(e.departamento_id) === Number(depto.id)).length;

            tr.innerHTML = `
                <td><strong>#${depto.id}</strong></td>
                <td><span class="font-bold">${depto.nombre}</span></td>
                <td>${depto.descripcion || '<em class="text-muted">Sin descripción</em>'}</td>
                <td class="text-center"><span class="badge badge-dept">${personalAsignado} empleados</span></td>
                <td class="text-right">
                    <div class="action-buttons-group">
                        <button class="btn-edit btn-editar" data-id="${depto.id}" title="Editar departamento">✏️</button>
                        <button class="btn-delete btn-eliminar" data-id="${depto.id}" title="Eliminar departamento">🗑️</button>
                    </div>
                </td>
            `;
            this.tablaBody.appendChild(tr);
        });
    }

    filtrar() {
        const query = (this.buscador ? this.buscador.value : '').toLowerCase().trim();
        const filtrados = this.departamentos.filter(d => 
            d.nombre.toLowerCase().includes(query) || 
            (d.descripcion && d.descripcion.toLowerCase().includes(query))
        );
        this.renderizar(filtrados);
    }

    mostrarModalCrear() {
        this.formulario.reset();
        this.inputId.value = '';
        this.modalTitulo.textContent = 'Registrar Departamento';
        this.modal.style.display = 'flex';
        this.modal.classList.add('activo');
        this.inputNombre.focus();
    }

    mostrarModalEditar(id) {
        const depto = this.departamentos.find(d => Number(d.id) === Number(id));
        if (!depto) return;

        this.inputId.value = depto.id;
        this.inputNombre.value = depto.nombre;
        this.inputDescripcion.value = depto.descripcion || '';
        this.modalTitulo.textContent = 'Editar Departamento';

        this.modal.style.display = 'flex';
        this.modal.classList.add('activo');
        this.inputNombre.focus();
    }

    cerrarModal() {
        this.modal.style.display = 'none';
        this.modal.classList.remove('activo');
        this.formulario.reset();
    }

    async guardar(evento) {
        evento.preventDefault();
        const id = this.inputId.value;
        const nombre = this.inputNombre.value.trim();
        const descripcion = this.inputDescripcion.value.trim();

        if (!nombre) {
            Notificador.error('El nombre del departamento es obligatorio');
            return;
        }

        try {
            if (id) {
                await actualizarDepartamento(id, { nombre, descripcion });
                Notificador.exito('Departamento actualizado correctamente');
            } else {
                await crearDepartamento({ nombre, descripcion });
                Notificador.exito('Departamento registrado con éxito');
            }
            this.cerrarModal();
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    async eliminar(id) {
        const depto = this.departamentos.find(d => Number(d.id) === Number(id));
        const nombre = depto ? depto.nombre : `#${id}`;

        const confirmado = await Notificador.confirmar(`¿Estás seguro de que deseas eliminar el departamento "${nombre}"?`);
        if (!confirmado) return;

        try {
            await eliminarDepartamento(id);
            Notificador.exito('Departamento eliminado correctamente');
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    #manejarAccionesTabla(evento) {
        const btnEditar = evento.target.closest('.btn-editar');
        const btnEliminar = evento.target.closest('.btn-eliminar');

        if (btnEditar) {
            const id = btnEditar.getAttribute('data-id');
            this.mostrarModalEditar(id);
        }

        if (btnEliminar) {
            const id = btnEliminar.getAttribute('data-id');
            this.eliminar(id);
        }
    }
}
