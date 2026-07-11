const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GestorArchivo = require('../models/GestorArchivo');
const gestor = new GestorArchivo();

// Salario mínimo en Bolívares y constantes de cálculo
const SALARIO_MINIMO = 1000;
const BONO_FIJO = 500;
const HORAS_MENSUALES = 240;

// Configuración de multer
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'foto-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limite
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (PNG, JPG, JPEG, etc.)'));
        }
    }
});

// Middleware wrapper para capturar errores de multer de forma amigable
const uploadSingle = (req, res, next) => {
    upload.single('foto')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ errores: [`Error de subida: ${err.message}`] });
        } else if (err) {
            return res.status(400).json({ errores: [err.message] });
        }
        next();
    });
};

// Función de cálculo de nómina
function calcularDetalleNomina(emp) {
    const sueldoBase = Number(emp.sueldoBase) || 0;
    const horasExtras = Number(emp.horasExtras) || 0;
    
    const valorHoraNormal = sueldoBase / HORAS_MENSUALES;
    const valorHoraExtra = valorHoraNormal * 1.5;
    const pagoHorasExtras = horasExtras * valorHoraExtra;
    
    const ivss = sueldoBase * 0.04;
    const paroForzoso = sueldoBase * 0.01;
    
    const sueldoNeto = sueldoBase + pagoHorasExtras + BONO_FIJO - ivss - paroForzoso;
    
    return {
        sueldoBase,
        horasExtras,
        valorHoraNormal: Number(valorHoraNormal.toFixed(4)),
        valorHoraExtra: Number(valorHoraExtra.toFixed(4)),
        pagoHorasExtras: Number(pagoHorasExtras.toFixed(2)),
        bonoFijo: BONO_FIJO,
        ivss: Number(ivss.toFixed(2)),
        paroForzoso: Number(paroForzoso.toFixed(2)),
        sueldoNeto: Number(sueldoNeto.toFixed(2))
    };
}

// Función de validación de empleado (para CREACIÓN)
function validarEmpleado(datos) {
    const errores = [];

    // Nombre: no vacío y debe tener al menos dos palabras
    if (!datos.nombre || datos.nombre.trim() === '') {
        errores.push('El nombre completo es obligatorio');
    } else if (datos.nombre.trim().split(/\s+/).length < 2) {
        errores.push('El nombre debe incluir al menos nombre y apellido');
    }

    // Cédula: formato V- o E- seguido de números
    const cedulaRegex = /^[VE]-\d+$/;
    if (!datos.cedula || !cedulaRegex.test(datos.cedula)) {
        errores.push('La cédula debe tener formato V-12345678 o E-12345678');
    }

    // Sueldo Base: número >= salario mínimo
    const sueldoBaseNum = Number(datos.sueldoBase);
    if (datos.sueldoBase === undefined || datos.sueldoBase === null || isNaN(sueldoBaseNum)) {
        errores.push('El sueldo base debe ser un número válido');
    } else if (sueldoBaseNum < SALARIO_MINIMO) {
        errores.push(`El sueldo base debe ser igual o superior al salario mínimo de ${SALARIO_MINIMO} Bs`);
    }

    // Horas Extras: número >= 0
    const horasExtrasNum = Number(datos.horasExtras);
    if (datos.horasExtras === undefined || datos.horasExtras === null || isNaN(horasExtrasNum)) {
        errores.push('La cantidad de horas extras debe ser un número válido');
    } else if (horasExtrasNum < 0 || !Number.isInteger(horasExtrasNum)) {
        errores.push('La cantidad de horas extras debe ser un número entero no negativo');
    }

    // Cargo: no vacío
    if (!datos.cargo || datos.cargo.trim() === '') {
        errores.push('El cargo es obligatorio');
    }

    return errores;
}

// Función de validación para ACTUALIZACIÓN (sin cédula)
function validarActualizacion(datos) {
    const errores = [];

    // Nombre: no vacío y debe tener al menos dos palabras
    if (!datos.nombre || datos.nombre.trim() === '') {
        errores.push('El nombre completo es obligatorio');
    } else if (datos.nombre.trim().split(/\s+/).length < 2) {
        errores.push('El nombre debe incluir al menos nombre y apellido');
    }

    // Sueldo Base: número >= salario mínimo
    const sueldoBaseNum = Number(datos.sueldoBase);
    if (datos.sueldoBase === undefined || datos.sueldoBase === null || isNaN(sueldoBaseNum)) {
        errores.push('El sueldo base debe ser un número válido');
    } else if (sueldoBaseNum < SALARIO_MINIMO) {
        errores.push(`El sueldo base debe ser igual o superior al salario mínimo de ${SALARIO_MINIMO} Bs`);
    }

    // Horas Extras: número >= 0
    const horasExtrasNum = Number(datos.horasExtras);
    if (datos.horasExtras === undefined || datos.horasExtras === null || isNaN(horasExtrasNum)) {
        errores.push('La cantidad de horas extras debe ser un número válido');
    } else if (horasExtrasNum < 0 || !Number.isInteger(horasExtrasNum)) {
        errores.push('La cantidad de horas extras debe ser un número entero no negativo');
    }

    // Cargo: no vacío
    if (!datos.cargo || datos.cargo.trim() === '') {
        errores.push('El cargo es obligatorio');
    }

    return errores;
}

// GET /api/empleados/foto/:filename - Servir fotos de forma controlada
router.get('/foto/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(UPLOADS_DIR, filename);
        
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        if (fs.existsSync(resolvedPath)) {
            res.sendFile(resolvedPath);
        } else {
            res.status(404).json({ error: 'Foto no encontrada' });
        }
    } catch (error) {
        console.error('Error al servir foto:', error);
        res.status(500).json({ error: 'Error al obtener la imagen' });
    }
});

// GET /api/empleados - Obtener todos
router.get('/', async (req, res) => {
    try {
        const empleados = await gestor.obtenerTodos();
        const empleadosCalculados = empleados.map(emp => ({
            ...emp,
            ...calcularDetalleNomina(emp)
        }));
        res.json(empleadosCalculados);
    } catch (error) {
        console.error('Error GET empleados:', error);
        res.status(500).json({ error: 'Error al obtener empleados' });
    }
});

// POST /api/empleados - Crear empleado
router.post('/', uploadSingle, async (req, res) => {
    try {
        const { nombre, cedula, cargo, sueldoBase, horasExtras } = req.body;

        // Validaciones
        const errores = validarEmpleado({ nombre, cedula, cargo, sueldoBase, horasExtras });
        if (errores.length > 0) {
            // Eliminar archivo recién subido si falla la validación
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(400).json({ errores });
        }

        // Verificar unicidad de cédula
        const esUnica = await gestor.validarCedulaUnica(cedula);
        if (!esUnica) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(400).json({ errores: ['La cédula ya está registrada'] });
        }

        const nuevoEmpleado = await gestor.crearEmpleado({
            nombre: nombre.trim(),
            cedula: cedula.trim(),
            cargo: cargo.trim(),
            sueldoBase: Number(sueldoBase),
            horasExtras: Number(horasExtras),
            foto: req.file ? req.file.filename : null
        });

        res.status(201).json({
            ...nuevoEmpleado,
            ...calcularDetalleNomina(nuevoEmpleado)
        });
    } catch (error) {
        console.error('Error POST empleado:', error);
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ error: 'Error al crear empleado' });
    }
});

// PUT /api/empleados/:id - Actualizar empleado (sin cédula)
router.put('/:id', uploadSingle, async (req, res) => {
    try {
        const id = req.params.id;
        const { nombre, cargo, sueldoBase, horasExtras } = req.body;

        const empleadoExistente = await gestor.obtenerPorId(id);
        if (!empleadoExistente) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }

        // Validaciones
        const errores = validarActualizacion({ nombre, cargo, sueldoBase, horasExtras });
        if (errores.length > 0) {
            if (req.file) {
                fs.unlink(req.file.path, () => {});
            }
            return res.status(400).json({ errores });
        }

        const datosActualizados = {
            nombre: nombre.trim(),
            cargo: cargo.trim(),
            sueldoBase: Number(sueldoBase),
            horasExtras: Number(horasExtras)
        };

        if (req.file) {
            datosActualizados.foto = req.file.filename;
        }

        const empleadoActualizado = await gestor.actualizarEmpleado(id, datosActualizados);
        
        res.json({
            ...empleadoActualizado,
            ...calcularDetalleNomina(empleadoActualizado)
        });
    } catch (error) {
        console.error('Error en PUT /api/empleados/:id:', error);
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ error: 'Error al actualizar empleado: ' + error.message });
    }
});

// DELETE /api/empleados/:id - Eliminar empleado
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        const empleadoExistente = await gestor.obtenerPorId(id);
        if (!empleadoExistente) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        const eliminado = await gestor.eliminarEmpleado(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error DELETE empleado:', error);
        res.status(500).json({ error: 'Error al eliminar empleado: ' + error.message });
    }
});

module.exports = router;
