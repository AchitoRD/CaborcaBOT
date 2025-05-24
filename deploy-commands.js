// deploy-commands.js
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { clientId, guildId, token } = require('./config');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.warn(`[Advertencia] El comando en ${filePath} le falta una propiedad "data" o "execute" requerida.`);
        }
    }
}

// --- ELIMINA ESTE BLOQUE COMPLETAMENTE ---
/*
commands.push(
    new SlashCommandBuilder()
        .setName('configurar')
        .setDescription('Abre el panel de configuración del bot.')
        .setDefaultMemberPermissions(0)
    .toJSON()
);
*/
// --- FIN DEL BLOQUE A ELIMINAR ---

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`🚀 Iniciando el despliegue de ${commands.length} comandos de aplicación (/).`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`✅ Se recargaron con éxito ${data.length} comandos de aplicación (/) en el servidor.`);
    } catch (error) {
        console.error('❌ Error al desplegar comandos:', error);
    }
})();