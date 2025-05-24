// models/Verification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/configDatabase'); // <--- ¡ESTO ES LO CORRECTO AHORA!

const Verification = sequelize.define('Verification', {
    discordId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    robloxName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    comprobanteUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
    },
    messageId: { // Opcional, pero útil
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = Verification;