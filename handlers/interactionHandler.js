// handlers/interactionHandler.js
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const { createCaborcaEmbed } = require('../utils/embedBuilder');
const { shop, serverBannerUrl, embedColor } = require('../config');

module.exports = async (interaction, client) => {
    if (interaction.isChatInputCommand()) return;

    const customId = interaction.customId;

    if (interaction.message && interaction.message.interaction && interaction.message.interaction.user.id !== interaction.user.id) {
        if (!customId.startsWith('vote_') && !customId.startsWith('unvote_')) {
            return await interaction.reply({ content: '❌ Solo la persona que inició este panel puede interactuar con él.', flags: MessageFlags.Ephemeral });
        }
    }

    try {
        if (interaction.isButton()) {
            if (customId.startsWith('config_') || customId.startsWith('confirm_clear_config_')) {
                const configurarCommand = client.commands.get('configurar');
                if (configurarCommand && configurarCommand.handleButton) {
                    return await configurarCommand.handleButton(interaction);
                }
            } else if (customId.startsWith('confirm_clear_verifications_')) {
                const borrarVerificacionesCommand = client.commands.get('borrarverificaciones');
                if (borrarVerificacionesCommand && borrarVerificacionesCommand.handleButton) {
                    return await borrarVerificacionesCommand.handleButton(interaction);
                }
            }
            // ... otras delegaciones de botones
            switch (customId) {
                default:
                    console.log(`Custom ID de botón no manejado por interactionHandler: ${customId}`);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: '❌ Esta opción de botón no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                    } else if (interaction.deferred) {
                        await interaction.editReply({ content: '❌ Esta opción de botón no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                    }
                    break;
            }
        } else if (interaction.isModalSubmit()) {
            if (customId.startsWith('config_') && customId.endsWith('_modal')) {
                const configurarCommand = client.commands.get('configurar');
                if (configurarCommand && configurarCommand.handleModalSubmit) {
                    return await configurarCommand.handleModalSubmit(interaction);
                }
            }
            // ... otras delegaciones de modales
            else {
                console.log(`Custom ID de modal no manejado por interactionHandler: ${customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Esta opción de modal no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Esta opción de modal no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            if (customId === 'config_select_menu') {
                const configurarCommand = client.commands.get('configurar');
                if (configurarCommand && configurarCommand.handleSelectMenu) {
                    return await configurarCommand.handleSelectMenu(interaction);
                }
            } else if (customId === 'help_category_select') {
                const helpCommand = client.commands.get('help');
                if (helpCommand && helpCommand.handleSelectMenu) {
                    return await helpCommand.handleSelectMenu(interaction);
                }
            }
            // --- NUEVA DELEGACIÓN PARA EL MENÚ DESPLEGABLE DE LA TIENDA ---
            else if (customId === 'shop_category_select') {
                const tiendaCommand = client.commands.get('tienda'); // Asegúrate de que tu comando se llama 'tienda'
                if (tiendaCommand && tiendaCommand.handleShopSelectMenu) { // Llama a la nueva función específica
                    return await tiendaCommand.handleShopSelectMenu(interaction);
                }
            }
            // --- FIN DE LA NUEVA DELEGACIÓN ---
            // ... otras delegaciones de select menus
            else {
                console.log(`Custom ID de select menu no manejado por interactionHandler: ${customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Esta opción de menú desplegable no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Esta opción de menú desplegable no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                }
            }
        }
    } catch (error) {
        console.error(`Error al procesar interacción con customId ${customId}:`, error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ Hubo un error al procesar tu solicitud. Intenta de nuevo.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: '❌ Hubo un error al procesar tu solicitud. Intenta de nuevo.', flags: MessageFlags.Ephemeral });
        }
    }
};