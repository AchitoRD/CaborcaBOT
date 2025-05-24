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
// *** ESTA LÍNEA ES CLAVE: Se añadió initializeConfigs aquí ***
const { getConfig, saveConfig, clearAllConfigs, initializeConfigs } = require('../utils/configManager');
const { createCaborcaEmbed } = require('../utils/embedBuilder');
const { shop, serverBannerUrl, embedColor } = require('../config');

// Función auxiliar para generar el panel de configuración principal
async function generateConfigPanelEmbedAndComponents(client, user) {
    const configEmbed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('⚙️ Panel de Configuración de Caborca Bot')
        .setDescription('Aquí puedes ajustar varias configuraciones de tu bot. Selecciona una opción para comenzar.')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: 'Opciones Principales:', value: 'Usa los botones o el menú para configurar:' },
            { name: '💰 Economía', value: 'Configura roles y montos para comandos de economía como `/give`, `/collect`, `/work`.', inline: true },
            { name: '👥 Roles de Usuario', value: 'Define roles para `No Verificado`, `Ciudadano`, y `Staff`.', inline: true },
            { name: '📝 Canal de Logs', value: 'Establece el canal donde el bot enviará registros.', inline: true },
            { name: '👋 Mensajes de Bienvenida', value: 'Configura mensajes automáticos para nuevos miembros.', inline: true },
            { name: '🎟️ Tickets', value: 'Define la categoría para los canales de tickets.', inline: true },
            { name: '✨ Roles por Uso de Ítem', value: 'Configura qué roles pueden usar ítems de tu tienda.', inline: true },
            { name: '🗑️ Vaciar Configuración', value: 'Borra todas las configuraciones guardadas. ¡Úsalo con precaución!', inline: true },
            { name: '❌ Cerrar Panel', value: 'Cierra esta ventana de configuración.', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: `Solicitado por ${user.tag}`, iconURL: user.displayAvatarURL() });

    const rowButtons1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('config_economy_btn').setLabel('Economía').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('config_user_roles_btn').setLabel('Roles de Usuario').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('config_logs_channel_btn').setLabel('Canal de Logs').setStyle(ButtonStyle.Primary),
        );

    const rowButtons2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('config_welcome_messages_btn').setLabel('Bienvenida').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('config_ticket_channel_btn').setLabel('Tickets').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('config_use_item_roles_btn').setLabel('Roles de Ítems').setStyle(ButtonStyle.Primary),
        );

    const rowButtons3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('config_clear_db_btn').setLabel('Vaciar Configuración').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('config_exit_btn').setLabel('Cerrar Panel').setStyle(ButtonStyle.Secondary),
        );

    return {
        embeds: [configEmbed],
        components: [rowButtons1, rowButtons2, rowButtons3]
    };
}


module.exports = async (interaction, client) => {
    if (interaction.isChatInputCommand()) return;

    const customId = interaction.customId;

    if (customId.startsWith('verify_')) {
        return await require('./buttonHandler')(interaction, client, getConfig);
    }

    if (interaction.message && interaction.message.interaction && interaction.message.interaction.user.id !== interaction.user.id) {
        return await interaction.reply({ content: '❌ Solo la persona que inició el panel puede interactuar con él.', flags: MessageFlags.Ephemeral });
    }

    try {
        switch (customId) {
            case 'config_economy_btn': {
                const economyEmbed = new EmbedBuilder()
                    .setColor(0xFEE75C)
                    .setTitle('💰 Configuración de Economía')
                    .setDescription('Selecciona qué aspecto de la economía deseas configurar.');
                const economyButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('eco_roles_give').setLabel('Roles /give').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('eco_collect_config').setLabel('Comando /collect').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('eco_work_config').setLabel('Comando /work').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('eco_back_to_main').setLabel('Volver').setStyle(ButtonStyle.Danger)
                    );
                await interaction.update({ embeds: [economyEmbed], components: [economyButtons] });
                break;
            }
            case 'eco_roles_give': {
                const modal = new ModalBuilder().setCustomId('modal_roles_give').setTitle('Configurar Roles de /give');
                const rolesInput = new TextInputBuilder().setCustomId('input_roles_give').setLabel('IDs de Roles (separados por comas)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Ej: 123456789012345678, 987654321098765432').setRequired(true);
                modal.addComponents(new ActionRowBuilder().addComponents(rolesInput));
                await interaction.showModal(modal);
                break;
            }
            case 'eco_collect_config': {
                const modal = new ModalBuilder().setCustomId('modal_collect_config').setTitle('Configurar Comando /collect');
                const collectConfig = await getConfig('collectConfig');
                const amountInput = new TextInputBuilder().setCustomId('input_collect_amount').setLabel('Monto de Dinero').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 15000').setRequired(true).setValue(collectConfig?.amount?.toString() || '');
                const cooldownInput = new TextInputBuilder().setCustomId('input_collect_cooldown').setLabel('Cooldown (en milisegundos)').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 3600000 (1 hora)').setRequired(true).setValue(collectConfig?.cooldown?.toString() || '');
                const rolesInput = new TextInputBuilder().setCustomId('input_collect_roles').setLabel('IDs de Roles Permitidos (separados por comas)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Opcional. Ej: 123, 456').setRequired(false).setValue(collectConfig?.roles?.join(', ') || '');
                modal.addComponents(new ActionRowBuilder().addComponents(amountInput), new ActionRowBuilder().addComponents(cooldownInput), new ActionRowBuilder().addComponents(rolesInput));
                await interaction.showModal(modal);
                break;
            }
            case 'eco_work_config': {
                const modal = new ModalBuilder().setCustomId('modal_work_config').setTitle('Configurar Comando /work');
                const workConfig = await getConfig('workConfig');
                const minAmountInput = new TextInputBuilder().setCustomId('input_work_min_amount').setLabel('Monto Mínimo de Dinero').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 500000').setRequired(true).setValue(workConfig?.minAmount?.toString() || '');
                const maxAmountInput = new TextInputBuilder().setCustomId('input_work_max_amount').setLabel('Monto Máximo de Dinero').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 200000000').setRequired(true).setValue(workConfig?.maxAmount?.toString() || '');
                const cooldownInput = new TextInputBuilder().setCustomId('input_work_cooldown').setLabel('Cooldown (en milisegundos)').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 14400000 (4 horas)').setRequired(true).setValue(workConfig?.cooldown?.toString() || '');
                const rolesInput = new TextInputBuilder().setCustomId('input_work_roles').setLabel('IDs de Roles Permitidos (separados por comas)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Opcional. Ej: 123, 456').setRequired(false).setValue(workConfig?.roles?.join(', ') || '');
                modal.addComponents(new ActionRowBuilder().addComponents(minAmountInput), new ActionRowBuilder().addComponents(maxAmountInput), new ActionRowBuilder().addComponents(cooldownInput), new ActionRowBuilder().addComponents(rolesInput));
                await interaction.showModal(modal);
                break;
            }
            case 'eco_back_to_main': {
                await interaction.update(await generateConfigPanelEmbedAndComponents(client, interaction.user));
                break;
            }

            case 'config_user_roles_btn': {
                const rolesEmbed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('👥 Configuración de Roles de Usuario')
                    .setDescription('Define los roles que el bot usará para diferentes estados de usuario.');
                const rolesButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('user_role_unverified').setLabel('Rol No Verificado').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('user_role_citizen').setLabel('Rol Ciudadano (Verificado)').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('user_role_staff').setLabel('Roles de Staff').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('user_role_back_to_main').setLabel('Volver').setStyle(ButtonStyle.Danger)
                    );
                await interaction.update({ embeds: [rolesEmbed], components: [rolesButtons] });
                break;
            }
            case 'user_role_unverified': {
                const modal = new ModalBuilder().setCustomId('modal_unverified_role').setTitle('Configurar Rol No Verificado');
                const unverifiedRoleId = await getConfig('unverifiedRole');
                const roleInput = new TextInputBuilder().setCustomId('input_unverified_role_id').setLabel('ID del Rol No Verificado').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 123456789012345678').setRequired(true).setValue(unverifiedRoleId || '');
                modal.addComponents(new ActionRowBuilder().addComponents(roleInput));
                await interaction.showModal(modal);
                break;
            }
            case 'user_role_citizen': {
                const modal = new ModalBuilder().setCustomId('modal_citizen_role').setTitle('Configurar Rol Ciudadano');
                const citizenRoleId = await getConfig('citizenRole');
                const roleInput = new TextInputBuilder().setCustomId('input_citizen_role_id').setLabel('ID del Rol Ciudadano').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 123456789012345678').setRequired(true).setValue(citizenRoleId || '');
                modal.addComponents(new ActionRowBuilder().addComponents(roleInput));
                await interaction.showModal(modal);
                break;
            }
            case 'user_role_staff': {
                const modal = new ModalBuilder().setCustomId('modal_staff_roles').setTitle('Configurar Roles de Staff');
                const staffRoles = await getConfig('staffRoles');
                const rolesInput = new TextInputBuilder().setCustomId('input_staff_roles_ids').setLabel('IDs de Roles de Staff (separados por comas)').setStyle(TextInputStyle.Paragraph).setPlaceholder('Ej: 123, 456, 789').setRequired(true).setValue(staffRoles?.join(', ') || '');
                modal.addComponents(new ActionRowBuilder().addComponents(rolesInput));
                await interaction.showModal(modal);
                break;
            }
            case 'user_role_back_to_main': {
                await interaction.update(await generateConfigPanelEmbedAndComponents(client, interaction.user));
                break;
            }

            case 'config_logs_channel_btn': {
                const modal = new ModalBuilder().setCustomId('modal_logs_channel').setTitle('Configurar Canal de Logs');
                const logChannelId = await getConfig('logChannelId');
                const channelInput = new TextInputBuilder().setCustomId('input_logs_channel_id').setLabel('ID del Canal de Logs').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 123456789012345678').setRequired(true).setValue(logChannelId || '');
                modal.addComponents(new ActionRowBuilder().addComponents(channelInput));
                await interaction.showModal(modal);
                break;
            }

            case 'config_welcome_messages_btn': {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(0x2ECC71)
                    .setTitle('👋 Configuración de Mensajes de Bienvenida')
                    .setDescription('Gestiona los mensajes y el canal para dar la bienvenida a nuevos miembros.');
                const welcomeButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('welcome_enable_disable').setLabel('Habilitar/Deshabilitar').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_set_channel').setLabel('Establecer Canal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_set_message').setLabel('Establecer Mensaje').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_back_to_main').setLabel('Volver').setStyle(ButtonStyle.Danger)
                    );
                await interaction.update({ embeds: [welcomeEmbed], components: [welcomeButtons] });
                break;
            }
            case 'welcome_enable_disable': {
                const currentStatus = await getConfig('welcomeMessagesEnabled');
                const statusMessage = currentStatus ? 'actualmente **HABILITADOS**.' : 'actualmente **DESHABILITADOS**.';
                await interaction.update({
                    content: `Los mensajes de bienvenida están ${statusMessage}\n¿Qué deseas hacer?`,
                    embeds: [],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('toggle_welcome_on').setLabel('Habilitar').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('toggle_welcome_off').setLabel('Deshabilitar').setStyle(ButtonStyle.Danger)
                        )
                    ]
                });
                break;
            }
            case 'toggle_welcome_on':
                await saveConfig('welcomeMessagesEnabled', true);
                const welcomeOnEmbed = new EmbedBuilder()
                    .setColor(0x2ECC71)
                    .setTitle('👋 Configuración de Mensajes de Bienvenida')
                    .setDescription('Mensajes de bienvenida: **HABILITADOS**');
                const welcomeOnButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('welcome_enable_disable').setLabel('Habilitar/Deshabilitar').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_set_channel').setLabel('Establecer Canal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_set_message').setLabel('Establecer Mensaje').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_back_to_main').setLabel('Volver').setStyle(ButtonStyle.Danger)
                    );
                await interaction.update({ embeds: [welcomeOnEmbed], components: [welcomeOnButtons] });
                break;
            case 'toggle_welcome_off':
                await saveConfig('welcomeMessagesEnabled', false);
                const welcomeOffEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('👋 Configuración de Mensajes de Bienvenida')
                    .setDescription('Mensajes de bienvenida: **DESHABILITADOS**');
                const welcomeOffButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('welcome_enable_disable').setLabel('Habilitar/Deshabilitar').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_set_channel').setLabel('Establecer Canal').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_set_message').setLabel('Establecer Mensaje').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId('welcome_back_to_main').setLabel('Volver').setStyle(ButtonStyle.Danger)
                    );
                await interaction.update({ embeds: [welcomeOffEmbed], components: [welcomeOffButtons] });
                break;
            case 'welcome_set_channel': {
                const modal = new ModalBuilder().setCustomId('modal_welcome_channel').setTitle('Canal de Bienvenida');
                const welcomeChannelId = await getConfig('welcomeChannelId');
                const channelInput = new TextInputBuilder().setCustomId('input_welcome_channel_id').setLabel('ID del Canal de Bienvenida').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 123456789012345678').setRequired(true).setValue(welcomeChannelId || '');
                modal.addComponents(new ActionRowBuilder().addComponents(channelInput));
                await interaction.showModal(modal);
                break;
            }
            case 'welcome_set_message': {
                const modal = new ModalBuilder().setCustomId('modal_welcome_message').setTitle('Mensaje de Bienvenida');
                const welcomeMessageText = await getConfig('welcomeMessageText');
                const messageInput = new TextInputBuilder().setCustomId('input_welcome_message_text').setLabel('Texto del Mensaje de Bienvenida').setStyle(TextInputStyle.Paragraph).setPlaceholder('Ej: ¡Bienvenido {member} a nuestro servidor!') .setRequired(true).setValue(welcomeMessageText || '');
                modal.addComponents(new ActionRowBuilder().addComponents(messageInput));
                await interaction.showModal(modal);
                break;
            }
            case 'welcome_back_to_main': {
                await interaction.update(await generateConfigPanelEmbedAndComponents(client, interaction.user));
                break;
            }

            case 'config_ticket_channel_btn': {
                const modal = new ModalBuilder().setCustomId('modal_ticket_category').setTitle('Configurar Categoría de Tickets');
                const ticketCategoryChannelId = await getConfig('ticketCategoryChannelId');
                const categoryInput = new TextInputBuilder().setCustomId('input_ticket_category_id').setLabel('ID de la Categoría de Tickets').setStyle(TextInputStyle.Short).setPlaceholder('Ej: 123456789012345678 (ID de una categoría de canal)').setRequired(true).setValue(ticketCategoryChannelId || '');
                modal.addComponents(new ActionRowBuilder().addComponents(categoryInput));
                await interaction.showModal(modal);
                break;
            }

            case 'config_use_item_roles_btn': {
                const modal = new ModalBuilder()
                    .setCustomId('modal_use_item_roles')
                    .setTitle('Configurar Roles de Uso de Ítems');
                const useItemAllowedRoles = await getConfig('useItemAllowedRoles');
                const rolesInput = new TextInputBuilder()
                    .setCustomId('input_use_item_roles_ids')
                    .setLabel('IDs de Roles (separados por comas)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: 123456789012345678, 987654321098765432')
                    .setRequired(true)
                    .setValue(useItemAllowedRoles?.join(', ') || '');

                modal.addComponents(new ActionRowBuilder().addComponents(rolesInput));
                await interaction.showModal(modal);
                break;
            }

            // --- Botón: Vaciar Configuración de la Base de Datos ---
            case 'config_clear_db_btn': {
                const confirmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('⚠️ Confirmar Borrado de Configuración')
                    .setDescription('Estás a punto de borrar **TODAS** las configuraciones guardadas en la base de datos del bot. Esto incluye roles, canales, montos de economía, etc. ¡Esta acción es irreversible!\n\n¿Estás seguro de que quieres continuar?');

                const confirmButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('confirm_clear_db_yes').setLabel('Sí, Borrar Todo').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('confirm_clear_db_no').setLabel('No, Cancelar').setStyle(ButtonStyle.Secondary),
                    );
                await interaction.update({ embeds: [confirmEmbed], components: [confirmButtons] });
                break;
            }
            case 'confirm_clear_db_yes': {
                try {
                    await clearAllConfigs();
                    await initializeConfigs(); // initializeConfigs ahora está disponible
                    await interaction.update({ content: '✅ ¡Todas las configuraciones han sido borradas y reiniciadas a sus valores por defecto!', embeds: [], components: [] });
                    console.log('✅ Configuración de la base de datos borrada y reiniciada con éxito.');
                } catch (error) {
                    console.error('❌ Error al vaciar la base de datos de configuración:', error);
                    await interaction.update({ content: '❌ Hubo un error al intentar vaciar la base de datos de configuración.', embeds: [], components: [] });
                }
                break;
            }
            case 'confirm_clear_db_no': {
                await interaction.update({ content: '👍 Operación de borrado de configuración cancelada.', embeds: [], components: [] });
                break;
            }

            // --- NUEVOS CASOS: Manejo de los botones del comando /borrarverificaciones ---
            case 'confirm_clear_verifications_yes': {
                try {
                    // Importamos Verification aquí para asegurar que esté disponible
                    const Verification = require('../models/Verification');
                    await Verification.destroy({ truncate: true }); // Borra todos los registros

                    await interaction.update({
                        content: '✅ ¡Todos los registros de verificación han sido borrados de la base de datos!',
                        embeds: [],
                        components: []
                    });
                    console.log('✅ Registros de verificación borrados con éxito.');
                } catch (error) {
                    console.error('❌ Error al borrar registros de verificación:', error);
                    await interaction.update({
                        content: '❌ Hubo un error al intentar borrar los registros de verificación.',
                        embeds: [],
                        components: []
                    });
                }
                break;
            }
            case 'confirm_clear_verifications_no': {
                await interaction.update({
                    content: '👍 Operación de borrado de verificaciones cancelada.',
                    embeds: [],
                    components: []
                });
                break;
            }
            // --- FIN DE LOS NUEVOS CASOS ---


            // --- Casos de Votación (Botones y Modal) ---
            case 'vote_for_apertura': {
                const modal = new ModalBuilder()
                    .setCustomId('modal_apertura_code')
                    .setTitle('Ingresar Código de Votación');

                const codeInput = new TextInputBuilder()
                    .setCustomId('input_apertura_code')
                    .setLabel('Código Secreto (CABORCA)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
                await interaction.showModal(modal);
                break;
            }
            case 'unvote_for_apertura': {
                await interaction.deferUpdate();

                const activeVote = await ServerVote.findOne({
                    where: {
                        messageId: interaction.message.id,
                        status: 'open'
                    }
                });

                if (!activeVote) {
                    return await interaction.editReply({ content: 'ℹ️ No hay una votación activa para desvotar aquí.', components: [] });
                }

                let codeVoters = activeVote.codeVoters;
                const userId = interaction.user.id;

                if (!codeVoters.includes(userId)) {
                    return await interaction.editReply({ content: '⚠️ No has votado en esta apertura.', ephemeral: true });
                }

                codeVoters = codeVoters.filter(id => id !== userId);
                activeVote.codeVoters = codeVoters;
                activeVote.yesVotes = codeVoters.length;
                await activeVote.save();

                const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setFields(
                        { name: 'Código Secreto', value: `\`${activeVote.voteCode}\``, inline: true },
                        { name: 'Votos Necesarios', value: `\`${activeVote.targetVotes}\``, inline: true },
                        { name: 'Votos Actuales', value: `\`${activeVote.yesVotes} / ${activeVote.targetVotes}\``, inline: true },
                    );

                await interaction.editReply({ embeds: [updatedEmbed] });
                await interaction.followUp({ content: '✅ Tu voto ha sido removido.', ephemeral: true });
                break;
            }
            case 'modal_apertura_code': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const inputCode = interaction.fields.getTextInputValue('input_apertura_code').toUpperCase();
                const userId = interaction.user.id;

                const activeVote = await ServerVote.findOne({
                    where: {
                        messageId: interaction.message.id,
                        status: 'open'
                    }
                });

                if (!activeVote) {
                    return await interaction.editReply({ content: '❌ Esta votación ya no está activa o no se encontró.', ephemeral: true });
                }

                if (inputCode !== activeVote.voteCode.toUpperCase()) {
                    return await interaction.editReply({ content: '❌ Código incorrecto. Inténtalo de nuevo.', ephemeral: true });
                }

                let codeVoters = activeVote.codeVoters;
                if (codeVoters.includes(userId)) {
                    return await interaction.editReply({ content: '⚠️ Ya has votado en esta apertura.', ephemeral: true });
                }

                codeVoters.push(userId);
                activeVote.codeVoters = codeVoters;
                activeVote.yesVotes = codeVoters.length;
                await activeVote.save();

                try {
                    const voteChannel = await client.channels.fetch(activeVote.channelId);
                    const voteMessage = await voteChannel.messages.fetch(activeVote.messageId);

                    const updatedEmbed = EmbedBuilder.from(voteMessage.embeds[0])
                        .setFields(
                            { name: 'Código Secreto', value: `\`${activeVote.voteCode}\``, inline: true },
                            { name: 'Votos Necesarios', value: `\`${activeVote.targetVotes}\``, inline: true },
                            { name: 'Votos Actuales', value: `\`${activeVote.yesVotes} / ${activeVote.targetVotes}\``, inline: true },
                        );
                    await voteMessage.edit({ embeds: [updatedEmbed] });

                    if (activeVote.yesVotes >= activeVote.targetVotes) {
                        activeVote.status = 'passed';
                        await activeVote.save();

                        const successEmbed = EmbedBuilder.from(updatedEmbed)
                            .setColor(0x2ECC71)
                            .setTitle('🎉 ¡Servidor ABIERTO! 🎉')
                            .setDescription(`¡Felicidades! Se han alcanzado los ${activeVote.targetVotes} votos necesarios. El servidor (modo RP) está ahora abierto.`)
                            .setFields(
                                { name: 'Resultado', value: 'Votación Exitosa', inline: true },
                                { name: 'Estado Actual', value: 'ABIERTO', inline: true }
                            )
                            .setFooter({ text: '¡A disfrutar del desierto de Caborca!' });

                        const votersList = await Promise.all(activeVote.codeVoters.map(async voterId => {
                            try {
                                const user = await client.users.fetch(voterId);
                                return user ? user.tag : `Usuario Desconocido (${voterId})`;
                            } catch (err) {
                                return `Usuario Desconocido (${voterId})`;
                            }
                        }));
                        const mentionString = activeVote.codeVoters.map(id => `<@${id}>`).join(' ');

                        await voteMessage.edit({ embeds: [successEmbed], components: [] });
                        await voteChannel.send(`@here ¡El servidor ha sido abierto! Bienvenidos al RP.🌵\n\n**Votantes (${activeVote.yesVotes}):**\n${votersList.join('\n')}`);
                    }

                    await interaction.editReply({ content: '✅ Tu voto ha sido registrado correctamente.', ephemeral: true });

                } catch (error) {
                    console.error('Error al procesar voto o actualizar mensaje de votación:', error);
                    await interaction.editReply({ content: '❌ Hubo un error al registrar tu voto o actualizar la votación.', ephemeral: true });
                }
                break;
            }


            // --- Casos de Modales (Manejo de envíos de formularios) ---
            case 'modal_roles_give': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const rolesRaw = interaction.fields.getTextInputValue('input_roles_give');
                const rolesArray = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);
                await saveConfig('defaultGiveCommandRoles', rolesArray);
                await interaction.editReply({ content: `✅ Roles de \`/give\` actualizados a: ${rolesArray.join(', ')}` });
                break;
            }
            case 'modal_collect_config': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const amount = parseInt(interaction.fields.getTextInputValue('input_collect_amount'));
                const cooldown = parseInt(interaction.fields.getTextInputValue('input_collect_cooldown'));
                const rolesRaw = interaction.fields.getTextInputValue('input_collect_roles');
                const rolesArray = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

                if (isNaN(amount) || isNaN(cooldown) || amount <= 0 || cooldown <= 0) {
                    return await interaction.editReply({ content: '❌ Por favor, introduce valores numéricos válidos y positivos para monto y cooldown.' });
                }

                await saveConfig('collectConfig', { amount, cooldown, roles: rolesArray });
                await interaction.editReply({ content: `✅ Configuración de \`/collect\` actualizada:\nMonto: ${amount}\nCooldown: ${cooldown / 1000} segundos\nRoles: ${rolesArray.join(', ')}` });
                break;
            }
            case 'modal_work_config': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const minAmount = parseInt(interaction.fields.getTextInputValue('input_work_min_amount'));
                const maxAmount = parseInt(interaction.fields.getTextInputValue('input_work_max_amount'));
                const cooldown = parseInt(interaction.fields.getTextInputValue('input_work_cooldown'));
                const rolesRaw = interaction.fields.getTextInputValue('input_work_roles');
                const rolesArray = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

                if (isNaN(minAmount) || isNaN(maxAmount) || isNaN(cooldown) || minAmount <= 0 || maxAmount <= 0 || cooldown <= 0 || minAmount > maxAmount) {
                    return await interaction.editReply({ content: '❌ Por favor, introduce valores numéricos válidos y positivos para montos y cooldown (mínimo no debe ser mayor que máximo).' });
                }

                await saveConfig('workConfig', { minAmount, maxAmount, cooldown, roles: rolesArray });
                await interaction.editReply({ content: `✅ Configuración de \`/work\` actualizada:\nMonto: ${minAmount}-${maxAmount}\nCooldown: ${cooldown / 1000} segundos\nRoles: ${rolesArray.join(', ')}` });
                break;
            }
            case 'modal_unverified_role': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const roleId = interaction.fields.getTextInputValue('input_unverified_role_id').trim();
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) {
                    return await interaction.editReply({ content: '❌ El ID de rol "No Verificado" no es válido o no existe en este servidor.' });
                }
                await saveConfig('unverifiedRole', roleId);
                await interaction.editReply({ content: `✅ Rol "No Verificado" actualizado a: <@&${roleId}>` });
                break;
            }
            case 'modal_citizen_role': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const roleId = interaction.fields.getTextInputValue('input_citizen_role_id').trim();
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) {
                    return await interaction.editReply({ content: '❌ El ID de rol "Ciudadano" no es válido o no existe en este servidor.' });
                }
                await saveConfig('citizenRole', roleId);
                await interaction.editReply({ content: `✅ Rol "Ciudadano" actualizado a: <@&${roleId}>` });
                break;
            }
            case 'modal_staff_roles': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const rolesRaw = interaction.fields.getTextInputValue('input_staff_roles_ids');
                const rolesArray = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);
                await saveConfig('staffRoles', rolesArray);
                await interaction.editReply({ content: `✅ Roles de "Staff" actualizados a: ${rolesArray.map(id => `<@&${id}>`).join(', ')}` });
                break;
            }
            case 'modal_logs_channel': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const channelId = interaction.fields.getTextInputValue('input_logs_channel_id').trim();
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel || channel.type !== 0) {
                    return await interaction.editReply({ content: '❌ El ID de canal de logs no es válido o no es un canal de texto.' });
                }
                await saveConfig('logChannelId', channelId);
                await interaction.editReply({ content: `✅ Canal de logs actualizado a: <#${channelId}>` });
                break;
            }
            case 'modal_welcome_channel': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const channelId = interaction.fields.getTextInputValue('input_welcome_channel_id').trim();
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel || channel.type !== 0) {
                    return await interaction.editReply({ content: '❌ El ID de canal de bienvenida no es válido o no es un canal de texto.' });
                }
                await saveConfig('welcomeChannelId', channelId);
                await interaction.editReply({ content: `✅ Canal de bienvenida actualizado a: <#${channelId}>` });
                break;
            }
            case 'modal_welcome_message': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const messageText = interaction.fields.getTextInputValue('input_welcome_message_text');
                await saveConfig('welcomeMessageText', messageText);
                await interaction.editReply({ content: `✅ Mensaje de bienvenida actualizado.` });
                break;
            }
            case 'modal_ticket_category': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const categoryId = interaction.fields.getTextInputValue('input_ticket_category_id').trim();
                const category = interaction.guild.channels.cache.get(categoryId);
                if (!category || category.type !== 4) {
                    return await interaction.editReply({ content: '❌ El ID de la categoría de tickets no es válido o no es una categoría de canal.' });
                }
                await saveConfig('ticketCategoryChannelId', categoryId);
                await interaction.editReply({ content: `✅ Categoría de tickets actualizada a: \`${category.name}\`` });
                break;
            }
            case 'modal_use_item_roles': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const rolesRaw = interaction.fields.getTextInputValue('input_use_item_roles_ids');
                const rolesArray = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);
                await saveConfig('useItemAllowedRoles', rolesArray);
                await interaction.editReply({ content: `✅ Roles permitidos para usar ítems actualizados a: ${rolesArray.map(id => `<@&${id}>`).join(', ')}` });
                break;
            }
            default:
                console.log(`Custom ID de interacción no manejado por el panel de configuración: ${customId}`);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Esta opción no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                } else if (interaction.deferred) {
                    await interaction.editReply({ content: '❌ Esta opción no está configurada o hubo un error inesperado.', flags: MessageFlags.Ephemeral });
                }
                break;
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