
const tablaModel = require("tabla-model")
const alumnos = new tablaModel("empleados", {
    colums: [
        {
            name: "cedula",
            type: "varchar(45)",
            primary: true,
            defaultNull: false,

        },
        {
            name: "nombre",
            type: "varchar(45)",
            defaultNull: false,
        },
        {
            name: "foto",
            type: "varchar(100)",
            defaultNull: true,
        },
        {
            name: "cargo",
            type: "varchar(45)",
            defaultNull: false,
        },
        {
            name: "sueldoBase",
            type: "decimal(10,2)",
            defaultNull: false,
        },
        {
            name: "horasExtras",
            type: "integer",
            defaultNull: false,
        }
    ],
})

module.exports = alumnos