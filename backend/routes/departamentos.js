const express = require('express');
const router = express.Router();

// GET /api/departamentos - Listar todos los departamentos
router.get('/', async (req, res) => {
    try {
        const tabla = req.db.tabla('departamentos');
        const lista = await tabla.select();
        res.json(lista);
    } catch (error) {
        console.error('Error GET departamentos:', error);
        res.status(500).json({ error: 'Error al obtener los departamentos' });
    }
});

// GET /api/departamentos/:id - Obtener un departamento por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tabla = req.db.tabla('departamentos');
        const depto = await tabla.selectOne({ where: { id: Number(id) } });
        if (!depto) {
            return res.status(404).json({ error: 'Departamento no encontrado' });
        }
        res.json(depto);
    } catch (error) {
        console.error('Error GET departamento:', error);
        res.status(500).json({ error: 'Error al obtener el departamento' });
    }
});

// POST /api/departamentos - Crear departamento
router.post('/', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del departamento es obligatorio' });
        }

        const tabla = req.db.tabla('departamentos');
        await tabla.insert({
            nombre: nombre.trim(),
            descripcion: descripcion ? descripcion.trim() : null
        });

        res.status(201).json({ success: true, message: 'Departamento creado exitosamente' });
    } catch (error) {
        console.error('Error POST departamento:', error);
        res.status(500).json({ error: 'Error al registrar el departamento' });
    }
});

// PUT /api/departamentos/:id - Actualizar departamento
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre del departamento es obligatorio' });
        }

        const tabla = req.db.tabla('departamentos');
        const existe = await tabla.selectOne({ where: { id: Number(id) } });
        if (!existe) {
            return res.status(404).json({ error: 'Departamento no encontrado' });
        }

        await tabla.update(
            {
                nombre: nombre.trim(),
                descripcion: descripcion ? descripcion.trim() : null
            },
            { where: { id: Number(id) } }
        );

        res.json({ success: true, message: 'Departamento actualizado exitosamente' });
    } catch (error) {
        console.error('Error PUT departamento:', error);
        res.status(500).json({ error: 'Error al actualizar el departamento' });
    }
});

// DELETE /api/departamentos/:id - Eliminar departamento
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tabla = req.db.tabla('departamentos');
        const existe = await tabla.selectOne({ where: { id: Number(id) } });
        if (!existe) {
            return res.status(404).json({ error: 'Departamento no encontrado' });
        }

        await tabla.delete({ where: { id: Number(id) } });
        res.json({ success: true, message: 'Departamento eliminado exitosamente' });
    } catch (error) {
        console.error('Error DELETE departamento:', error);
        res.status(500).json({ error: 'Error al eliminar el departamento' });
    }
});

module.exports = router;
