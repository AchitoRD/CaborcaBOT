const { EmbedBuilder, MessageFlags } = require('discord.js'); 
const adminConfigCommand = require('../commands/admin/configurar.js'); // Importa el comando configurar para sus manejadores
const voteHandler = require('./voteHandler.js'); // Importa el nuevo manejador de votos

module.exports = async (interaction, client) => {
    // Manejo de interacciones de botones
    if (interaction.isButton()) {
        const { customId } = interaction;

        // Redirige a los manejadores específicos según el customId del botón.
        if (customId.startsWith('config_')) {
            // Si el customId comienza con 'config_', lo maneja el comando de configuración.
            return await adminConfigCommand.handleButton(interaction);
        } else if (customId.startsWith('open_vote_')) {
            // Si el customId comienza con 'open_vote_', lo maneja el nuevo voteHandler.
            return await voteHandler.handleVoteButton(interaction, client);
        }
        // Puedes añadir más bloques 'else if' para otros grupos de botones...
        else {
            // Si el botón no está asignado a ningún manejador conocido.
            console.log(`Custom ID de botón no manejado por interactionHandler: ${customId}`);
            // Responde al usuario de forma efímera.
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: '🤔 Este botón no tiene una acción asignada.', ephemeral: true });
            } else {
                await interaction.editReply({ content: '🤔 Este botón no tiene una acción asignada.', ephemeral: true });
            }
        }
    }
    // Manejo de interacciones de select menus
    else if (interaction.isStringSelectMenu()) {
        const { customId } = interaction;
        if (customId.startsWith('config_')) {
            // Si el customId comienza con 'config_', lo maneja el comando de configuración.
            return await adminConfigCommand.handleSelectMenu(interaction);
        }
        // Puedes añadir más bloques 'else if' para otros grupos de select menus...
        else {
            // Si el select menu no está asignado a ningún manejador conocido.
            console.log(`Custom ID de select menu no manejado por interactionHandler: ${customId}`);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: '🤔 Este menú desplegable no tiene una acción asignada.', ephemeral: true });
            } else {
                await interaction.editReply({ content: '🤔 Este menú desplegable no tiene una acción asignada.', ephemeral: true });
            }
        }
    }
    // Manejo de interacciones de modales (modalSubmit)
    else if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        if (customId.startsWith('config_')) {
            // Si el customId comienza con 'config_', lo maneja el comando de configuración.
            return await adminConfigCommand.handleModalSubmit(interaction);
        }
        // Puedes añadir más bloques 'else if' para otros grupos de modales...
        else {
            // Si el modal no está asignado a ningún manejador conocido.
            console.log(`Custom ID de modal no manejado por interactionHandler: ${customId}`);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: '🤔 Este modal no tiene una acción asignada.', ephemeral: true });
            } else {
                await interaction.editReply({ content: '🤔 Este modal no tiene una acción asignada.', ephemeral: true });
            }
        }
    }
    // Si la interacción no es un tipo de componente o modal manejado, loguea un mensaje.
    else {
        console.log('Interacción no manejada por interactionHandler (tipo desconocido):', interaction.type);
    }
};