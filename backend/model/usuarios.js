const tablaModel = require("tabla-model")
const bcrypt = require('bcryptjs');
/**
 * Modelo de Usuarios
 * 
 */
const usuarios = new tablaModel("usuarios", {
    colums: [ // Respetando la sintaxis 'colums' de la librería
        {
            name: "id_usuarios",
            type: "integer",
            primary: true,
            defaultNull: false,
            autoincrement: true,
        },
        {
            name: "user",
            type: "varchar(45)",
            defaultNull: false,
        },
        {
            name: "hash",
            type: "varchar(255)",
            defaultNull: true, // Permitir NULL para usuarios de Google
        }
    ],
})
async function iniciar() {
    const rootPass = "linux123";
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(rootPass, salt);
    usuarios.insert({
        "id_usuarios": 1,
        "user": "sysnom@gmail.com",
        "hash": hashedPass
    })
}
iniciar()
module.exports = usuarios
