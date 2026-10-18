const tablaModel = require("tabla-model");

/**
 * Modelo de Empleados
 * Almacena los datos del trabajador y su salario base
 */
const empleados = new tablaModel("empleados", {
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
            default: 0,
        },
        {
            name: "departamento_id",
            type: "integer",
            defaultNull: true,
        }
    ],
    foreingKey: [
        {
            key: "departamento_id",
            reference: "departamentos",
            keyReference: "id",
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        }
    ]
});

empleados.insert({
    cedula: "V-122122112",
    nombre: "Yoalice Muñoz",
    foto: "",
    cargo: "Manager",
    sueldoBase: 156000.00,
    horasExtras: 30,
    departamento_id: 2
});
empleados.insert({
    cedula: "V-1882828",
    nombre: "Roberth Idrobo",
    foto: "foto-1783802514282-908495399.jpg",
    cargo: "Servicios Generales",
    sueldoBase: 1000.00,
    horasExtras: 10,
    departamento_id: 4
});
empleados.insert({
    cedula: "V-26626262",
    nombre: "Claudia Montilla",
    foto: "foto-1783799137802-829544323.jpeg",
    cargo: "Dev FullStack",
    sueldoBase: 15000.00,
    horasExtras: 5,
    departamento_id: 1
});
empleados.insert({
    cedula: "V-32117825",
    nombre: "Sebastian Briceño",
    foto: "foto-1788912023744-901208485.jpg",
    cargo: "Dev Backend",
    sueldoBase: 18000.00,
    horasExtras: 15,
    departamento_id: 1
});

module.exports = empleados;