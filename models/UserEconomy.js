// models/UserEconomy.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => { // <-- ¡Cambiado a exportar una función!
    const UserEconomy = sequelize.define('UserEconomy', {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        balance: {
            type: DataTypes.INTEGER,
            defaultValue: 500, // Dinero inicial para nuevos jugadores (ej: 500 Caborca Bucks)
            allowNull: false
        },
        inventory: {
            type: DataTypes.JSON, // Para almacenar un array de IDs de ítems (ej: ["pistola_juguete", "coche_usado"])
            defaultValue: [],
            allowNull: false
        },
    }, {
        timestamps: false // No necesitamos createdAt y updatedAt para la economía
    });

    return UserEconomy; // <-- Devuelve el modelo definido
};