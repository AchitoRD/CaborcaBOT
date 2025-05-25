// events/interactionCreate.js
const { Events, InteractionType } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 🚀 Deferir la respuesta para dar tiempo al procesamiento (¡MUY IMPORTANTE!)
        // Esto le dice a Discord que tu bot está "pensando" y evita el "Interaction failed"
        if (interaction.isCommand() || interaction.isButton() || interaction.isStringSelectMenu()) {
            await interaction.deferReply({ ephemeral: false }).catch(error => {
                // Manejo de errores si la deferencia falla (ej. interacción ya respondida)
                console.error(`❌ Error al deferir respuesta para la interacción ${interaction.id}:`, error);
            });
        }

        // --- Manejo de comandos de barra (/) ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ No se encontró el comando ${interaction.commandName}.`);
                return interaction.followUp({ content: '🚫 ¡Este comando no existe o no está cargado correctamente!', ephemeral: true });
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Error al ejecutar el comando ${interaction.commandName}:`, error);
                // Intenta responder al usuario sobre el error
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({ content: 'Oops! Hubo un error al ejecutar este comando. 😔', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Oops! Hubo un error al ejecutar este comando. 😔', ephemeral: true });
                }
            }
        }
        // --- Otros tipos de interacciones ---
        else if (interaction.isButton()) {
            // Lógica para botones
            // Podrías tener un sistema de manejo de botones aquí
            // const buttonId = interaction.customId;
            // console.log(`🔘 Botón presionado: ${buttonId}`);
            // await interaction.followUp({ content: '¡Botón presionado!', ephemeral: true });
        }
        else if (interaction.isStringSelectMenu()) {
            // Lógica para menús de selección
            // const selectedValue = interaction.values[0];
            // console.log(`🔽 Opción seleccionada: ${selectedValue}`);
            // await interaction.followUp({ content: `Seleccionaste: ${selectedValue}`, ephemeral: true });
        }
        // Puedes añadir más tipos de interacciones aquí
        // else if (interaction.isModalSubmit()) { ... }
    },
};