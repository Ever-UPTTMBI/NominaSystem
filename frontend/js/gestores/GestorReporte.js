import { obtenerEmpleados } from '../api.js';
import Notificador from '../utilidades/Notificador.js';

/**
 * GestorReporte
 * Clase encargada de preparar y renderizar el reporte general consolidado de nómina con opción de impresión.
 */
export default class GestorReporte {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.#capturarElementosDOM();
        this.inicializarEventos();
    }

    #capturarElementosDOM() {
        this.dateSpan = this.contenedor.querySelector('#report-date');
        this.tablaBody = this.contenedor.querySelector('#reporteTablaBody');
        this.totalGeneralSpan = this.contenedor.querySelector('#reporteTotalGeneral');
        this.btnImprimir = this.contenedor.querySelector('#btnImprimirReporte');
    }

    inicializarEventos() {
        if (this.btnImprimir) {
            this.btnImprimir.addEventListener('click', () => window.print());
        }
    }

    async cargarReporte() {
        if (this.dateSpan) {
            this.dateSpan.textContent = new Date().toLocaleDateString('es-VE', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        }

        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '<tr><td colspan="8" class="text-center">Cargando reporte...</td></tr>';

        try {
            const empleados = await obtenerEmpleados();
            this.#renderizar(empleados);
        } catch (error) {
            this.tablaBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error: ${error.message}</td></tr>`;
            Notificador.error(error.message);
        }
    }

    #renderizar(empleados) {
        this.tablaBody.innerHTML = '';
        if (!empleados || empleados.length === 0) {
            this.tablaBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay empleados registrados.</td></tr>';
            if (this.totalGeneralSpan) this.totalGeneralSpan.textContent = '0.00 Bs';
            return;
        }

        let totalAcumulado = 0;

        empleados.forEach(emp => {
            const tr = document.createElement('tr');
            const sb = Number(emp.sueldoBase) || 0;
            const he = Number(emp.horasExtras) || 0;
            const pagoHE = he * ((sb / 240) * 1.5);
            const bono = 1000;
            const retenciones = sb * 0.06;
            const neto = sb + pagoHE + bono - retenciones;
            totalAcumulado += neto;

            tr.innerHTML = `
                <td><strong>${emp.nombre}</strong></td>
                <td><span class="badge badge-cedula">${emp.cedula}</span></td>
                <td>${emp.cargo}</td>
                <td class="text-right">${Notificador.formatearMoneda(sb)}</td>
                <td class="text-right">${Notificador.formatearMoneda(pagoHE)}</td>
                <td class="text-right">${Notificador.formatearMoneda(bono)}</td>
                <td class="text-right text-danger">-${Notificador.formatearMoneda(retenciones)}</td>
                <td class="text-right font-bold text-highlight">${Notificador.formatearMoneda(neto)}</td>
            `;
            this.tablaBody.appendChild(tr);
        });

        if (this.totalGeneralSpan) {
            this.totalGeneralSpan.textContent = Notificador.formatearMoneda(totalAcumulado);
        }
    }
}
