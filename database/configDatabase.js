// database/configDatabase.js
const { Sequelize } = require('sequelize');
const path = require('node:path');

const configSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'config.sqlite'), // Archivo de la base de datos de configuración
    logging: false, // Puedes establecer a true para ver los logs de SQL
});

module.exports = configSequelize;