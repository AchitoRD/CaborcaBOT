// models/Arresto.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Arresto = sequelize.define('Arresto', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: { // ID del usuario arrestado (obligatorio)
            type: DataTypes.STRING,
            allowNull: false,
        },
        policiaId: { // ID del policía que realizó el arresto (obligatorio)
            type: DataTypes.STRING,
            allowNull: false,
        },
        razon: { // Descripción detallada o razón del arresto (obligatorio, usado desde la opción 'descripcion')
            type: DataTypes.TEXT,
            allowNull: false,
        },
        fecha: { // Fecha y hora del arresto (se llena automáticamente)
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
        },
        fotoUrl: { // URL de la foto/evidencia (opcional)
            type: DataTypes.STRING,
            allowNull: true,
        },
        tiempoMinutos: { // Tiempo de arresto en minutos (obligatorio, ya que el comando lo pide así)
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0, // Valor por defecto si no se especifica, aunque el comando lo hace requerido
        },
        articulos: { // Artículos incautados (opcional)
            type: DataTypes.TEXT, // Se almacenará como texto, puedes cambiar a JSON si es una lista compleja
            allowNull: true,
        },
    }, {
        timestamps: true, // `createdAt` y `updatedAt` para control de registro
        tableName: 'Arrestos', // Nombre explícito de la tabla
    });

    return Arresto;
};