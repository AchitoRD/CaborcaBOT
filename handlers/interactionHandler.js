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

// Importar modelos y utilidades necesarias
const ServerVote = require('../models/ServerVote');
const { createCaborcaEmbed } = require('../utils/embedBuilder');
const { shop, serverBannerUrl, embedColor } = require('../config');

module.exports = async (interaction, client) => {
    // Si es un comando de barra, lo maneja index.js directamente (esto ya está en tu index.js)
    if (interaction.isChatInputCommand()) return;

    const customId = interaction.customId;

    // Redirige las interacciones de verificación al buttonHandler existente (si 'verify_' es un handler separado)
    if (customId.startsWith('verify_')) {
        return await require('./buttonHandler')(interaction, client);
    }

    // Comprobación para evitar que otros usuarios interactúen con paneles ajenos
    // Esto es válido para la mayoría de los botones/modales iniciados por un comando slash.
    if (interaction.message && interaction.message.interaction && interaction.message.interaction.user.id !== interaction.user.id) {
        // Excepción: Botones de votación que deben ser para todos
        if (!customId.startsWith('vote_') && !customId.startsWith('unvote_')) {
            return await interaction.reply({ content: '❌ Solo la persona que inició este panel puede interactuar con él.', flags: MessageFlags.Ephemeral });
        }
    }

    try {
        // --- Manejo de interacciones de Botones ---
        if (interaction.isButton()) {
            // Delega los botones relacionados con el comando 'configurar' a su propio handler
            if (customId.startsWith('config_') || customId.startsWith('confirm_clear_config_')) {
                const configurarCommand = client.commands.get('configurar');
                if (configurarCommand && configurarCommand.handleButton) {
                    return await configurarCommand.handleButton(interaction);
                }
            }

            // Lógica para otros botones no relacionados con 'configurar'
            // Aquí puedes añadir más casos para otros customId que NO sean del panel de configuración
            switch (customId) {
                case 'vote_for_apertura':
                case 'unvote_for_apertura':
                    const vote = await ServerVote.findByPk(interaction.message.id);
                    if (!vote) {
                        return await interaction.reply({ content: '❌ Esta votación ya no existe.', flags: MessageFlags.Ephemeral });
                    }

                    if (customId === 'vote_for_apertura') {
                        if (vote.voters.includes(interaction.user.id)) {
                            return await interaction.reply({ content: 'Ya has votado para abrir el servidor.', flags: MessageFlags.Ephemeral });
                        }
                        vote.votes['abrir_servidor'] = (vote.votes['abrir_servidor'] || 0) + 1;
                        vote.voters.push(interaction.user.id);
                    } else if (customId === 'unvote_for_apertura') {
                        if (!vote.voters.includes(interaction.user.id)) {
                            return await interaction.reply({ content: 'No has votado en esta instancia.', flags: MessageFlags.Ephemeral });
                        }
                        vote.votes['abrir_servidor'] = Math.max(0, (vote.votes['abrir_servidor'] || 0) - 1);
                        vote.voters = vote.voters.filter(id => id !== interaction.user.id);
                    }
                    await vote.save();

                    const updatedEmbed = new EmbedBuilder(interaction.message.embeds[0].toJSON())
                        .spliceFields(0, 1, { name: 'Votos Actuales:', value: `Total: **${vote.votes['abrir_servidor']}**` });

                    await interaction.update({ embeds: [updatedEmbed] });
                    break;

                case 'eco_back_to_main':
                case 'user_role_back_to_main':
                case 'welcome_back_to_main':
                    await interaction.update({ content: '⚙️ Volviendo al panel principal. Por favor, usa el menú desplegable para navegar.', embeds: [], components: [] });
                    break;

                // Si 'confirm_clear_db_yes' y 'confirm_clear_db_no' NO son manejados por 'configurar.js'
                // y son botones genéricos de borrado de otra cosa, su lógica iría aquí.
                // Como te di una versión de 'configurar.js' que maneja 'confirm_clear_config_yes/no',
                // esta sección podría ser redundante si esos IDs no se usan en otro lugar.
                /*
                case 'confirm_clear_db_yes':
                case 'confirm_clear_db_no': {
                    // ... tu lógica para borrar la DB de verificación o algo no relacionado con el config general
                    break;
                }
                case 'confirm_clear_verifications_yes':
                case 'confirm_clear_verifications_no': {
                    // ... tu lógica aquí
                    break;
                }
                */

                default:
                    // Si el customId no coincide con ninguna de las condiciones de 'configurar'
                    // ni con los casos específicos definidos aquí.
                    console.log(`Custom ID de botón no manejado por interactionHandler: ${customId}`);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: '❌ Esta opción de botón no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                    } else if (interaction.deferred) {
                        await interaction.editReply({ content: '❌ Esta opción de botón no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                    }
                    break;
            }
        }
        // --- Manejo de interacciones de Modales ---
        else if (interaction.isModalSubmit()) {
            // Delega los modales relacionados con el comando 'configurar' a su propio handler
            // Se puede hacer de forma más genérica si el customId del modal incluye el nombre del comando
            const configModals = [
                'modal_police_roles', 'modal_roles_give', 'modal_collect_config',
                'modal_work_config', 'modal_unverified_role', 'modal_citizen_role',
                'modal_staff_roles', 'modal_logs_channel', 'modal_welcome_channel',
                'modal_welcome_message', 'modal_ticket_category', 'modal_use_item_roles'
            ];

            if (configModals.includes(customId)) {
                const configurarCommand = client.commands.get('configurar');
                if (configurarCommand && configurarCommand.handleModalSubmit) {
                    return await configurarCommand.handleModalSubmit(interaction);
                }
            }
            // Aquí puedes añadir la lógica para otros modales no relacionados con 'configurar'
            // O un `default` si decides usar un switch aquí.
            else { // Si el customId del modal no está en la lista de modales de configurar
                console.log(`Custom ID de modal no manejado por interactionHandler: ${customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Esta opción de modal no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Esta opción de modal no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                }
            }
        }
        // --- Manejo de interacciones de Select Menus ---
        else if (interaction.isStringSelectMenu()) {
            // Delega el select menu de configuración al comando 'configurar'
            if (customId === 'config_select_menu') {
                const configurarCommand = client.commands.get('configurar');
                if (configurarCommand && configurarCommand.handleSelectMenu) {
                    return await configurarCommand.handleSelectMenu(interaction);
                }
            }
            // Aquí puedes añadir la lógica para otros select menus no relacionados con 'configurar'
            // O un `default` si decides usar un switch aquí.
            else { // Si el customId del select menu no es el de configurar
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