// handlers/commandHandler.js
const fs = require('node:fs');
const path = require('node:path');
const { Events } = require('discord.js'); // Importa Events si no está ya

module.exports = (client) => {
    client.commands = new Map(); // Asegúrate de que sea un Map (Collection)

    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            // Asegúrate de que el comando tenga propiedades 'data' y 'execute'
            if ('data' in command && 'execute' in command) {
                // *** MODIFICACIÓN CLAVE AQUÍ ***
                // Creamos una nueva función 'execute' que primero difiere la interacción
                // y luego llama a la función 'execute' original del comando.
                const originalExecute = command.execute; // Guarda la función execute original

                command.execute = async (interaction) => {
                    // Diferir la interacción automáticamente, solo si aún no ha sido respondida/diferida
                    if (!interaction.deferred && !interaction.replied) {
                        try {
                            // Deferir de forma efímera para que solo el usuario vea el "Bot está pensando..."
                            // Si tu comando necesita responder públicamente, necesitarás que el comando lo haga de forma diferente.
                            await interaction.deferReply({ ephemeral: true });
                        } catch (deferError) {
                            console.error(`Error al diferir la interacción para el comando ${interaction.commandName}:`, deferError);
                            // Si la deferencia falla (ej: Interaction unknown), intentamos responder directamente
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({ content: '❌ Hubo un error inicial al procesar tu comando. Intenta de nuevo.', ephemeral: true });
                            }
                            return; // Salir si no podemos deferir
                        }
                    }

                    // Ahora ejecuta la lógica original del comando.
                    // El comando ya sabe que está diferido y usará editReply().
                    await originalExecute(interaction);
                };
                // *** FIN DE LA MODIFICACIÓN CLAVE ***

                client.commands.set(command.data.name, command);
                console.log(`[Cargado] Comando: ${command.data.name} de la carpeta ${folder}`);
            } else {
                console.warn(`[Advertencia] El comando en ${filePath} le falta una propiedad "data" o "execute" requerida.`);
            }
        }
    }
    console.log('--- Comandos cargados con éxito ---');
};