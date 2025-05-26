// deploy-commands.js
const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Función recursiva para encontrar todos los archivos de comandos .js en todas las subcarpetas
function readCommandFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            readCommandFiles(fullPath); // Si es un directorio, entra recursivamente
        } else if (file.isFile() && file.name.endsWith('.js')) {
            // Asegúrate de que no estás intentando requerir el propio deploy-commands.js si está en commands/
            // Aunque por el nombre parece que está fuera de commands/
            if (!fullPath.includes('deploy-commands.js')) { // Pequeña seguridad extra
                 try {
                    const command = require(fullPath);
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                    } else {
                        console.warn(`⚠️ [ADVERTENCIA] El comando en ${fullPath} le falta una propiedad "data" o "execute" requerida. ¡Revisa eso!`);
                    }
                } catch (error) {
                    console.error(`❌ [ERROR DE CARGA] No se pudo cargar el comando en ${fullPath}: ${error.message}`);
                }
            }
        }
    }
}

readCommandFiles(commandsPath); // Inicia la lectura recursiva desde la carpeta 'commands'

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`🚀 Iniciando el despliegue de ${commands.length} comandos de aplicación (/). ¡Prepárate!`);

        // Despliega los comandos solo en el servidor específico (guild commands)
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`✅ ¡Éxito! Se recargaron ${data.length} comandos de aplicación (/) en el servidor. ¡A usarlo!`);
    } catch (error) {
        console.error('❌ ¡OH NO! Error al desplegar comandos:', error);
    }
})();