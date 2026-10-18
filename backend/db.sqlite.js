const SQLite = require('sqlite3-tab');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

// Garantizar que la carpeta db exista independientemente desde dónde se ejecute el proceso
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Ruta absoluta al archivo .sqlite (funciona tanto desde la raíz como desde /backend)
const dbPath = path.join(dbDir, 'nomina.sqlite');
const connect = new SQLite(dbPath);

console.log(">> Conectando a:Sqlite3 en", dbPath);

connect.pathModels(path.join(__dirname, 'model'));

module.exports = connect;

