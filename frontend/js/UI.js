import { obtenerEmpleados, crearEmpleado, actualizarEmpleado, eliminarEmpleado } from './api.js';
import Empleado from './Empleado.js';

export default class UI {
    constructor(container) {
        this.container = container;
        this.empleados = [];
        this.modoEdicion = false;
        this.cedulaEditando = null;
        this.procesandoFormulario = false; // Bandera para evitar el doble disparo síncrono

        // Enlazar métodos para evitar duplicación de event listeners
        this.handleSubmit = this.handleSubmit.bind(this);
        this.cancelarEdicion = this.cancelarEdicion.bind(this);
        this.handleAgregarEmpleado = this.handleAgregarEmpleado.bind(this);
        this.handleBuscadorInput = this.handleBuscadorInput.bind(this);
        this.handleTablaBodyClick = this.handleTablaBodyClick.bind(this);

        this.initElementosDOM();
        this.registrarEventos();
        this.cargarEmpleados();
    }

    initElementosDOM() {
        this.tablaBody = this.container.querySelector('#tablaBody');
        this.buscador = this.container.querySelector('#buscador');
        this.btnAgregarEmpleado = this.container.querySelector('#btnAgregarEmpleado');
        
        // Elementos del formulario
        this.form = this.container.querySelector('#empleadoForm');
        this.nombreInput = this.container.querySelector('#nombre');
        this.cedulaInput = this.container.querySelector('#cedula');
        this.cargoInput = this.container.querySelector('#cargo');
        this.sueldoInput = this.container.querySelector('#sueldo');
        this.horasExtrasInput = this.container.querySelector('#horasExtras');
        this.fotoInput = this.container.querySelector('#foto');
        this.errorDiv = this.container.querySelector('#mensajeError');
        this.formTitle = this.container.querySelector('#formTitle');
        this.btnGuardar = this.container.querySelector('#btnGuardar');
        this.btnCancelar = this.container.querySelector('#btnCancelar');

        // Elementos de Modales y Toasts globales del documento
        this.toastContainer = document.getElementById('toast-container');
        this.confirmModal = document.getElementById('confirm-modal');
        this.confirmModalMsg = document.getElementById('confirm-modal-msg');
        this.btnModalCancelar = document.getElementById('btn-modal-cancelar');
        this.btnModalConfirmar = document.getElementById('btn-modal-confirmar');

        // Modal Detalle
        this.detalleModal = document.getElementById('detalle-modal');
        this.detalleModalBody = document.getElementById('detalle-modal-body');
        this.btnDetalleCerrar = document.getElementById('btn-detalle-cerrar');
    }

    handleAgregarEmpleado() {
        window.empleadoEditando = null;
        window.cargarVista('empleado-form');
    }

    handleBuscadorInput() {
        this.filtrarEmpleados();
    }

    async handleTablaBodyClick(e) {
        const btnDetail = e.target.closest('.btn-detalle');
        const btnEdit = e.target.closest('.btn-editar');
        const btnDelete = e.target.closest('.btn-eliminar');

        if (btnDetail) {
            const id = btnDetail.getAttribute('data-cedula');
            this.mostrarDetalle(id);
        }

        if (btnEdit) {
            const id = btnEdit.getAttribute('data-cedula');
            this.prepararEdicion(id);
        }

        if (btnDelete) {
            const id = btnDelete.getAttribute('data-cedula');
            await this.manejarEliminacion(id);
        }
    }

    registrarEventos() {
        if (this.btnAgregarEmpleado) {
            this.btnAgregarEmpleado.removeEventListener('click', this.handleAgregarEmpleado);
            this.btnAgregarEmpleado.addEventListener('click', this.handleAgregarEmpleado);
        }

        if (this.buscador) {
            this.buscador.removeEventListener('input', this.handleBuscadorInput);
            this.buscador.addEventListener('input', this.handleBuscadorInput);
        }

        if (this.form) {
            this.form.removeEventListener('submit', this.handleSubmit);
            this.form.addEventListener('submit', this.handleSubmit);
        }

        if (this.btnCancelar) {
            this.btnCancelar.removeEventListener('click', this.cancelarEdicion);
            this.btnCancelar.addEventListener('click', this.cancelarEdicion);
        }

        if (this.tablaBody) {
            this.tablaBody.removeEventListener('click', this.handleTablaBodyClick);
            this.tablaBody.addEventListener('click', this.handleTablaBodyClick);
        }

        if (this.btnDetalleCerrar && this.detalleModal) {
            this.btnDetalleCerrar.removeEventListener('click', this.cerrarDetalle.bind(this));
            this.btnDetalleCerrar.addEventListener('click', this.cerrarDetalle.bind(this));
        }
    }

    cerrarDetalle() {
        if (this.detalleModal) {
            this.detalleModal.classList.remove('activo');
        }
    }

    lanzarToast(mensaje, tipo = 'info') {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast-alerta ${tipo}`;
        
        let icono = 'ℹ️';
        if (tipo === 'exito') icono = '✅';
        if (tipo === 'error') icono = '❌';

        toast.innerHTML = `<span>${icono}</span> <span>${mensaje}</span>`;
        this.toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('mostrar'), 10);

        setTimeout(() => {
            toast.classList.remove('mostrar');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    mostrarConfirmacionModal(mensaje) {
        return new Promise((resolve) => {
            if (!this.confirmModal) return resolve(false);

            this.confirmModalMsg.textContent = mensaje;
            this.confirmModal.classList.add('activo');

            const alConfirmar = () => { limpiarEventos(); resolve(true); };
            const alCancelar = () => { limpiarEventos(); resolve(false); };

            const limpiarEventos = () => {
                this.btnModalConfirmar.removeEventListener('click', alConfirmar);
                this.btnModalCancelar.removeEventListener('click', alCancelar);
                this.confirmModal.classList.remove('activo');
            };

            this.btnModalConfirmar.addEventListener('click', alConfirmar);
            this.btnModalCancelar.addEventListener('click', alCancelar);
        });
    }

    async cargarEmpleados() {
        if (!this.tablaBody) return;
        try {
            this.empleados = await obtenerEmpleados();
            this.renderizarTabla(this.empleados);
        } catch (error) {
            this.mostrarMensajeTabla(`❌ Error al cargar: ${error.message}`);
            this.lanzarToast(error.message, 'error');
        }
    }

    renderizarTabla(lista) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';

        if (lista.length === 0) {
            this.mostrarMensajeTabla('No se encontraron empleados.');
            return;
        }

        const getInitials = (nombre) => {
            const parts = nombre.trim().split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return parts[0] ? parts[0][0].toUpperCase() : '?';
        };

        lista.forEach(emp => {
            const tr = document.createElement('tr');
            const sueldoNetoNum = Number(emp.sueldoNeto) || 0; 
            
            tr.innerHTML = `
                <td>
                    <div class="employee-cell">
                        ${emp.foto 
                            ? `<img src="/api/empleados/foto/${emp.foto}" class="employee-thumb" alt="Foto">` 
                            : `<div class="employee-avatar-placeholder">${getInitials(emp.nombre)}</div>`
                        }
                        <span class="employee-name">${emp.nombre}</span>
                    </div>
                </td>
                <td>${emp.cedula}</td>
                <td>${emp.cargo}</td>
                <td>${sueldoNetoNum.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</td>
                <td>
                    <button class="btn-detail btn-detalle" data-cedula="${emp.cedula}">👁️ Detalle</button>
                    <button class="btn-edit btn-editar" data-cedula="${emp.cedula}">✏️ Editar</button>
                    <button class="btn-delete btn-eliminar" data-cedula="${emp.cedula}">🗑️ Eliminar</button>
                </td>
            `;
            this.tablaBody.appendChild(tr);
        });
    }

    mostrarMensajeTabla(mensaje) {
        if (this.tablaBody) {
            this.tablaBody.innerHTML = `<tr class="fila-vacia"><td colspan="5">${mensaje}</td></tr>`;
        }
    }

    filtrarEmpleados() {
        const query = this.buscador.value.toLowerCase().trim();
        const filtrados = this.empleados.filter(emp => 
            emp.nombre.toLowerCase().includes(query) || 
            emp.cedula.toLowerCase().includes(query)
        );
        this.renderizarTabla(filtrados);
    }

    async manejarEliminacion(id) {
        if (!id || id === 'undefined') {
            this.lanzarToast('ID inválido detectado para la eliminación.', 'error');
            return;
        }

        const emp = this.empleados.find(e => e.cedula === id);
        const nombreEmp = emp ? emp.nombre : 'este empleado';

        const confirmado = await this.mostrarConfirmacionModal(`¿Estás seguro de que deseas eliminar a ${nombreEmp}?`);
        
        if (confirmado) {
            try {
                await eliminarEmpleado(id);
                this.empleados = this.empleados.filter(e => e.cedula !== id);
                this.renderizarTabla(this.empleados);
                this.lanzarToast(`${nombreEmp} eliminado correctamente`, 'exito');
            } catch (error) {
                this.lanzarToast('Error al eliminar: ' + error.message, 'error');
            }
        }
    }

    prepararEdicion(id) {
        const emp = this.empleados.find(e => e.cedula === id);
        if (emp) {
            window.empleadoEditando = emp;
            window.cargarVista('empleado-form');
        }
    }

    mostrarDetalle(id) {
        const emp = this.empleados.find(e => e.cedula === id);
        if (!emp) return;

        const getInitials = (nombre) => {
            const parts = nombre.trim().split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return parts[0] ? parts[0][0].toUpperCase() : '?';
        };

        const formatBs = (num) => {
            return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
        };

        if (this.detalleModalBody) {
            this.detalleModalBody.innerHTML = `
                <div class="receipt-profile">
                    ${emp.foto 
                        ? `<img src="/api/empleados/foto/${emp.foto}" class="receipt-avatar" alt="Foto">` 
                        : `<div class="receipt-avatar-placeholder">${getInitials(emp.nombre)}</div>`
                    }
                    <div class="receipt-info">
                        <h4>${emp.nombre}</h4>
                        <p><strong>Cédula:</strong> ${emp.cedula}</p>
                        <p><strong>Cargo:</strong> ${emp.cargo}</p>
                    </div>
                </div>
                
                <div class="receipt-divider"></div>
                
                <table class="receipt-table">
                    <thead>
                        <tr>
                            <th>Concepto / Descripción</th>
                            <th class="text-right">Asignaciones (+)</th>
                            <th class="text-right">Deducciones (-)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Sueldo Base Mensual</td>
                            <td class="text-right">${formatBs(emp.sueldoBase)}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Horas Extras (${emp.horasExtras}h × ${formatBs(emp.valorHoraExtra)}/h)</td>
                            <td class="text-right">${formatBs(emp.pagoHorasExtras)}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Bono Fijo de Alimentación/Asistencia</td>
                            <td class="text-right">${formatBs(emp.bonoFijo)}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Retención de Ley IVSS (4%)</td>
                            <td></td>
                            <td class="text-right text-danger">-${formatBs(emp.ivss)}</td>
                        </tr>
                        <tr>
                            <td>Retención de Ley Paro Forzoso (1%)</td>
                            <td></td>
                            <td class="text-right text-danger">-${formatBs(emp.paroForzoso)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr class="receipt-total-row">
                            <th>Sueldo Neto a Pagar</th>
                            <th colspan="2" class="text-right text-success">${formatBs(emp.sueldoNeto)}</th>
                        </tr>
                    </tfoot>
                </table>
            `;
        }
        
        if (this.detalleModal) {
            this.detalleModal.classList.add('activo');
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.procesandoFormulario) return;

        this.limpiarError();

        const nombre = this.nombreInput.value.trim();
        const cargo = this.cargoInput.value.trim();
        const sueldoBase = parseFloat(this.sueldoInput.value);
        const horasExtras = parseInt(this.horasExtrasInput.value || 0, 10);
        const cedula = this.modoEdicion ? '' : this.cedulaInput.value.trim();

        let errores = [];
        const errorNombre = Empleado.validarNombre(nombre);
        if (errorNombre) errores.push(errorNombre);
        const errorSueldo = Empleado.validarSueldo(sueldoBase);
        if (errorSueldo) errores.push(errorSueldo);
        const errorHoras = Empleado.validarHorasExtras(horasExtras);
        if (errorHoras) errores.push(errorHoras);
        const errorCargo = Empleado.validarCargo(cargo);
        if (errorCargo) errores.push(errorCargo);
        
        if (!this.modoEdicion) {
            const errorCedula = Empleado.validarCedula(cedula);
            if (errorCedula) errores.push(errorCedula);
        }

        if (errores.length > 0) {
            this.mostrarError(errores.join('. '));
            this.lanzarToast('Revisa los errores en el formulario', 'error');
            return;
        }

        // Compilar FormData
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('cargo', cargo);
        formData.append('sueldoBase', sueldoBase);
        formData.append('horasExtras', horasExtras);
        
        if (!this.modoEdicion) {
            formData.append('cedula', cedula);
        }

        if (this.fotoInput && this.fotoInput.files.length > 0) {
            formData.append('foto', this.fotoInput.files[0]);
        }

        try {
            this.procesandoFormulario = true;
            if (this.btnGuardar) this.btnGuardar.disabled = true;

            if (this.modoEdicion && this.cedulaEditando) {
                const empleadoEditado = await actualizarEmpleado(this.cedulaEditando, formData);
                const index = this.empleados.findIndex(emp => emp.cedula === this.cedulaEditando);
                if (index !== -1) {
                    this.empleados[index] = empleadoEditado;
                }
                this.lanzarToast('Empleado actualizado correctamente', 'exito');
            } else {
                const nuevoEmpleado = await crearEmpleado(formData);
                this.empleados.push(nuevoEmpleado);
                this.lanzarToast('Empleado registrado correctamente', 'exito');
            }
            
            window.empleadoEditando = null;
            this.cancelarEdicion();
        } catch (error) {
            this.mostrarError(error.message);
            this.lanzarToast(error.message, 'error');
        } finally {
            this.procesandoFormulario = false;
            if (this.btnGuardar) this.btnGuardar.disabled = false;
        }
    }

    cancelarEdicion() {
        this.resetearFormulario();
        window.cargarVista('empleados');
    }

    resetearFormulario() {
        this.modoEdicion = false;
        this.cedulaEditando = null;
        window.empleadoEditando = null;
        if (this.form) this.form.reset();
        if (this.cedulaInput) {
            this.cedulaInput.readOnly = false;
            this.cedulaInput.style.backgroundColor = '';
            this.cedulaInput.style.color = '';
            this.cedulaInput.style.cursor = '';
        }
        if (this.horasExtrasInput) {
            this.horasExtrasInput.value = 0;
        }
        if (this.formTitle) this.formTitle.textContent = 'Registrar Empleado';
        if (this.btnGuardar) this.btnGuardar.textContent = 'Guardar';
        if (this.btnCancelar) this.btnCancelar.style.display = 'none';
        this.limpiarError();
    }

    mostrarError(mensaje) {
        if (this.errorDiv) {
            this.errorDiv.textContent = mensaje;
            this.errorDiv.style.display = 'block';
        }
    }

    limpiarError() {
        if (this.errorDiv) {
            this.errorDiv.textContent = '';
            this.errorDiv.style.display = 'none';
        }
    }
}

