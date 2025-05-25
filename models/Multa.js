// models/Multa.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Multa = sequelize.define('Multa', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: { // ID del usuario multado (obligatorio)
            type: DataTypes.STRING,
            allowNull: false,
        },
        policiaId: { // ID del policía que impuso la multa (obligatorio)
            type: DataTypes.STRING,
            allowNull: false,
        },
        cantidad: { // Valor monetario de la multa (obligatorio)
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        razon: { // Razón general de la multa (se llenará automáticamente con info de placa y valor)
            type: DataTypes.TEXT,
            allowNull: true, // Puede ser opcional, ya que los comandos generan una razón
        },
        pagada: { // Estado de la multa (pagada/pendiente, por defecto pendiente)
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        },
        fecha: { // Fecha y hora de la multa (se llena automáticamente)
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        fotoUrl: { // URL de la foto/evidencia (opcional)
            type: DataTypes.STRING,
            allowNull: true,
        },
        tiempoMinutos: { // Tiempo adicional de castigo en minutos (opcional)
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        placa: { // Placa del vehículo o ID de la persona multada (obligatorio)
            type: DataTypes.STRING,
            allowNull: false,
        },
        articulos: { // Artículos incautados al momento de la multa (opcional)
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        timestamps: true, // `createdAt` y `updatedAt` para control de registro
        tableName: 'Multas', // Nombre explícito de la tabla
    });

    return Multa;
};