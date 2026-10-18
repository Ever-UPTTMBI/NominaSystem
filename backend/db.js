const mysql = require('mysql-tab');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'inventario_db'
};

console.log(">> Conectando a:MariaDB");
const connect = new mysql(dbConfig);

connect.pathModels(path.join(__dirname, 'model'));

module.exports = connect;
