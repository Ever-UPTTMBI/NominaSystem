import UI from './UI.js';
import { obtenerEmpleados } from './api.js';

let uiInstance = null;
let currentView = 'empleados';

window.cargarVista = cargarVista;

function guardarPreferencia(key, value) {
    localStorage.setItem(key, value);
}

function cargarPreferencia(key, defaultValue = false) {
    const valor = localStorage.getItem(key);
    return valor !== null ? valor === 'true' : defaultValue;
}

function aplicarModos() {
    const isNight = cargarPreferencia('nightMode');
    const isVisual = cargarPreferencia('visualProtection');
    document.body.classList.toggle('night-mode', isNight);
    document.body.classList.toggle('visual-protection', isVisual);
    const nightBtn = document.getElementById('nightModeBtn');
    if (nightBtn) nightBtn.textContent = isNight ? '☀️' : '🌙';
}

async function cargarVista(nombre) {
    const container = document.getElementById('view-container');
    try {
        const resp = await fetch(`/views/${nombre}.html`);
        if (!resp.ok) throw new Error('Vista no encontrada');
        const html = await resp.text();
        container.innerHTML = html;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === nombre);
        });

        currentView = nombre;

        if (nombre === 'empleados') {
            initEmpleados(container);
        } else if (nombre === 'estadisticas') {
            initEstadisticas(container);
        } else if (nombre === 'empleado-form') {
            initEmpleadoForm(container);
        } else if (nombre === 'reporte') {
            initReporte(container);
        }
    } catch (error) {
        container.innerHTML = `<p class="error-message">Error al cargar la vista: ${error.message}</p>`;
    }
}

function initEmpleados(container) {
    if (uiInstance) {
        uiInstance.container = container;
        uiInstance.initElementosDOM();
        uiInstance.registrarEventos();
        uiInstance.cargarEmpleados();
        uiInstance.resetearFormulario();
    } else {
        uiInstance = new UI(container);
    }
}

function initEstadisticas(container) {
    if (uiInstance && uiInstance.empleados) {
        const empleados = uiInstance.empleados;
        const total = empleados.length;
        const suma = empleados.reduce((acc, e) => acc + (Number(e.sueldoNeto) || 0), 0);
        const totalSpan = container.querySelector('#totalEmpleados');
        const gastoSpan = container.querySelector('#gastoTotal');
        if (totalSpan) totalSpan.textContent = total;
        if (gastoSpan) gastoSpan.textContent = suma.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
        
        renderizarGraficos(empleados, container);
    } else {
        obtenerEmpleados().then(empleados => {
            const total = empleados.length;
            const suma = empleados.reduce((acc, e) => acc + (Number(e.sueldoNeto) || 0), 0);
            const totalSpan = container.querySelector('#totalEmpleados');
            const gastoSpan = container.querySelector('#gastoTotal');
            if (totalSpan) totalSpan.textContent = total;
            if (gastoSpan) gastoSpan.textContent = suma.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
            if (uiInstance) uiInstance.empleados = empleados;
            
            renderizarGraficos(empleados, container);
        }).catch(() => {
            const totalSpan = container.querySelector('#totalEmpleados');
            const gastoSpan = container.querySelector('#gastoTotal');
            if (totalSpan) totalSpan.textContent = 'Error';
            if (gastoSpan) gastoSpan.textContent = 'Error';
        });
    }
}

function renderizarGraficos(empleados, container) {
    const ctxCargos = container.querySelector('#cargosChart');
    const ctxSueldos = container.querySelector('#sueldosChart');
    const ctxHoras = container.querySelector('#horasExtrasChart');
    const ctxComparativa = container.querySelector('#comparativaConceptosChart');
    
    if (!ctxCargos || !ctxSueldos || !ctxHoras || !ctxComparativa) return;
    
    // Destruir instancias previas para evitar colisiones en SPA
    if (window.cargosChartInstance) window.cargosChartInstance.destroy();
    if (window.sueldosChartInstance) window.sueldosChartInstance.destroy();
    if (window.horasExtrasChartInstance) window.horasExtrasChartInstance.destroy();
    if (window.comparativaConceptosChartInstance) window.comparativaConceptosChartInstance.destroy();

    const isNight = document.body.classList.contains('night-mode');
    const textColor = isNight ? '#cbd5e1' : '#475569';
    const gridColor = isNight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    // 1. Datos para cargos (Distribución)
    const cargosCount = {};
    empleados.forEach(emp => {
        const cargo = emp.cargo || 'Sin Especificar';
        cargosCount[cargo] = (cargosCount[cargo] || 0) + 1;
    });

    const labelsCargos = Object.keys(cargosCount);
    const dataCargos = Object.values(cargosCount);

    const colors = [
        '#1e3c72', '#3b82f6', '#10b981', '#f59e0b', '#6366f1',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#06b6d4'
    ];
    const colorsDark = [
        '#D4AF37', '#E5A96E', '#34d399', '#3b82f6', '#818cf8',
        '#a78bfa', '#f472b6', '#2dd4bf', '#fb7185', '#22d3ee'
    ];
    const palette = isNight ? colorsDark : colors;

    window.cargosChartInstance = new Chart(ctxCargos, {
        type: 'doughnut',
        data: {
            labels: labelsCargos,
            datasets: [{
                data: dataCargos,
                backgroundColor: palette.slice(0, labelsCargos.length),
                borderWidth: isNight ? 1 : 2,
                borderColor: isNight ? '#222222' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: 'Inter', size: 11 }
                    }
                }
            }
        }
    });

    // 2. Datos para sueldos netos (Comparación)
    const labelsSueldos = empleados.map(emp => {
        const primerNombre = emp.nombre.split(' ')[0];
        const lastDigits = emp.cedula.includes('-') ? emp.cedula.split('-')[1].substring(0, 4) : emp.cedula.substring(0, 4);
        return `${primerNombre} (${lastDigits}...)`;
    });
    const dataSueldos = empleados.map(emp => emp.sueldoNeto || 0);

    window.sueldosChartInstance = new Chart(ctxSueldos, {
        type: 'bar',
        data: {
            labels: labelsSueldos,
            datasets: [{
                label: 'Sueldo Neto (Bs)',
                data: dataSueldos,
                backgroundColor: isNight ? 'rgba(212, 175, 55, 0.85)' : 'rgba(30, 60, 114, 0.85)',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 }
                    }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 }
                    }
                }
            }
        }
    });

    // 3. Ranking de Horas Extras por Empleado (Gráfico de Barras Horizontal)
    const empleadosOrdenadosHE = [...empleados].sort((a, b) => (b.horasExtras || 0) - (a.horasExtras || 0));
    const labelsHE = empleadosOrdenadosHE.map(emp => {
        const primerNombre = emp.nombre.split(' ')[0];
        const lastDigits = emp.cedula.includes('-') ? emp.cedula.split('-')[1].substring(0, 4) : emp.cedula.substring(0, 4);
        return `${primerNombre} (${lastDigits})`;
    });
    const dataHE = empleadosOrdenadosHE.map(emp => emp.horasExtras || 0);

    window.horasExtrasChartInstance = new Chart(ctxHoras, {
        type: 'bar',
        data: {
            labels: labelsHE,
            datasets: [{
                label: 'Horas Extras',
                data: dataHE,
                backgroundColor: isNight ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontales
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 },
                        stepSize: 1
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 }
                    }
                }
            }
        }
    });

    // 4. Asignaciones vs. Deducciones Totales (Barras Comparativas)
    let totalAsignaciones = 0;
    let totalDeducciones = 0;

    empleados.forEach(emp => {
        totalAsignaciones += (emp.sueldoBase || 0) + (emp.pagoHorasExtras || 0) + (emp.bonoFijo || 0);
        totalDeducciones += (emp.ivss || 0) + (emp.paroForzoso || 0);
    });

    window.comparativaConceptosChartInstance = new Chart(ctxComparativa, {
        type: 'bar',
        data: {
            labels: ['Ingresos Brutos', 'Retenciones / Deducciones'],
            datasets: [{
                data: [totalAsignaciones, totalDeducciones],
                backgroundColor: [
                    isNight ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)', // Verde
                    isNight ? 'rgba(239, 68, 68, 0.85)' : 'rgba(220, 38, 38, 0.85)'   // Rojo
                ],
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isNight ? ['#34d399', '#ef4444'] : ['#10b981', '#dc2626']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 11, weight: '600' }
                    }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 },
                        callback: function(value) {
                            return value.toLocaleString('es-VE') + ' Bs';
                        }
                    }
                }
            }
        }
    });
}

function initReporte(container) {
    const formatBs = (num) => {
        return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Bs';
    };

    // Establecer la fecha actual
    const dateSpan = container.querySelector('#report-date');
    if (dateSpan) {
        const hoy = new Date();
        dateSpan.textContent = hoy.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    const tBody = container.querySelector('#reporteTablaBody');
    const totalGeneralSpan = container.querySelector('#reporteTotalGeneral');
    const printBtn = container.querySelector('#btnImprimirReporte');

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const renderizarReporte = (empleados) => {
        if (!tBody) return;
        tBody.innerHTML = '';
        
        if (empleados.length === 0) {
            tBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay empleados registrados.</td></tr>';
            if (totalGeneralSpan) totalGeneralSpan.textContent = '0.00 Bs';
            return;
        }

        let totalAcumulado = 0;

        empleados.forEach(emp => {
            const tr = document.createElement('tr');
            const retencionesSum = (emp.ivss || 0) + (emp.paroForzoso || 0);
            totalAcumulado += emp.sueldoNeto || 0;

            tr.innerHTML = `
                <td><strong>${emp.nombre}</strong></td>
                <td>${emp.cedula}</td>
                <td>${emp.cargo}</td>
                <td class="text-right">${formatBs(emp.sueldoBase)}</td>
                <td class="text-right">${formatBs(emp.pagoHorasExtras)}</td>
                <td class="text-right">${formatBs(emp.bonoFijo)}</td>
                <td class="text-right text-danger">-${formatBs(retencionesSum)}</td>
                <td class="text-right font-bold">${formatBs(emp.sueldoNeto)}</td>
            `;
            tBody.appendChild(tr);
        });

        if (totalGeneralSpan) {
            totalGeneralSpan.textContent = formatBs(totalAcumulado);
        }
    };

    if (uiInstance && uiInstance.empleados && uiInstance.empleados.length > 0) {
        renderizarReporte(uiInstance.empleados);
    } else {
        obtenerEmpleados().then(empleados => {
            renderizarReporte(empleados);
            if (uiInstance) uiInstance.empleados = empleados;
        }).catch(err => {
            if (tBody) tBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error: ${err.message}</td></tr>`;
        });
    }
}

function initEmpleadoForm(container) {
    const empleado = window.empleadoEditando || null;

    if (uiInstance) {
        uiInstance.container = container;
        uiInstance.initElementosDOM();
        uiInstance.registrarEventos();

        if (empleado) {
            if (uiInstance.nombreInput) uiInstance.nombreInput.value = empleado.nombre;
            if (uiInstance.cedulaInput) {
                uiInstance.cedulaInput.value = empleado.cedula;
                uiInstance.cedulaInput.readOnly = true;
                uiInstance.cedulaInput.style.backgroundColor = '#f1f5f9';
                uiInstance.cedulaInput.style.color = '#64748b';
                uiInstance.cedulaInput.style.cursor = 'not-allowed';
            }
            if (uiInstance.cargoInput) uiInstance.cargoInput.value = empleado.cargo;
            if (uiInstance.sueldoInput) uiInstance.sueldoInput.value = empleado.sueldoBase;
            if (uiInstance.horasExtrasInput) uiInstance.horasExtrasInput.value = empleado.horasExtras;
            if (uiInstance.empleadoIdHidden) uiInstance.empleadoIdHidden.value = empleado.cedula;
            if (uiInstance.formTitle) uiInstance.formTitle.textContent = 'Editar Empleado';
            if (uiInstance.btnGuardar) uiInstance.btnGuardar.textContent = 'Actualizar';
            if (uiInstance.btnCancelar) uiInstance.btnCancelar.style.display = 'inline-block';

            uiInstance.modoEdicion = true;
            uiInstance.cedulaEditando = empleado.cedula;
            uiInstance.limpiarError();
        } else {
            uiInstance.resetearFormulario();
        }
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view && view !== currentView) {
                cargarVista(view);
            }
        });
    });
}

function setupModos() {
    const nightBtn = document.getElementById('nightModeBtn');
    const visualBtn = document.getElementById('visualProtectionBtn');

    if (nightBtn) {
        nightBtn.addEventListener('click', () => {
            const isNight = document.body.classList.toggle('night-mode');
            nightBtn.textContent = isNight ? '☀️' : '🌙';
            guardarPreferencia('nightMode', isNight);
            mostrarNotificacion(isNight ? '🌙 Modo nocturno' : '☀️ Modo diurno');
        });
    }

    if (visualBtn) {
        visualBtn.addEventListener('click', () => {
            const isProtected = document.body.classList.toggle('visual-protection');
            guardarPreferencia('visualProtection', isProtected);
            visualBtn.style.background = isProtected ? '#f59e0b' : '';
            visualBtn.style.color = isProtected ? '#78350f' : '';
            mostrarNotificacion(isProtected ? '👁️ Protección visual' : '👁️ Protección desactivada');
        });
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        });
    }
}

function mostrarNotificacion(mensaje) {
    const existente = document.querySelector('.floating-notification');
    if (existente) existente.remove();

    const notif = document.createElement('div');
    notif.className = 'floating-notification';
    notif.textContent = mensaje;
    Object.assign(notif.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1e293b',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '30px',
        fontSize: '0.85rem',
        zIndex: '9999',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        fontFamily: 'Inter, sans-serif'
    });
    document.body.appendChild(notif);
    setTimeout(() => notif.style.opacity = '1', 10);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/check-session');
        const data = await res.json();
        if (!data.loggedIn) {
            window.location.href = '/';
            return;
        }
    } catch {
        window.location.href = '/';
        return;
    }

    aplicarModos();
    setupNavigation();
    setupModos();
    setupLogout();
    cargarVista('empleados');
});
