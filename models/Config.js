// models/Config.js
const { DataTypes } = require('sequelize');
const configSequelize = require('../database/configDatabase'); // Importa la DB de configuración

const Config = configSequelize.define('Config', {
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Cada clave de configuración debe ser única (ej: 'giveRoles', 'collectCooldown')
        primaryKey: true
    },
    value: {
        type: DataTypes.JSON, // Usamos JSON para guardar arrays de IDs de roles, objetos de configuración, etc.
        allowNull: false
    },
}, {
    timestamps: false // No necesitamos createdAt y updatedAt
});

module.exports = Config;