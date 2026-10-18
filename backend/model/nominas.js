const tablaModel = require("tabla-model");

/**
 * Modelo de Nóminas (Periodos de Pago)
 * Representa cada proceso de nómina quincenal o mensual
 */
const nominas = new tablaModel("nominas", {
    colums: [
        {
            name: "id",
            type: "integer",
            primary: true,
            defaultNull: false,
            autoincrement: true,
        },
        {
            name: "periodo",
            type: "varchar(60)",
            defaultNull: false,
        },
        {
            name: "fechaInicio",
            type: "date",
            defaultNull: false,
        },
        {
            name: "fechaFin",
            type: "date",
            defaultNull: false,
        },
        {
            name: "fechaPago",
            type: "date",
            defaultNull: false,
        },
        {
            name: "estado",
            type: "varchar(20)",
            defaultNull: false,
            default: "'Borrador'",
        }
    ],
});

nominas.insert({
    id: 1,
    periodo: "1ra Quincena Octubre 2026",
    fechaInicio: "2026-10-01",
    fechaFin: "2026-10-15",
    fechaPago: "2026-10-15",
    estado: "Pagada"
});

module.exports = nominas;
