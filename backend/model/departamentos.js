const tablaModel = require("tabla-model");

/**
 * Modelo de Departamentos
 * Catálogo para clasificar a los empleados (ej: Administración, Ventas, Sistemas)
 */
const departamentos = new tablaModel("departamentos", {
    colums: [
        {
            name: "id",
            type: "integer",
            primary: true,
            defaultNull: false,
            autoincrement: true,
        },
        {
            name: "nombre",
            type: "varchar(60)",
            defaultNull: false,
        },
        {
            name: "descripcion",
            type: "varchar(150)",
            defaultNull: true,
        }
    ],
});

departamentos.insert({
    id: 1,
    nombre: "Tecnología y Desarrollo",
    descripcion: "Equipo de desarrollo de software y soporte técnico"
});
departamentos.insert({
    id: 2,
    nombre: "Administración y Finanzas",
    descripcion: "Gestión contable, compras y recursos financieros"
});
departamentos.insert({
    id: 3,
    nombre: "Recursos Humanos",
    descripcion: "Gestión del talento humano y nómina"
});
departamentos.insert({
    id: 4,
    nombre: "Operaciones y Logística",
    descripcion: "Mantenimiento, servicios generales y operaciones"
});

module.exports = departamentos;
