// database/database.js
const { Sequelize } = require('sequelize');
const path = require('node:path');

// Inicializa Sequelize para usar SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'), // El archivo de la base de datos se guardará aquí
    logging: false, // Puedes establecer a true para ver los logs de SQL en la consola (útil para depurar)
});

module.exports = sequelize;