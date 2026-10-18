import { obtenerEmpleados, obtenerDepartamentos, obtenerNominas } from '../api.js';
import Notificador from '../utilidades/Notificador.js';

/**
 * GestorEstadisticas
 * Clase encargada de recopilar los totales de empleados, departamentos y nóminas,
 * y renderizar los gráficos visuales de analítica con Chart.js.
 */
export default class GestorEstadisticas {
    constructor(contenedor) {
        this.contenedor = contenedor;
        this.#capturarElementosDOM();
    }

    #capturarElementosDOM() {
        this.totalEmpleadosSpan = this.contenedor.querySelector('#totalEmpleados');
        this.totalDeptosSpan = this.contenedor.querySelector('#totalDepartamentos');
        this.totalNominasSpan = this.contenedor.querySelector('#totalNominas');
        this.gastoTotalSpan = this.contenedor.querySelector('#gastoTotal');

        this.canvasCargos = this.contenedor.querySelector('#cargosChart');
        this.canvasSueldos = this.contenedor.querySelector('#sueldosChart');
        this.canvasHoras = this.contenedor.querySelector('#horasExtrasChart');
        this.canvasComparativa = this.contenedor.querySelector('#comparativaConceptosChart');
    }

    async cargarMetricas() {
        try {
            const [empleados, departamentos, nominas] = await Promise.all([
                obtenerEmpleados().catch(() => []),
                obtenerDepartamentos().catch(() => []),
                obtenerNominas().catch(() => [])
            ]);

            if (this.totalEmpleadosSpan) this.totalEmpleadosSpan.textContent = empleados.length;
            if (this.totalDeptosSpan) this.totalDeptosSpan.textContent = departamentos.length;
            if (this.totalNominasSpan) this.totalNominasSpan.textContent = nominas.length;

            const sumaSueldos = empleados.reduce((acc, e) => acc + (Number(e.sueldoBase) || 0), 0);
            if (this.gastoTotalSpan) this.gastoTotalSpan.textContent = Notificador.formatearMoneda(sumaSueldos);

            this.#renderizarGraficos(empleados, departamentos);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    #renderizarGraficos(empleados, departamentos) {
        if (!this.canvasCargos || !this.canvasSueldos || !this.canvasHoras || !this.canvasComparativa) return;

        // Limpiar gráficos previos para evitar colisiones
        if (window.cargosChartInstance) window.cargosChartInstance.destroy();
        if (window.sueldosChartInstance) window.sueldosChartInstance.destroy();
        if (window.horasExtrasChartInstance) window.horasExtrasChartInstance.destroy();
        if (window.comparativaConceptosChartInstance) window.comparativaConceptosChartInstance.destroy();

        const esNocturno = document.body.classList.contains('night-mode');
        const colorTexto = esNocturno ? '#cbd5e1' : '#475569';
        const colorGrid = esNocturno ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

        // 1. Distribución por Departamento
        const deptoMap = {};
        departamentos.forEach(d => { deptoMap[d.id] = d.nombre; });

        const distDeptos = {};
        empleados.forEach(emp => {
            const dName = (emp.departamento_id && deptoMap[emp.departamento_id]) || 'General';
            distDeptos[dName] = (distDeptos[dName] || 0) + 1;
        });

        const labelsDeptos = Object.keys(distDeptos).length ? Object.keys(distDeptos) : ['General'];
        const dataDeptos = Object.keys(distDeptos).length ? Object.values(distDeptos) : [empleados.length];
        const colores = ['#1e3c72', '#2a5298', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

        window.cargosChartInstance = new Chart(this.canvasCargos, {
            type: 'doughnut',
            data: {
                labels: labelsDeptos,
                datasets: [{
                    data: dataDeptos,
                    backgroundColor: colores.slice(0, labelsDeptos.length),
                    borderWidth: esNocturno ? 1 : 2,
                    borderColor: esNocturno ? '#1e293b' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: colorTexto, font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });

        // 2. Sueldos por Empleado
        const labelsSueldos = empleados.map(emp => emp.nombre.split(' ')[0] + ' (' + emp.cedula.slice(-4) + ')');
        const dataSueldos = empleados.map(emp => Number(emp.sueldoBase) || 0);

        window.sueldosChartInstance = new Chart(this.canvasSueldos, {
            type: 'bar',
            data: {
                labels: labelsSueldos,
                datasets: [{
                    label: 'Sueldo Base (Bs)',
                    data: dataSueldos,
                    backgroundColor: esNocturno ? '#38bdf8' : '#1e3c72',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colorTexto, font: { size: 10 } } },
                    y: { grid: { color: colorGrid }, ticks: { color: colorTexto, font: { size: 10 } } }
                }
            }
        });

        // 3. Ranking de Horas Extras
        const empsHE = [...empleados].sort((a, b) => (b.horasExtras || 0) - (a.horasExtras || 0));
        const labelsHE = empsHE.map(emp => emp.nombre.split(' ')[0]);
        const dataHE = empsHE.map(emp => emp.horasExtras || 0);

        window.horasExtrasChartInstance = new Chart(this.canvasHoras, {
            type: 'bar',
            data: {
                labels: labelsHE,
                datasets: [{
                    label: 'Horas Extras',
                    data: dataHE,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: colorGrid }, ticks: { color: colorTexto, stepSize: 1 } },
                    y: { grid: { display: false }, ticks: { color: colorTexto } }
                }
            }
        });

        // 4. Comparativa Asignaciones vs Deducciones
        let totAsig = 0;
        let totDeduc = 0;
        empleados.forEach(e => {
            const sb = Number(e.sueldoBase) || 0;
            const he = Number(e.horasExtras) || 0;
            const pagoHE = he * ((sb / 240) * 1.5);
            totAsig += (sb + pagoHE + 1000);
            totDeduc += (sb * 0.06);
        });

        window.comparativaConceptosChartInstance = new Chart(this.canvasComparativa, {
            type: 'bar',
            data: {
                labels: ['Asignaciones Estimadas', 'Deducciones de Ley'],
                datasets: [{
                    data: [totAsig, totDeduc],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colorTexto, font: { weight: '600' } } },
                    y: { 
                        grid: { color: colorGrid }, 
                        ticks: { color: colorTexto, callback: (v) => v.toLocaleString('es-VE') + ' Bs' } 
                    }
                }
            }
        });
    }
}
