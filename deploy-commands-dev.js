// deploy-commands-dev.js
const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Lectura recursiva de comandos
function readCommandFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            readCommandFiles(fullPath);
        } else if (file.isFile() && file.name.endsWith('.js')) {
            if (!fullPath.includes('deploy-commands-dev.js')) {
                try {
                    const command = require(fullPath);
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                    } else {
                        console.warn(`⚠️ [ADVERTENCIA] El comando en ${fullPath} le falta "data" o "execute".`);
                    }
                } catch (error) {
                    console.error(`❌ [ERROR DE CARGA] en ${fullPath}: ${error.message}`);
                }
            }
        }
    }
}

readCommandFiles(commandsPath);

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`🛠️ Desplegando ${commands.length} comandos solo en GUILD (${guildId})`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId), // SOLO EN TEST SERVER
            { body: commands },
        );

        console.log(`✅ ¡Comandos GUILD desplegados con éxito! Total: ${data.length}`);
        console.log(`⚡ Se reflejarán en segundos en tu servidor de pruebas.`);
    } catch (error) {
        console.error('❌ ¡Error al desplegar comandos GUILD:', error);
    }
})();
