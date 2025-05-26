// handlers/commandHandler.js
const fs = require('node:fs');
const path = require('node:path');

module.exports = (client) => {
    // 🚀 Inicializamos el mapa de comandos para una gestión eficiente
    client.commands = new Map();

    const foldersPath = path.join(__dirname, '..', 'commands');

    try {
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                try {
                    const command = require(filePath);

                    // ✅ Verificamos que el comando tenga las propiedades esenciales
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        // --- ¡AÑADE ESTA LÍNEA! ---
                        command.category = folder; // Asigna el nombre de la carpeta como categoría
                        // --- FIN DE LA ADICIÓN ---
                        console.log(`✨ Comando cargado: "${command.data.name}" desde la carpeta "${folder}"`);
                    } else {
                        console.warn(`⚠️ Advertencia: El comando en "${filePath}" no tiene las propiedades "data" o "execute" requeridas. ¡Revisa tu código!`);
                    }
                } catch (error) {
                    console.error(`❌ Error al cargar el archivo de comando "${file}" en "${folder}":\n`, error);
                }
            }
        }
        console.log('--- 🎉 ¡Todos los comandos han sido cargados con éxito! 🎉 ---');
    } catch (error) {
        console.error(`💥 Error al leer las carpetas de comandos en "${foldersPath}":\n`, error);
        console.error('--- 🚨 ¡La carga de comandos ha fallado críticamente! 🚨 ---');
    }
};