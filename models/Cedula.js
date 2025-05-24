// models/Cedula.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/database');

const Cedula = sequelize.define('Cedula', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Cada usuario solo puede tener una cédula
        primaryKey: true // El ID de Discord del usuario como clave primaria
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fechaNacimiento: {
        type: DataTypes.STRING, // Guardamos como string en formato DD/MM/AAAA (ej: "25/12/1995")
        allowNull: false
    },
    // Este es un campo VIRTUAL: no se guarda en la base de datos, se calcula al leer
    edad: { 
        type: DataTypes.VIRTUAL, // ¡CRUCIAL! Esto evita que Sequelize intente crear una columna 'Edad'
        get() {
            const fechaNacimientoStr = this.getDataValue('fechaNacimiento');
            if (!fechaNacimientoStr) return 'N/A'; // Si no hay fecha, no podemos calcular

            // Parseamos la fecha de nacimiento (DD/MM/AAAA)
            const [dia, mes, ano] = fechaNacimientoStr.split('/').map(Number);
            // Creamos un objeto Date para la fecha de nacimiento (mes en JS es 0-11)
            const fechaNacimiento = new Date(ano, mes - 1, dia); 

            const hoy = new Date();
            let edadCalculada = hoy.getFullYear() - fechaNacimiento.getFullYear();
            
            // Ajustamos la edad si el cumpleaños de este año aún no ha pasado
            const mesHoy = hoy.getMonth();
            const diaHoy = hoy.getDate();
            const mesNac = fechaNacimiento.getMonth();
            const diaNac = fechaNacimiento.getDate();

            if (mesHoy < mesNac || (mesHoy === mesNac && diaHoy < diaNac)) {
                edadCalculada--;
            }
            return edadCalculada;
        }
    },
    nacionalidad: {
        type: DataTypes.STRING,
        allowNull: false
    },
    genero: { 
        type: DataTypes.STRING,
        allowNull: true // Puede ser nulo si el usuario no lo proporciona
    },
    tipoSangre: { 
        type: DataTypes.STRING,
        allowNull: true // Puede ser nulo
    },
    descripcion: { 
        type: DataTypes.TEXT, // Usamos TEXT para descripciones más largas
        allowNull: true // Puede ser nulo
    },
    dniImageUrl: { // La URL de la imagen de fondo para el embed del DNI
        type: DataTypes.STRING,
        allowNull: true 
    },
    fechaRegistro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Se guarda automáticamente la fecha y hora de registro
        allowNull: false
    }
}, {
    // Opciones del modelo
    timestamps: false // Deshabilita las columnas `createdAt` y `updatedAt` automáticas
});

module.exports = Cedula;