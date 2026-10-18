const express = require('express');
const router = express.Router();

// GET /api/recibos - Listar recibos (con filtros opcionales)
router.get('/', async (req, res) => {
    try {
        const { nomina_id, cedula } = req.query;
        const tablaRecibos = req.db.tabla('recibos_pago');
        const tablaEmpleados = req.db.tabla('empleados');
        const tablaNominas = req.db.tabla('nominas');

        let filtro = {};
        if (nomina_id) filtro.nomina_id = Number(nomina_id);
        if (cedula) filtro.empleado_cedula = cedula;

        const recibos = Object.keys(filtro).length > 0 
            ? await tablaRecibos.select({ where: filtro })
            : await tablaRecibos.select();

        const empleados = await tablaEmpleados.select();
        const nominas = await tablaNominas.select();

        const resultado = recibos.map(r => {
            const emp = empleados.find(e => e.cedula === r.empleado_cedula) || {};
            const nom = nominas.find(n => n.id === r.nomina_id) || {};
            return {
                ...r,
                empleadoNombre: emp.nombre || 'Desconocido',
                empleadoCargo: emp.cargo || '',
                periodoNomina: nom.periodo || ''
            };
        });

        res.json(resultado);
    } catch (error) {
        console.error('Error GET recibos:', error);
        res.status(500).json({ error: 'Error al obtener los recibos' });
    }
});

// GET /api/recibos/:id - Ver un recibo específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaRecibos = req.db.tabla('recibos_pago');
        const tablaEmpleados = req.db.tabla('empleados');
        const tablaNominas = req.db.tabla('nominas');

        const recibo = await tablaRecibos.selectOne({ where: { id: Number(id) } });
        if (!recibo) {
            return res.status(404).json({ error: 'Recibo no encontrado' });
        }

        const emp = await tablaEmpleados.selectOne({ where: { cedula: recibo.empleado_cedula } }) || {};
        const nom = await tablaNominas.selectOne({ where: { id: recibo.nomina_id } }) || {};

        res.json({
            ...recibo,
            empleado: emp,
            nomina: nom
        });
    } catch (error) {
        console.error('Error GET recibo:', error);
        res.status(500).json({ error: 'Error al obtener el recibo' });
    }
});

// PUT /api/recibos/:id - Modificar valores de un recibo (ajustes individuales)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { diasTrabajados, horasExtras, bonificaciones, deducciones } = req.body;

        const tablaRecibos = req.db.tabla('recibos_pago');
        const recibo = await tablaRecibos.selectOne({ where: { id: Number(id) } });
        if (!recibo) {
            return res.status(404).json({ error: 'Recibo no encontrado' });
        }

        const tablaEmpleados = req.db.tabla('empleados');
        const emp = await tablaEmpleados.selectOne({ where: { cedula: recibo.empleado_cedula } });

        const sueldoBase = emp ? Number(emp.sueldoBase) : (Number(recibo.sueldoQuincena) * 2);
        const dias = diasTrabajados !== undefined ? Number(diasTrabajados) : Number(recibo.diasTrabajados);
        const sueldoQuincena = (sueldoBase / 30) * dias;

        const horasExt = horasExtras !== undefined ? Number(horasExtras) : Number(recibo.horasExtras);
        const valorHoraExtra = (sueldoBase / 240) * 1.5;
        const montoHorasExtras = horasExt * valorHoraExtra;

        const bonos = bonificaciones !== undefined ? Number(bonificaciones) : Number(recibo.bonificaciones);
        const deds = deducciones !== undefined ? Number(deducciones) : Number(recibo.deducciones);

        const totalNeto = sueldoQuincena + montoHorasExtras + bonos - deds;

        await tablaRecibos.update(
            {
                diasTrabajados: dias,
                sueldoQuincena: Number(sueldoQuincena.toFixed(2)),
                horasExtras: horasExt,
                montoHorasExtras: Number(montoHorasExtras.toFixed(2)),
                bonificaciones: Number(bonos.toFixed(2)),
                deducciones: Number(deds.toFixed(2)),
                totalNeto: Number(totalNeto.toFixed(2))
            },
            { where: { id: Number(id) } }
        );

        res.json({ success: true, message: 'Recibo actualizado exitosamente' });
    } catch (error) {
        console.error('Error PUT recibo:', error);
        res.status(500).json({ error: 'Error al actualizar el recibo' });
    }
});

// DELETE /api/recibos/:id - Eliminar un recibo
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tablaRecibos = req.db.tabla('recibos_pago');
        const recibo = await tablaRecibos.selectOne({ where: { id: Number(id) } });
        if (!recibo) {
            return res.status(404).json({ error: 'Recibo no encontrado' });
        }

        await tablaRecibos.delete({ where: { id: Number(id) } });
        res.json({ success: true, message: 'Recibo eliminado exitosamente' });
    } catch (error) {
        console.error('Error DELETE recibo:', error);
        res.status(500).json({ error: 'Error al eliminar el recibo' });
    }
});

module.exports = router;
