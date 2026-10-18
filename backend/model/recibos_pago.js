const tablaModel = require("tabla-model");

/**
 * Modelo de Recibos de Pago (Detalle de Nómina)
 * Almacena el cálculo de pago para cada empleado en un periodo determinado
 */
const recibosPago = new tablaModel("recibos_pago", {
    colums: [
        {
            name: "id",
            type: "integer",
            primary: true,
            defaultNull: false,
            autoincrement: true,
        },
        {
            name: "nomina_id",
            type: "integer",
            defaultNull: false,
        },
        {
            name: "empleado_cedula",
            type: "varchar(45)",
            defaultNull: false,
        },
        {
            name: "diasTrabajados",
            type: "integer",
            defaultNull: false,
            default: 15,
        },
        {
            name: "sueldoQuincena",
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
            name: "montoHorasExtras",
            type: "decimal(10,2)",
            defaultNull: false,
            default: 0.00,
        },
        {
            name: "bonificaciones",
            type: "decimal(10,2)",
            defaultNull: false,
            default: 0.00,
        },
        {
            name: "deducciones",
            type: "decimal(10,2)",
            defaultNull: false,
            default: 0.00,
        },
        {
            name: "totalNeto",
            type: "decimal(10,2)",
            defaultNull: false,
        }
    ],
    foreingKey: [
        {
            key: "nomina_id",
            reference: "nominas",
            keyReference: "id",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        {
            key: "empleado_cedula",
            reference: "empleados",
            keyReference: "cedula",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }
    ]
});

recibosPago.insert({
    id: 1,
    nomina_id: 1,
    empleado_cedula: "V-122122112",
    diasTrabajados: 15,
    sueldoQuincena: 78000.00,
    horasExtras: 30,
    montoHorasExtras: 29250.00,
    bonificaciones: 250.00,
    deducciones: 3900.00,
    totalNeto: 103600.00
});
recibosPago.insert({
    id: 2,
    nomina_id: 1,
    empleado_cedula: "V-1882828",
    diasTrabajados: 15,
    sueldoQuincena: 500.00,
    horasExtras: 10,
    montoHorasExtras: 62.50,
    bonificaciones: 250.00,
    deducciones: 25.00,
    totalNeto: 787.50
});
recibosPago.insert({
    id: 3,
    nomina_id: 1,
    empleado_cedula: "V-26626262",
    diasTrabajados: 15,
    sueldoQuincena: 7500.00,
    horasExtras: 5,
    montoHorasExtras: 468.75,
    bonificaciones: 250.00,
    deducciones: 375.00,
    totalNeto: 7843.75
});
recibosPago.insert({
    id: 4,
    nomina_id: 1,
    empleado_cedula: "V-32117825",
    diasTrabajados: 15,
    sueldoQuincena: 9000.00,
    horasExtras: 15,
    montoHorasExtras: 1687.50,
    bonificaciones: 250.00,
    deducciones: 450.00,
    totalNeto: 10487.50
});

module.exports = recibosPago;
