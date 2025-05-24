// models/ServerVote.js
const { DataTypes } = require('sequelize');
const configSequelize = require('../database/configDatabase'); // Reutiliza tu instancia de Sequelize para configuración

const ServerVote = configSequelize.define('ServerVote', {
    // ID único para la votación (podría ser el ID del mensaje de Discord)
    messageId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    // ID del canal donde está el mensaje de votación
    channelId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Estado actual de la votación: 'open', 'closed', 'passed', 'failed'
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'open',
    },
    // Conteo de votos a favor
    yesVotes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // Conteo de votos en contra (si aplicara, aunque aquí es más por código)
    noVotes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // Usuarios que ya han votado (para evitar votos duplicados)
    // Se guarda como un JSON string de un array de IDs de usuario
    votedUsers: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]', // Un array JSON vacío por defecto
        get() {
            const rawValue = this.getDataValue('votedUsers');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('votedUsers', JSON.stringify(value));
        }
    },
    // Usuarios que han introducido el código correcto
    codeVoters: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]', // Un array JSON vacío por defecto
        get() {
            const rawValue = this.getDataValue('codeVoters');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('codeVoters', JSON.stringify(value));
        }
    },
    // La fecha y hora en que se inició la votación
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    // El objetivo de votos (15 en tu caso)
    targetVotes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15,
    },
    // El código para votar
    voteCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'CABORCA',
    }
}, {
    // Opciones del modelo
    tableName: 'server_votes', // Nombre de la tabla en la DB
    timestamps: true, // `createdAt` y `updatedAt`
});

module.exports = ServerVote;