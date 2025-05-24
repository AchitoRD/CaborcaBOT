// database/economyDatabase.js
const { Sequelize } = require('sequelize');
const path = require('node:path');

// Inicializa Sequelize para usar SQLite, con un archivo de DB diferente
const economySequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'economy.sqlite'), // Archivo de la base de datos de economía
    logging: false, // Puedes establecer a true para ver los logs de SQL
});

module.exports = economySequelize;