const { Sequelize } = require('sequelize');
const path = require('node:path');

const economySequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'economy.sqlite'), // Asegúrate de que esta ruta sea correcta
    logging: false, // Desactiva el logging de SQL para la consola, útil en producción
});

// Importar y pasar la instancia de Sequelize a cada modelo
const UserEconomy = require('../models/UserEconomy')(economySequelize);
const Arresto = require('../models/Arresto')(economySequelize);
const Multa = require('../models/Multa')(economySequelize);
// const ServerVote = require('../models/ServerVote')(economySequelize); // ¡COMENTADO O ELIMINADO!

// Si tienes asociaciones entre modelos, defínelas aquí

module.exports = {
    economySequelize,
    UserEconomy,
    Arresto,
    Multa,
  
};