const express = require('express');
const router = express.Router();

const HORAS_MENSUALES = 240;
const BONO_QUINCENAL = 250; // Bono de alimentación o transporte quincenal

// Helper para calcular un recibo quincenal
function calcularReciboQuincena(empleado, dias = 15, horasExt = 0) {
    const sueldoBase = Number(empleado.sueldoBase) || 0;
    const sueldoQuincena = (sueldoBase / 30) * dias;

    const valorHoraNormal = sueldoBase / HORAS_MENSUALES;
    const valorHoraExtra = valorHoraNormal * 1.5;
    const montoHorasExtras = horasExt * valorHoraExtra;

    const ivss = sueldoQuincena * 0.04;
    const paroForzoso = sueldoQuincena * 0.01;
    const deducciones = ivss + paroForzoso;

    const bonificaciones = BONO_QUINCENAL;
    const totalNeto = sueldoQuincena + montoHorasExtras + bonificaciones - deducciones;

    return {
        diasTrabajados: dias,
        sueldoQuincena: Number(sueldoQuincena.toFixed(2)),
        horasExtras: horasExt,
        montoHorasExtras: Number(montoHorasExtras.toFixed(2)),
        bonificaciones: Number(bonificaciones.toFixed(2)),
        deducciones: Number(deducciones.toFixed(2)),
        totalNeto: Number(totalNeto.toFixed(2))
    };
}

// GET /api/nominas - Listar todos los periodos de nómina
router.get('/', async (req, res) => {
    try {
        const tablaNominas = req.db.tabla('nominas');
        const lista = await tablaNominas.select();
        res.json(lista);
    } catch (error) {
        console.error('Error GET nominas:', error);
        res.status(500).json({ error: 'Error al obtener las nóminas' });
    }
});

// GET /api/nominas/:id - Obtener una nómina con sus recibos asociados
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaNominas = req.db.tabla('nominas');
        const tablaRecibos = req.db.tabla('recibos_pago');
        const tablaEmpleados = req.db.tabla('empleados');

        const nomina = await tablaNominas.selectOne({ where: { id: Number(id) } });
        if (!nomina) {
            return res.status(404).json({ error: 'Nómina no encontrada' });
        }

        const recibos = await tablaRecibos.select({ where: { nomina_id: Number(id) } });
        const empleados = await tablaEmpleados.select();

        // Enlazar los datos del empleado a cada recibo
        const recibosConEmpleado = recibos.map(recibo => {
            const emp = empleados.find(e => e.cedula === recibo.empleado_cedula) || {};
            return {
                ...recibo,
                empleadoNombre: emp.nombre || 'Empleado no encontrado',
                empleadoCargo: emp.cargo || '',
                empleadoFoto: emp.foto || ''
            };
        });

        // Totales consolidados de la nómina
        const totalPagado = recibos.reduce((acc, curr) => acc + Number(curr.totalNeto || 0), 0);

        res.json({
            ...nomina,
            totalPagado: Number(totalPagado.toFixed(2)),
            cantidadEmpleados: recibos.length,
            recibos: recibosConEmpleado
        });
    } catch (error) {
        console.error('Error GET nomina por id:', error);
        res.status(500).json({ error: 'Error al obtener el detalle de la nómina' });
    }
});

// POST /api/nominas - Crear nuevo periodo de nómina
router.post('/', async (req, res) => {
    try {
        const { periodo, fechaInicio, fechaFin, fechaPago } = req.body;

        if (!periodo || !fechaInicio || !fechaFin || !fechaPago) {
            return res.status(400).json({ error: 'Todos los campos del periodo de nómina son obligatorios' });
        }

        const tablaNominas = req.db.tabla('nominas');
        await tablaNominas.insert({
            periodo: periodo.trim(),
            fechaInicio,
            fechaFin,
            fechaPago,
            estado: 'Borrador'
        });

        res.status(201).json({ success: true, message: 'Periodo de nómina creado exitosamente' });
    } catch (error) {
        console.error('Error POST nomina:', error);
        res.status(500).json({ error: 'Error al registrar la nómina' });
    }
});

// POST /api/nominas/:id/generar - Generar recibos para todos los empleados
router.post('/:id/generar', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaNominas = req.db.tabla('nominas');
        const tablaRecibos = req.db.tabla('recibos_pago');
        const tablaEmpleados = req.db.tabla('empleados');

        const nomina = await tablaNominas.selectOne({ where: { id: Number(id) } });
        if (!nomina) {
            return res.status(404).json({ error: 'Nómina no encontrada' });
        }

        const empleados = await tablaEmpleados.select();
        if (empleados.length === 0) {
            return res.status(400).json({ error: 'No hay empleados registrados para generar la nómina' });
        }

        // Limpiar recibos anteriores si ya se había generado este periodo en borrador
        await tablaRecibos.delete({ where: { nomina_id: Number(id) } });

        // Insertar el recibo calculado para cada empleado
        for (const emp of empleados) {
            const horasExt = Number(emp.horasExtras) || 0;
            const calculo = calcularReciboQuincena(emp, 15, horasExt);

            await tablaRecibos.insert({
                nomina_id: Number(id),
                empleado_cedula: emp.cedula,
                ...calculo
            });
        }

        res.json({
            success: true,
            message: `Nómina generada exitosamente para ${empleados.length} empleados`
        });
    } catch (error) {
        console.error('Error al generar nómina:', error);
        res.status(500).json({ error: 'Error al calcular los recibos de nómina' });
    }
});

// PUT /api/nominas/:id/estado - Cambiar estado (Borrador / Pagada)
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['Borrador', 'Pagada', 'Cerrada'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const tablaNominas = req.db.tabla('nominas');
        await tablaNominas.update({ estado }, { where: { id: Number(id) } });

        res.json({ success: true, message: `Nómina marcada como ${estado}` });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ error: 'Error al actualizar el estado de la nómina' });
    }
});

// DELETE /api/nominas/:id - Eliminar periodo de nómina
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaNominas = req.db.tabla('nominas');
        const tablaRecibos = req.db.tabla('recibos_pago');

        // Borrar recibos asociados y luego la nómina
        await tablaRecibos.delete({ where: { nomina_id: Number(id) } });
        await tablaNominas.delete({ where: { id: Number(id) } });

        res.json({ success: true, message: 'Periodo de nómina eliminado exitosamente' });
    } catch (error) {
        console.error('Error DELETE nomina:', error);
        res.status(500).json({ error: 'Error al eliminar la nómina' });
    }
});

module.exports = router;
