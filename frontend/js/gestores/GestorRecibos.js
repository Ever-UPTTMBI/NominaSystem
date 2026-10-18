import {
    obtenerRecibos,
    obtenerNominas,
    actualizarRecibo,
    eliminarRecibo
} from '../api.js';
import Notificador from '../utilidades/Notificador.js';

/**
 * GestorRecibos
 * Clase controladora para la visualización, ajuste e impresión de recibos de pago.
 */
export default class GestorRecibos {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.todosRecibos = [];
        this.nominasList = [];

        this.#capturarElementosDOM();
        this.inicializarEventos();
    }

    #capturarElementosDOM() {
        this.tablaBody = this.contenedor.querySelector('#tablaRecibosBody');
        this.selectNomina = this.contenedor.querySelector('#filtroNominaPeriodo');
        this.buscador = this.contenedor.querySelector('#buscadorRecibo');
        this.btnImprimirListado = this.contenedor.querySelector('#btnImprimirTodosRecibos');

        // Tarjetas de resumen
        this.statCount = this.contenedor.querySelector('#statRecibosCount');
        this.statAsig = this.contenedor.querySelector('#statTotalAsignaciones');
        this.statDeduc = this.contenedor.querySelector('#statTotalDeducciones');
        this.statNeto = this.contenedor.querySelector('#statTotalNeto');

        // Modal de Ajuste
        this.modalAjuste = this.contenedor.querySelector('#ajuste-recibo-modal');
        this.formularioAjuste = this.contenedor.querySelector('#ajusteReciboForm');
        this.inputAjusteId = this.contenedor.querySelector('#ajusteReciboId');
        this.inputDias = this.contenedor.querySelector('#ajusteDiasTrabajados');
        this.inputHE = this.contenedor.querySelector('#ajusteHorasExtras');
        this.inputBonos = this.contenedor.querySelector('#ajusteBonificaciones');
        this.inputDeduc = this.contenedor.querySelector('#ajusteDeducciones');
        this.btnAjusteCancelar = this.contenedor.querySelector('#btnAjusteCancelar');

        // Modal de Comprobante Individual (en dashboard global)
        this.detalleModal = document.getElementById('detalle-modal');
        this.detalleModalBody = document.getElementById('detalle-modal-body');
    }

    inicializarEventos() {
        if (this.selectNomina) {
            this.selectNomina.addEventListener('change', () => this.cargarListado());
        }

        if (this.buscador) {
            this.buscador.addEventListener('input', () => this.filtrar());
        }

        if (this.btnImprimirListado) {
            this.btnImprimirListado.addEventListener('click', () => window.print());
        }

        if (this.btnAjusteCancelar) {
            this.btnAjusteCancelar.addEventListener('click', () => this.cerrarModalAjuste());
        }

        if (this.formularioAjuste) {
            this.formularioAjuste.addEventListener('submit', (e) => this.guardarAjuste(e));
        }

        if (this.tablaBody) {
            this.tablaBody.addEventListener('click', (e) => this.#manejarAccionesTabla(e));
        }
    }

    async cargarListado() {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="9">Cargando recibos de nómina...</td></tr>';

        try {
            if (this.selectNomina && this.selectNomina.options.length <= 1) {
                await this.#poblarSelectorNominas();
            }

            const nominaId = this.selectNomina ? this.selectNomina.value : null;
            this.todosRecibos = await obtenerRecibos(nominaId || null);
            this.filtrar();
        } catch (error) {
            this.tablaBody.innerHTML = `<tr class="fila-vacia"><td colspan="9" class="text-danger">Error: ${error.message}</td></tr>`;
            Notificador.error(error.message);
        }
    }

    async #poblarSelectorNominas() {
        this.nominasList = await obtenerNominas().catch(() => []);
        this.selectNomina.innerHTML = '<option value="">Todos los Periodos</option>';
        this.nominasList.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.id;
            opt.textContent = `#${n.id} - ${n.periodo} (${n.estado})`;
            this.selectNomina.appendChild(opt);
        });

        if (window.filtroNominaSeleccionada) {
            this.selectNomina.value = window.filtroNominaSeleccionada;
            window.filtroNominaSeleccionada = null;
        }
    }

    filtrar() {
        const query = (this.buscador ? this.buscador.value : '').toLowerCase().trim();
        const filtrados = this.todosRecibos.filter(r => {
            const nombre = (r.empleado_nombre || '').toLowerCase();
            const cedula = (r.empleado_cedula || '').toLowerCase();
            const cargo = (r.cargo || '').toLowerCase();
            return !query || nombre.includes(query) || cedula.includes(query) || cargo.includes(query);
        });

        this.renderizar(filtrados);
        this.#actualizarResumenTotales(filtrados);
    }

    renderizar(lista) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';

        if (!lista || lista.length === 0) {
            this.tablaBody.innerHTML = '<tr class="fila-vacia"><td colspan="9">No se encontraron recibos de nómina. Genera recibos desde la pestaña "Nóminas".</td></tr>';
            return;
        }

        lista.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${r.id}</strong></td>
                <td>
                    <div class="employee-name">${r.empleado_nombre || 'Empleado'}</div>
                    <small class="text-muted">${r.empleado_cedula} • ${r.cargo || 'Cargo'}</small>
                </td>
                <td><span class="badge badge-dept">${r.nomina_periodo || 'Nómina #' + r.nomina_id}</span></td>
                <td class="text-right">${Notificador.formatearMoneda(r.sueldoQuincena)}</td>
                <td class="text-right">${Notificador.formatearMoneda(r.montoHorasExtras)}</td>
                <td class="text-right text-success">+${Notificador.formatearMoneda(r.bonificaciones)}</td>
                <td class="text-right text-danger">-${Notificador.formatearMoneda(r.deducciones)}</td>
                <td class="text-right font-bold text-highlight">${Notificador.formatearMoneda(r.totalNeto)}</td>
                <td class="text-right">
                    <div class="action-buttons-group">
                        <button class="btn-detail btn-ver" data-id="${r.id}" title="Ver e imprimir comprobante">👁️</button>
                        <button class="btn-edit btn-ajustar" data-id="${r.id}" title="Ajustar valores">✏️</button>
                        <button class="btn-delete btn-eliminar" data-id="${r.id}" title="Eliminar recibo">🗑️</button>
                    </div>
                </td>
            `;
            this.tablaBody.appendChild(tr);
        });
    }

    #actualizarResumenTotales(lista) {
        let totalAsignaciones = 0;
        let totalDeducciones = 0;
        let totalNeto = 0;

        lista.forEach(r => {
            const sq = Number(r.sueldoQuincena) || 0;
            const he = Number(r.montoHorasExtras) || 0;
            const bonos = Number(r.bonificaciones) || 0;
            const deduc = Number(r.deducciones) || 0;
            const neto = Number(r.totalNeto) || 0;

            totalAsignaciones += (sq + he + bonos);
            totalDeducciones += deduc;
            totalNeto += neto;
        });

        if (this.statCount) this.statCount.textContent = lista.length;
        if (this.statAsig) this.statAsig.textContent = Notificador.formatearMoneda(totalAsignaciones);
        if (this.statDeduc) this.statDeduc.textContent = Notificador.formatearMoneda(totalDeducciones);
        if (this.statNeto) this.statNeto.textContent = Notificador.formatearMoneda(totalNeto);
    }

    mostrarComprobante(reciboId) {
        const recibo = this.todosRecibos.find(r => Number(r.id) === Number(reciboId));
        if (!recibo || !this.detalleModalBody) return;

        const sq = Number(recibo.sueldoQuincena) || 0;
        const he = Number(recibo.montoHorasExtras) || 0;
        const bonos = Number(recibo.bonificaciones) || 0;
        const deduc = Number(recibo.deducciones) || 0;
        const neto = Number(recibo.totalNeto) || 0;

        const ivss = deduc * 0.67;
        const paro = deduc * 0.165;
        const faov = deduc * 0.165;

        this.detalleModalBody.innerHTML = `
            <div class="receipt-profile">
                <div class="receipt-avatar-placeholder">${(recibo.empleado_nombre || 'E').substring(0, 2).toUpperCase()}</div>
                <div class="receipt-info">
                    <h4>${recibo.empleado_nombre}</h4>
                    <p><strong>Cédula:</strong> ${recibo.empleado_cedula} • <strong>Cargo:</strong> ${recibo.cargo || 'N/A'}</p>
                    <p><strong>Periodo:</strong> ${recibo.nomina_periodo || 'Quincena'} • <strong>Días Liquidación:</strong> ${recibo.diasTrabajados || 15} días</p>
                </div>
            </div>

            <div class="receipt-divider"></div>

            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Concepto Liquidado</th>
                        <th class="text-center">Días / Hrs</th>
                        <th class="text-right">Asignaciones (+)</th>
                        <th class="text-right">Deducciones (-)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Sueldo Quincenal de Ley</td>
                        <td class="text-center">${recibo.diasTrabajados || 15} d</td>
                        <td class="text-right font-medium">${Notificador.formatearMoneda(sq)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Horas Extras Liquidadas</td>
                        <td class="text-center">${recibo.horasExtras || 0} hrs</td>
                        <td class="text-right font-medium">${Notificador.formatearMoneda(he)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Bono de Alimentación y Asistencia</td>
                        <td class="text-center">Quincenal</td>
                        <td class="text-right font-medium">${Notificador.formatearMoneda(bonos)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Retención Seguro Social (IVSS)</td>
                        <td class="text-center">4.0%</td>
                        <td></td>
                        <td class="text-right text-danger">-${Notificador.formatearMoneda(ivss)}</td>
                    </tr>
                    <tr>
                        <td>Retención Régimen Prestacional (RPE)</td>
                        <td class="text-center">1.0%</td>
                        <td></td>
                        <td class="text-right text-danger">-${Notificador.formatearMoneda(paro)}</td>
                    </tr>
                    <tr>
                        <td>Aporte Habitacional (FAOV)</td>
                        <td class="text-center">1.0%</td>
                        <td></td>
                        <td class="text-right text-danger">-${Notificador.formatearMoneda(faov)}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="receipt-subtotal-row">
                        <th colspan="2">Totales</th>
                        <th class="text-right text-success">+${Notificador.formatearMoneda(sq + he + bonos)}</th>
                        <th class="text-right text-danger">-${Notificador.formatearMoneda(deduc)}</th>
                    </tr>
                    <tr class="receipt-total-row">
                        <th colspan="2">NETO A TRANSFERIR</th>
                        <th colspan="2" class="text-right text-highlight">${Notificador.formatearMoneda(neto)}</th>
                    </tr>
                </tfoot>
            </table>

            <div class="receipt-signatures-box">
                <div class="receipt-signature">
                    <div class="linea-firma"></div>
                    <span>Recibí Conforme (Firma)</span>
                </div>
                <div class="receipt-signature">
                    <div class="linea-firma"></div>
                    <span>Autorizado (Recursos Humanos)</span>
                </div>
            </div>
        `;

        this.detalleModal.style.display = 'flex';
        this.detalleModal.classList.add('activo');
    }

    mostrarModalAjustar(reciboId) {
        const recibo = this.todosRecibos.find(r => Number(r.id) === Number(reciboId));
        if (!recibo || !this.modalAjuste) return;

        this.inputAjusteId.value = recibo.id;
        this.inputDias.value = recibo.diasTrabajados || 15;
        this.inputHE.value = recibo.horasExtras || 0;
        this.inputBonos.value = recibo.bonificaciones || 0;
        this.inputDeduc.value = recibo.deducciones || 0;

        this.modalAjuste.style.display = 'flex';
        this.modalAjuste.classList.add('activo');
    }

    cerrarModalAjuste() {
        if (this.modalAjuste) {
            this.modalAjuste.style.display = 'none';
            this.modalAjuste.classList.remove('activo');
            this.formularioAjuste.reset();
        }
    }

    async guardarAjuste(evento) {
        evento.preventDefault();
        const id = this.inputAjusteId.value;
        const payload = {
            diasTrabajados: parseInt(this.inputDias.value, 10),
            horasExtras: parseInt(this.inputHE.value, 10),
            bonificaciones: parseFloat(this.inputBonos.value),
            deducciones: parseFloat(this.inputDeduc.value)
        };

        try {
            await actualizarRecibo(id, payload);
            Notificador.exito('Recibo de pago ajustado correctamente');
            this.cerrarModalAjuste();
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    async eliminar(id) {
        const confirmado = await Notificador.confirmar(`¿Estás seguro de que deseas eliminar el recibo #${id}?`);
        if (!confirmado) return;

        try {
            await eliminarRecibo(id);
            Notificador.exito('Recibo eliminado');
            await this.cargarListado();
        } catch (error) {
            Notificador.error(error.message);
        }
    }

    #manejarAccionesTabla(evento) {
        const btnVer = evento.target.closest('.btn-ver');
        const btnAjustar = evento.target.closest('.btn-ajustar');
        const btnEliminar = evento.target.closest('.btn-eliminar');

        if (btnVer) {
            const id = btnVer.getAttribute('data-id');
            this.mostrarComprobante(id);
        }

        if (btnAjustar) {
            const id = btnAjustar.getAttribute('data-id');
            this.mostrarModalAjustar(id);
        }

        if (btnEliminar) {
            const id = btnEliminar.getAttribute('data-id');
            this.eliminar(id);
        }
    }
}
