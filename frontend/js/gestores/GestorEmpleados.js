import {
    obtenerEmpleados,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    obtenerDepartamentos
} from '../api.js';
import Notificador from '../utilidades/Notificador.js';
import Empleado from '../Empleado.js';

/**
 * GestorEmpleados
 * Clase controladora para la vista y formulario de Empleados.
 */
export default class GestorEmpleados {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.empleados = [];
        this.departamentos = [];
        this.modoEdicion = false;
        this.cedulaEditando = null;

        this.#capturarElementosDOM();
        this.inicializarEventos();
    }

    #capturarElementosDOM() {
        // Elementos de la lista
        this.tablaBody = this.contenedor.querySelector('#tablaBody');
        this.buscador = this.contenedor.querySelector('#buscador');
        this.filtroDepartamento = this.contenedor.querySelector('#filtroDepartamento');
        this.btnAgregar = this.contenedor.querySelector('#btnAgregarEmpleado');

        // Elementos del formulario (cuando la vista es empleado-form)
        this.formulario = this.contenedor.querySelector('#empleadoForm');
        this.nombreInput = this.contenedor.querySelector('#nombre');
        this.cedulaInput = this.contenedor.querySelector('#cedula');
        this.cargoInput = this.contenedor.querySelector('#cargo');
        this.deptoSelect = this.contenedor.querySelector('#departamento_id');
        this.sueldoInput = this.contenedor.querySelector('#sueldo');
        this.horasExtrasInput = this.contenedor.querySelector('#horasExtras');
        this.fotoInput = this.contenedor.querySelector('#foto');
        this.fotoPreviewContainer = this.contenedor.querySelector('#fotoPreviewContainer');
        this.fotoPreview = this.contenedor.querySelector('#fotoPreview');
        this.formTitle = this.contenedor.querySelector('#formTitle');
        this.btnGuardar = this.contenedor.querySelector('#btnGuardar');
        this.btnCancelar = this.contenedor.querySelector('#btnCancelar');
        this.btnVolver = this.contenedor.querySelector('#btnVolverEmpleados');
        this.errorDiv = this.contenedor.querySelector('#mensajeError');

        // Modal de Comprobante / Recibo Detallado (en dashboard global)
        this.detalleModal = document.getElementById('detalle-modal');
        this.detalleModalBody = document.getElementById('detalle-modal-body');
        this.btnDetalleCerrar = document.getElementById('btn-detalle-cerrar');
        this.btnDetalleImprimir = document.getElementById('btn-detalle-imprimir');
    }

    inicializarEventos() {
        if (this.btnAgregar) {
            this.btnAgregar.addEventListener('click', () => {
                window.empleadoEditando = null;
                window.cargarVista('empleado-form');
            });
        }

        if (this.buscador) {
            this.buscador.addEventListener('input', () => this.filtrar());
        }

        if (this.filtroDepartamento) {
            this.filtroDepartamento.addEventListener('change', () => this.filtrar());
        }

        if (this.tablaBody) {
            this.tablaBody.addEventListener('click', (e) => this.#manejarAccionesTabla(e));
        }

        if (this.formulario) {
            this.formulario.addEventListener('submit', (e) => this.guardar(e));
        }

        if (this.fotoInput) {
            this.fotoInput.addEventListener('change', (e) => this.#manejarPreviewFoto(e));
        }

        if (this.btnCancelar) {
            this.btnCancelar.addEventListener('click', () => window.cargarVista('empleados'));
        }

        if (this.btnVolver) {
            this.btnVolver.addEventListener('click', () => window.cargarVista('empleados'));
        }

        if (this.btnDetalleCerrar && this.detalleModal) {
            this.btnDetalleCerrar.onclick = () => this.cerrarModalDetalle();
        }

        if (this.btnDetalleImprimir && this.detalleModal) {
            this.btnDetalleImprimir.onclick = () => window.print();
        }
    }

    async cargarListado() {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="7">Cargando nómina de empleados...</td></tr>';

        try {
            const [deptos, emps] = await Promise.all([
                obtenerDepartamentos().catch(() => []),
                obtenerEmpleados()
            ]);
            this.departamentos = deptos;
            this.empleados = emps;

            this.#poblarFiltroDepartamentos();
            this.renderizar(this.empleados);
        } catch (error) {
            this.tablaBody.innerHTML = `<tr class="fila-vacia"><td colspan="7" class="text-danger">Error: ${error.message}</td></tr>`;
            Notificador.error(error.message);
        }
    }

    #poblarFiltroDepartamentos() {
        if (!this.filtroDepartamento) return;
        const valorActual = this.filtroDepartamento.value;
        this.filtroDepartamento.innerHTML = '<option value="">Todos los Departamentos</option>';
        this.departamentos.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.nombre;
            this.filtroDepartamento.appendChild(opt);
        });
        if (valorActual) this.filtroDepartamento.value = valorActual;
    }

    async cargarFormulario(empleado = null) {
        try {
            this.departamentos = await obtenerDepartamentos();
            if (this.deptoSelect) {
                this.deptoSelect.innerHTML = '<option value="">-- Sin departamento asignado --</option>';
                this.departamentos.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.nombre;
                    if (empleado && Number(empleado.departamento_id) === Number(d.id)) {
                        opt.selected = true;
                    }
                    this.deptoSelect.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('Error cargando departamentos:', e);
        }

        if (empleado) {
            this.modoEdicion = true;
            this.cedulaEditando = empleado.cedula;
            if (this.nombreInput) this.nombreInput.value = empleado.nombre || '';
            if (this.cedulaInput) {
                this.cedulaInput.value = empleado.cedula || '';
                this.cedulaInput.readOnly = true;
                this.cedulaInput.style.backgroundColor = '#f1f5f9';
                this.cedulaInput.style.color = '#64748b';
                this.cedulaInput.style.cursor = 'not-allowed';
            }
            if (this.cargoInput) this.cargoInput.value = empleado.cargo || '';
            if (this.sueldoInput) this.sueldoInput.value = empleado.sueldoBase || '';
            if (this.horasExtrasInput) this.horasExtrasInput.value = empleado.horasExtras || 0;

            if (empleado.foto && this.fotoPreviewContainer && this.fotoPreview) {
                this.fotoPreview.src = `/api/empleados/foto/${empleado.foto}`;
                this.fotoPreviewContainer.style.display = 'block';
            }

            if (this.formTitle) this.formTitle.textContent = 'Editar Empleado';
            if (this.btnGuardar) this.btnGuardar.textContent = 'Actualizar Datos';
            if (this.btnCancelar) this.btnCancelar.style.display = 'inline-block';
        }
    }

    renderizar(lista) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';

        if (!lista || lista.length === 0) {
            this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="7">No se encontraron empleados registrados.</td></tr>';
            return;
        }

        const mapaDeptos = {};
        this.departamentos.forEach(d => { mapaDeptos[d.id] = d.nombre; });

        const getIniciales = (nombre) => {
            const partes = (nombre || '').trim().split(/\s+/);
            if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
            return partes[0] ? partes[0][0].toUpperCase() : '?';
        };

        lista.forEach(emp => {
            const tr = document.createElement('tr');
            const deptoNombre = emp.departamento_id && mapaDeptos[emp.departamento_id]
                ? mapaDeptos[emp.departamento_id]
                : 'General';

            tr.innerHTML = `
                <td>
                    <div class="employee-cell">
                        ${emp.foto 
                            ? `<img src="/api/empleados/foto/${emp.foto}" class="employee-thumb" alt="Foto">` 
                            : `<div class="employee-avatar-placeholder">${getIniciales(emp.nombre)}</div>`
                        }
                        <div>
                            <span class="employee-name">${emp.nombre}</span>
                            <span class="employee-meta-mobile">${emp.cargo} • ${deptoNombre}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge badge-cedula">${emp.cedula}</span></td>
                <td>${emp.cargo}</td>
                <td><span class="badge badge-dept">${deptoNombre}</span></td>
                <td class="text-right font-medium">${Notificador.formatearMoneda(emp.sueldoBase)}</td>
                <td class="text-center"><span class="badge badge-he">${emp.horasExtras || 0} hrs</span></td>
                <td class="text-right">
                    <div class="action-buttons-group">
                        <button class="btn-detail btn-detalle" data-cedula="${emp.cedula}" title="Ver cálculo y recibo">👁️ Recibo</button>
                        <button class="btn-edit btn-editar" data-cedula="${emp.cedula}" title="Editar ficha">✏️</button>
                        <button class="btn-delete btn-eliminar" data-cedula="${emp.cedula}" title="Eliminar empleado">🗑️</button>
                    </div>
                </td>
            `;
            this.tablaBody.appendChild(tr);
        });
    }

    filtrar() {
        const query = (this.buscador ? this.buscador.value : '').toLowerCase().trim();
        const deptoFiltro = this.filtroDepartamento ? this.filtroDepartamento.value : '';

        const filtrados = this.empleados.filter(emp => {
            const coincideTexto = !query ||
                (emp.nombre && emp.nombre.toLowerCase().includes(query)) ||
                (emp.cedula && emp.cedula.toLowerCase().includes(query)) ||
                (emp.cargo && emp.cargo.toLowerCase().includes(query));

            const coincideDepto = !deptoFiltro || String(emp.departamento_id) === String(deptoFiltro);
            return coincideTexto && coincideDepto;
        });

        this.renderizar(filtrados);
    }

    mostrarComprobante(cedula) {
        const emp = this.empleados.find(e => e.cedula === cedula);
        if (!emp || !this.detalleModalBody) return;

        const depto = this.departamentos.find(d => Number(d.id) === Number(emp.departamento_id));
        const deptoNombre = depto ? depto.nombre : 'General / Operaciones';

        const sueldoBase = Number(emp.sueldoBase) || 0;
        const horasExtras = Number(emp.horasExtras) || 0;
        const pagoHorasExtras = horasExtras * ((sueldoBase / 240) * 1.5);
        const bonoFijo = 1000;
        const ivss = sueldoBase * 0.04;
        const paro = sueldoBase * 0.01;
        const faov = sueldoBase * 0.01;
        const totalDeducciones = ivss + paro + faov;
        const sueldoNeto = sueldoBase + pagoHorasExtras + bonoFijo - totalDeducciones;

        this.detalleModalBody.innerHTML = `
            <div class="receipt-profile">
                <div class="receipt-avatar-placeholder">${(emp.nombre || 'E').substring(0, 2).toUpperCase()}</div>
                <div class="receipt-info">
                    <h4>${emp.nombre}</h4>
                    <p><strong>Cédula:</strong> ${emp.cedula} • <strong>Cargo:</strong> ${emp.cargo}</p>
                    <p><strong>Departamento:</strong> ${deptoNombre} • <strong>Régimen:</strong> Sueldo Mensual de Ley</p>
                </div>
            </div>
            
            <div class="receipt-divider"></div>
            
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Concepto Salarial</th>
                        <th class="text-center">Unidad / %</th>
                        <th class="text-right">Asignaciones (+)</th>
                        <th class="text-right">Deducciones (-)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Sueldo Base Mensual</td>
                        <td class="text-center">30 Días</td>
                        <td class="text-right font-medium">${Notificador.formatearMoneda(sueldoBase)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Horas Extras Diurnas</td>
                        <td class="text-center">${horasExtras} hrs</td>
                        <td class="text-right font-medium">${Notificador.formatearMoneda(pagoHorasExtras)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Bono de Alimentación y Asistencia</td>
                        <td class="text-center">Fijo</td>
                        <td class="text-right font-medium">${Notificador.formatearMoneda(bonoFijo)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Retención de Ley IVSS</td>
                        <td class="text-center">4.0%</td>
                        <td></td>
                        <td class="text-right text-danger">-${Notificador.formatearMoneda(ivss)}</td>
                    </tr>
                    <tr>
                        <td>Retención Paro Forzoso / RPE</td>
                        <td class="text-center">1.0%</td>
                        <td></td>
                        <td class="text-right text-danger">-${Notificador.formatearMoneda(paro)}</td>
                    </tr>
                    <tr>
                        <td>Aporte Habitacional FAOV</td>
                        <td class="text-center">1.0%</td>
                        <td></td>
                        <td class="text-right text-danger">-${Notificador.formatearMoneda(faov)}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="receipt-subtotal-row">
                        <th colspan="2">Subtotales</th>
                        <th class="text-right text-success">+${Notificador.formatearMoneda(sueldoBase + pagoHorasExtras + bonoFijo)}</th>
                        <th class="text-right text-danger">-${Notificador.formatearMoneda(totalDeducciones)}</th>
                    </tr>
                    <tr class="receipt-total-row">
                        <th colspan="2">TOTAL NETO A COBRAR</th>
                        <th colspan="2" class="text-right text-highlight">${Notificador.formatearMoneda(sueldoNeto)}</th>
                    </tr>
                </tfoot>
            </table>

            <div class="receipt-signatures-box">
                <div class="receipt-signature">
                    <div class="linea-firma"></div>
                    <span>Firma Empleado / C.I.</span>
                </div>
                <div class="receipt-signature">
                    <div class="linea-firma"></div>
                    <span>Sello Recursos Humanos</span>
                </div>
            </div>
        `;

        this.detalleModal.style.display = 'flex';
        this.detalleModal.classList.add('activo');
    }

    cerrarModalDetalle() {
        if (this.detalleModal) {
            this.detalleModal.style.display = 'none';
            this.detalleModal.classList.remove('activo');
        }
    }

    async guardar(evento) {
        evento.preventDefault();
        const nombre = this.nombreInput.value.trim();
        const cargo = this.cargoInput.value.trim();
        const sueldoBase = parseFloat(this.sueldoInput.value);
        const horasExtras = parseInt(this.horasExtrasInput.value || 0, 10);
        const departamento_id = this.deptoSelect ? this.deptoSelect.value : '';
        const cedula = this.modoEdicion ? this.cedulaEditando : this.cedulaInput.value.trim();

        // Validaciones del modelo
        const errores = Empleado.validarEmpleado({ nombre, cedula, cargo, sueldoBase, horasExtras });
        if (errores.length > 0) {
            if (this.errorDiv) {
                this.errorDiv.textContent = errores.join('. ');
                this.errorDiv.style.display = 'block';
            }
            Notificador.error('Por favor corrige los campos indicados');
            return;
        }

        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('cargo', cargo);
        formData.append('sueldoBase', sueldoBase);
        formData.append('horasExtras', horasExtras);
        if (departamento_id) formData.append('departamento_id', departamento_id);
        if (!this.modoEdicion) formData.append('cedula', cedula);

        if (this.fotoInput && this.fotoInput.files.length > 0) {
            formData.append('foto', this.fotoInput.files[0]);
        }

        try {
            if (this.btnGuardar) this.btnGuardar.disabled = true;

            if (this.modoEdicion) {
                await actualizarEmpleado(this.cedulaEditando, formData);
                Notificador.exito('Empleado actualizado con éxito');
            } else {
                await crearEmpleado(formData);
                Notificador.exito('Empleado registrado con éxito');
            }
            window.empleadoEditando = null;
            window.cargarVista('empleados');
        } catch (error) {
            if (this.errorDiv) {
                this.errorDiv.textContent = error.message;
                this.errorDiv.style.display = 'block';
            }
            Notificador.error(error.message);
        } finally {
            if (this.btnGuardar) this.btnGuardar.disabled = false;
        }
    }

    async eliminar(cedula) {
        const emp = this.empleados.find(e => e.cedula === cedula);
        const nombre = emp ? emp.nombre : cedula;

        const confirmado = await Notificador.confirmar(`¿Estás seguro de que deseas eliminar permanentemente a "${nombre}"?`);
        if (!confirmado) return;

        try {
            await eliminarEmpleado(cedula);
            Notificador.exito('Empleado eliminado correctamente');
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    #manejarAccionesTabla(evento) {
        const btnDetalle = evento.target.closest('.btn-detalle');
        const btnEditar = evento.target.closest('.btn-editar');
        const btnEliminar = evento.target.closest('.btn-eliminar');

        if (btnDetalle) {
            const cedula = btnDetalle.getAttribute('data-cedula');
            this.mostrarComprobante(cedula);
        }

        if (btnEditar) {
            const cedula = btnEditar.getAttribute('data-cedula');
            const emp = this.empleados.find(e => e.cedula === cedula);
            if (emp) {
                window.empleadoEditando = emp;
                window.cargarVista('empleado-form');
            }
        }

        if (btnEliminar) {
            const cedula = btnEliminar.getAttribute('data-cedula');
            this.eliminar(cedula);
        }
    }

    #manejarPreviewFoto(e) {
        const archivo = e.target.files && e.target.files[0];
        if (archivo && this.fotoPreview && this.fotoPreviewContainer) {
            const lector = new FileReader();
            lector.onload = (evento) => {
                this.fotoPreview.src = evento.target.result;
                this.fotoPreviewContainer.style.display = 'block';
            };
            lector.readAsDataURL(archivo);
        }
    }
}
