const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, MessageFlags, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig, saveConfig, clearAllConfigs } = require('../../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar')
        .setDescription('Abre el panel de configuración del bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const configEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚙️ Panel de Configuración de Caborca Bot')
            .setDescription('Aquí puedes ajustar varias configuraciones de tu bot. **Selecciona una opción del menú desplegable** para comenzar.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '💰 Economía', value: 'Configura roles y montos para comandos de economía como `/give`, `/collect`, `/work`.', inline: true },
                { name: '👥 Roles de Usuario', value: 'Define roles para `No Verificado`, `Ciudadano`, y `Staff`.', inline: true },
                { name: '👮 Roles de Policía', value: 'Define los roles que pueden usar comandos de policía (`/arresto`, `/multa`, etc.).', inline: true },
                { name: '📝 Canal de Logs', value: 'Establece el canal donde el bot enviará registros.', inline: true },
                { name: '👋 Mensajes de Bienvenida', value: 'Configura mensajes automáticos para nuevos miembros.', inline: true },
                { name: '🎟️ Tickets', value: 'Define la categoría para los canales de tickets.', inline: true },
                { name: '✨ Roles por Uso de Ítem', value: 'Configura qué roles pueden usar ítems de tu tienda.', inline: true },
                { name: '🗑️ Vaciar Configuración', value: 'Borra todas las configuraciones guardadas. ¡Úsalo con precaución!', inline: true },
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('config_select_menu')
            .setPlaceholder('Elige una opción de configuración...')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Economía')
                    .setDescription('Configura roles y montos de economía (dar, recolectar, trabajar).')
                    .setValue('config_economy')
                    .setEmoji('💰'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Roles de Usuario')
                    .setDescription('Define roles de No Verificado, Ciudadano y Staff.')
                    .setValue('config_user_roles')
                    .setEmoji('👥'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Roles de Policía')
                    .setDescription('Define los roles con acceso a comandos policiales.')
                    .setValue('config_police_roles')
                    .setEmoji('👮'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Canal de Logs')
                    .setDescription('Establece el canal para registros de actividad del bot.')
                    .setValue('config_logs_channel')
                    .setEmoji('📝'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Mensajes de Bienvenida')
                    .setDescription('Configura mensajes automáticos para nuevos miembros.')
                    .setValue('config_welcome_messages')
                    .setEmoji('👋'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Tickets')
                    .setDescription('Define la categoría para los canales de tickets.')
                    .setValue('config_ticket_channel')
                    .setEmoji('🎟️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Roles por Uso de Ítem')
                    .setDescription('Configura qué roles pueden usar ítems de tu tienda.')
                    .setValue('config_use_item_roles')
                    .setEmoji('✨'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Vaciar Configuración')
                    .setDescription('Borra TODAS las configuraciones guardadas (irreversible).')
                    .setValue('config_clear_db')
                    .setEmoji('🗑️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Cerrar Panel')
                    .setDescription('Cierra esta ventana de configuración.')
                    .setValue('config_exit')
                    .setEmoji('❌'),
            );

        const actionRow = new ActionRowBuilder()
            .addComponents(selectMenu);

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                embeds: [configEmbed],
                components: [actionRow]
            });
        } else {
            await interaction.reply({
                embeds: [configEmbed],
                components: [actionRow],
                ephemeral: true
            });
        }
    },

    async handleSelectMenu(interaction) {
        await interaction.deferUpdate({ ephemeral: true }); 

        const [selectedValue] = interaction.values;

        switch (selectedValue) {
            case 'config_economy': {
                const economyPanelEmbed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('💰 Configuración de Economía Avanzada')
                    .setDescription('Selecciona qué aspecto de la economía deseas configurar:')
                    .addFields(
                        { name: '💸 Comando `/give`', value: 'Configura los roles que pueden usar el comando `/give`.', inline: true },
                        { name: '👷‍♂️ Comando `/work`', value: 'Configura los montos y cooldowns de `/work`.', inline: true },
                        { name: '📦 Comando `/collect` (Por Rol)', value: 'Configura montos y cooldowns de `/collect` ESPECÍFICOS PARA CADA ROL.', inline: true }
                    )
                    .setFooter({ text: `Panel solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                const economyPanelRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('config_economy_give_roles_btn')
                            .setLabel('Configurar /give Roles')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('💸'),
                        new ButtonBuilder()
                            .setCustomId('config_economy_work_btn')
                            .setLabel('Configurar /work')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('👷‍♂️'),
                        new ButtonBuilder()
                            .setCustomId('config_economy_collect_btn')
                            .setLabel('Configurar /collect (Por Rol)')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('📦'),
                        new ButtonBuilder()
                            .setCustomId('config_economy_back_to_main_btn')
                            .setLabel('Volver al Menú Principal')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔙')
                    );
                
                await interaction.editReply({ 
                    embeds: [economyPanelEmbed],
                    components: [economyPanelRow]
                });
                break;
            }
            case 'config_user_roles': {
                const modal = new ModalBuilder()
                    .setCustomId('config_user_roles_modal')
                    .setTitle('👥 Configuración de Roles de Usuario');

                const unverifiedRole = await getConfig('unverifiedRole') || '';
                const citizenRole = await getConfig('citizenRole') || '';
                const staffRoles = await getConfig('staffRoles') || [];

                const unverifiedInput = new TextInputBuilder()
                    .setCustomId('user_role_unverified_id')
                    .setLabel('ID Rol No Verificado')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(false)
                    .setValue(unverifiedRole);

                const citizenInput = new TextInputBuilder()
                    .setCustomId('user_role_citizen_id')
                    .setLabel('ID Rol Ciudadano (Verificado)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(false)
                    .setValue(citizenRole);

                const staffRolesInput = new TextInputBuilder()
                    .setCustomId('user_role_staff_ids')
                    .setLabel('IDs Roles de Staff (separados por coma)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: 123..., 456...')
                    .setRequired(false)
                    .setValue(staffRoles.join(', '));

                modal.addComponents(
                    new ActionRowBuilder().addComponents(unverifiedInput),
                    new ActionRowBuilder().addComponents(citizenInput),
                    new ActionRowBuilder().addComponents(staffRolesInput)
                );
                await interaction.showModal(modal); 
                break;
            }
            case 'config_police_roles': {
                const policeRoles = await getConfig('policeRoles') || [];
                const modal = new ModalBuilder()
                    .setCustomId('config_police_roles_modal')
                    .setTitle('👮 Configurar Roles de Policía');

                const rolesInput = new TextInputBuilder()
                    .setCustomId('policeRolesInput')
                    .setLabel('IDs de Roles de Policía (separados por coma)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: 123456789012345678, 987654321098765432')
                    .setValue(policeRoles.join(', '))
                    .setRequired(false);

                const firstActionRow = new ActionRowBuilder().addComponents(rolesInput);
                modal.addComponents(firstActionRow);

                await interaction.showModal(modal);
                break;
            }
            case 'config_logs_channel': {
                const modal = new ModalBuilder()
                    .setCustomId('config_logs_channel_modal')
                    .setTitle('📝 Configurar Canal de Logs');

                const logChannelId = await getConfig('logChannelId') || '';

                const channelInput = new TextInputBuilder()
                    .setCustomId('logs_channel_id')
                    .setLabel('ID del Canal de Logs')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(true)
                    .setValue(logChannelId);

                modal.addComponents(new ActionRowBuilder().addComponents(channelInput));
                await interaction.showModal(modal);
                break;
            }
            case 'config_welcome_messages': {
                const modal = new ModalBuilder()
                    .setCustomId('config_welcome_messages_modal')
                    .setTitle('👋 Configuración de Mensajes de Bienvenida');

                const welcomeMessagesEnabled = await getConfig('welcomeMessagesEnabled');
                const welcomeChannelId = await getConfig('welcomeChannelId') || '';
                const welcomeMessageText = await getConfig('welcomeMessageText') || '';

                const enableDisableInput = new TextInputBuilder()
                    .setCustomId('welcome_enable_disable_status')
                    .setLabel('Habilitar Mensajes de Bienvenida (true/false)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('true o false')
                    .setRequired(true)
                    .setValue(welcomeMessagesEnabled ? 'true' : 'false');

                const channelInput = new TextInputBuilder()
                    .setCustomId('welcome_channel_id')
                    .setLabel('ID del Canal de Bienvenida')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(false)
                    .setValue(welcomeChannelId);

                const messageInput = new TextInputBuilder()
                    .setCustomId('welcome_message_text')
                    .setLabel('Mensaje de Bienvenida (usar {member})')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: ¡Bienvenido {member} a nuestro servidor!')
                    .setRequired(false)
                    .setValue(welcomeMessageText);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(enableDisableInput),
                    new ActionRowBuilder().addComponents(channelInput),
                    new ActionRowBuilder().addComponents(messageInput)
                );
                await interaction.showModal(modal);
                break;
            }
            case 'config_ticket_channel': {
                const modal = new ModalBuilder()
                    .setCustomId('config_ticket_channel_modal')
                    .setTitle('🎟️ Configuración de Tickets');

                const ticketCategoryChannelId = await getConfig('ticketCategoryChannelId') || '';

                const categoryInput = new TextInputBuilder()
                    .setCustomId('ticket_category_id')
                    .setLabel('ID de la Categoría de Tickets')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678 (ID de una categoría de canal)')
                    .setRequired(true)
                    .setValue(ticketCategoryChannelId);

                modal.addComponents(new ActionRowBuilder().addComponents(categoryInput));
                await interaction.showModal(modal);
                break;
            }
            case 'config_use_item_roles': {
                const modal = new ModalBuilder()
                    .setCustomId('config_use_item_roles_modal')
                    .setTitle('✨ Configuración de Roles por Uso de Ítem');

                const useItemAllowedRoles = await getConfig('useItemAllowedRoles') || [];

                const rolesInput = new TextInputBuilder()
                    .setCustomId('use_item_roles_ids')
                    .setLabel('IDs de Roles Permitidos (separados por coma)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: 123..., 456...')
                    .setRequired(false)
                    .setValue(useItemAllowedRoles.join(', '));

                modal.addComponents(new ActionRowBuilder().addComponents(rolesInput));
                await interaction.showModal(modal);
                break;
            }
            case 'config_clear_db': {
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Confirmar Borrado de Configuración')
                    .setDescription('Estás a punto de borrar **TODAS** las configuraciones guardadas. Esta acción es irreversible y reseteará el bot a sus valores por defecto. ¡Estás seguro?')
                    .setColor('Red');

                const confirmRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_clear_config_yes')
                            .setLabel('Sí, borrar todo')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('confirm_clear_config_no')
                            .setLabel('No, cancelar')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow] });
                break;
            }
            case 'config_exit':
                await interaction.deleteReply();
                await interaction.followUp({ content: '✅ Panel de configuración cerrado.', flags: MessageFlags.Ephemeral });
                break;
            default:
                await interaction.editReply({ content: '🤔 Opción de configuración no reconocida.', flags: MessageFlags.Ephemeral });
        }
    },

    async handleButton(interaction) {
        const { customId } = interaction;

        switch (customId) {
            case 'config_economy_give_roles_btn': {
                const modal = new ModalBuilder()
                    .setCustomId('config_economy_give_modal')
                    .setTitle('💸 Configurar Roles para /give');

                const defaultGiveRoles = await getConfig('defaultGiveCommandRoles') || [];

                const giveRolesInput = new TextInputBuilder()
                    .setCustomId('economy_give_roles')
                    .setLabel('Roles para /give (IDs, separados por coma)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: 123..., 456...')
                    .setRequired(false)
                    .setValue(defaultGiveRoles.join(', '));
                
                modal.addComponents(new ActionRowBuilder().addComponents(giveRolesInput));
                await interaction.showModal(modal);
                break;
            }
            case 'config_economy_work_btn': {
                const modal = new ModalBuilder()
                    .setCustomId('config_economy_work_modal')
                    .setTitle('👷‍♂️ Configurar /work');

                const workConfig = await getConfig('workConfig') || { minAmount: 0, maxAmount: 0, cooldown: 0, roles: [] };

                const workMinAmountInput = new TextInputBuilder()
                    .setCustomId('economy_work_min_amount')
                    .setLabel('Monto Mín. para /work')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 500000')
                    .setRequired(true)
                    .setValue(workConfig.minAmount.toString());

                const workMaxAmountInput = new TextInputBuilder()
                    .setCustomId('economy_work_max_amount')
                    .setLabel('Monto Máx. para /work')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 200000000')
                    .setRequired(true)
                    .setValue(workConfig.maxAmount.toString());
                
                const workCooldownInput = new TextInputBuilder()
                    .setCustomId('economy_work_cooldown_hours')
                    .setLabel('Cooldown /work (horas)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 24 (24 horas)')
                    .setRequired(true)
                    .setValue((workConfig.cooldown / 3600000).toString());

                modal.addComponents(
                    new ActionRowBuilder().addComponents(workMinAmountInput),
                    new ActionRowBuilder().addComponents(workMaxAmountInput),
                    new ActionRowBuilder().addComponents(workCooldownInput)
                );
                await interaction.showModal(modal);
                break;
            }
            case 'config_economy_collect_btn': {
                await interaction.deferUpdate(); 
                const collectConfigs = await getConfig('collectConfig') || [];
                
                let description = 'Aquí puedes gestionar las configuraciones de `/collect` para diferentes roles.\n\n';
                if (collectConfigs.length > 0) {
                    description += '**Configuraciones Actuales:**\n';
                    collectConfigs.forEach((config, index) => {
                        description += `\`${index + 1}.\` Rol: <@&${config.roleId}> | Monto: \`$${config.amount.toLocaleString()}\` | Cooldown: \`${config.cooldownHours}h\`\n`;
                    });
                } else {
                    description += 'Actualmente no hay configuraciones específicas para `/collect` por rol. Cualquier usuario podrá usarlo con valores predeterminados si no se configuran roles aquí.\n';
                }

                const collectPanelEmbed = new EmbedBuilder()
                    .setColor(0x2ECC71)
                    .setTitle('📦 Configuración de /collect (Por Rol)')
                    .setDescription(description)
                    .setFooter({ text: 'Puedes añadir, editar o eliminar configuraciones.' });

                const collectPanelRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('config_collect_add_btn')
                            .setLabel('Añadir Configuración de Rol')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('➕'),
                        new ButtonBuilder()
                            .setCustomId('config_collect_edit_btn')
                            .setLabel('Editar Configuración de Rol')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('📝'),
                        new ButtonBuilder()
                            .setCustomId('config_collect_remove_btn')
                            .setLabel('Eliminar Configuración de Rol')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('➖'),
                        new ButtonBuilder()
                            .setCustomId('config_economy_back_to_main_btn')
                            .setLabel('Volver al Panel de Economía')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔙')
                    );
                
                await interaction.editReply({
                    embeds: [collectPanelEmbed],
                    components: [collectPanelRow]
                });
                break;
            }
            case 'config_economy_back_to_main_btn': {
                await interaction.deferUpdate(); 
                const configEmbed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('⚙️ Panel de Configuración de Caborca Bot')
                    .setDescription('Aquí puedes ajustar varias configuraciones de tu bot. **Selecciona una opción del menú desplegable** para comenzar.')
                    .setThumbnail(interaction.client.user.displayAvatarURL())
                    .addFields(
                        { name: '💰 Economía', value: 'Configura roles y montos para comandos de economía como `/give`, `/collect`, `/work`.', inline: true },
                        { name: '👥 Roles de Usuario', value: 'Define roles para `No Verificado`, `Ciudadano`, y `Staff`.', inline: true },
                        { name: '👮 Roles de Policía', value: 'Define los roles que pueden usar comandos de policía (`/arresto`, `/multa`, etc.).', inline: true },
                        { name: '📝 Canal de Logs', value: 'Establece el canal donde el bot enviará registros.', inline: true },
                        { name: '👋 Mensajes de Bienvenida', value: 'Configura mensajes automáticos para nuevos miembros.', inline: true },
                        { name: '🎟️ Tickets', value: 'Define la categoría para los canales de tickets.', inline: true },
                        { name: '✨ Roles por Uso de Ítem', value: 'Configura qué roles pueden usar ítems de tu tienda.', inline: true },
                        { name: '🗑️ Vaciar Configuración', value: 'Borra todas las configuraciones guardadas. ¡Úsalo con precaución!', inline: true },
                    )
                    .setTimestamp()
                    .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('config_select_menu')
                    .setPlaceholder('Elige una opción de configuración...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Economía')
                            .setDescription('Configura roles y montos de economía (dar, recolectar, trabajar).')
                            .setValue('config_economy')
                            .setEmoji('💰'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Roles de Usuario')
                            .setDescription('Define roles de No Verificado, Ciudadano y Staff.')
                            .setValue('config_user_roles')
                            .setEmoji('👥'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Roles de Policía')
                            .setDescription('Define los roles con acceso a comandos policiales.')
                            .setValue('config_police_roles')
                            .setEmoji('👮'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Canal de Logs')
                            .setDescription('Establece el canal para registros de actividad del bot.')
                            .setValue('config_logs_channel')
                            .setEmoji('📝'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Mensajes de Bienvenida')
                            .setDescription('Configura mensajes automáticos para nuevos miembros.')
                            .setValue('config_welcome_messages')
                            .setEmoji('👋'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Tickets')
                            .setDescription('Define la categoría para los canales de tickets.')
                            .setValue('config_ticket_channel')
                            .setEmoji('🎟️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Roles por Uso de Ítem')
                            .setDescription('Configura qué roles pueden usar ítems de tu tienda.')
                            .setValue('config_use_item_roles')
                            .setEmoji('✨'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Vaciar Configuración')
                            .setDescription('Borra TODAS las configuraciones guardadas (irreversible).')
                            .setValue('config_clear_db')
                            .setEmoji('🗑️'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Cerrar Panel')
                            .setDescription('Cierra esta ventana de configuración.')
                            .setValue('config_exit')
                            .setEmoji('❌'),
                    );

                const actionRow = new ActionRowBuilder()
                    .addComponents(selectMenu);

                await interaction.editReply({
                    embeds: [configEmbed],
                    components: [actionRow]
                });
                break;
            }
            case 'config_collect_add_btn': {
                const modal = new ModalBuilder()
                    .setCustomId('config_collect_add_modal')
                    .setTitle('➕ Añadir Configuración /collect (Rol)');

                const roleIdInput = new TextInputBuilder()
                    .setCustomId('collect_role_id')
                    .setLabel('ID del Rol')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(true);

                const amountInput = new TextInputBuilder()
                    .setCustomId('collect_amount')
                    .setLabel('Monto de dinero a recolectar')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 500')
                    .setRequired(true);

                const cooldownInput = new TextInputBuilder()
                    .setCustomId('collect_cooldown_hours')
                    .setLabel('Cooldown (horas)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 24 (24 horas)')
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(roleIdInput),
                    new ActionRowBuilder().addComponents(amountInput),
                    new ActionRowBuilder().addComponents(cooldownInput)
                );
                await interaction.showModal(modal);
                break;
            }
            case 'config_collect_edit_btn': {
                const modal = new ModalBuilder()
                    .setCustomId('config_collect_edit_modal')
                    .setTitle('📝 Editar Configuración /collect (Rol)');

                const roleIdInput = new TextInputBuilder()
                    .setCustomId('collect_role_id_edit')
                    .setLabel('ID del Rol a Editar')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(true);
                
                const amountInput = new TextInputBuilder()
                    .setCustomId('collect_amount_edit')
                    .setLabel('Nuevo Monto de dinero a recolectar')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Dejar vacío para no cambiar')
                    .setRequired(false);

                const cooldownInput = new TextInputBuilder()
                    .setCustomId('collect_cooldown_hours_edit')
                    .setLabel('Nuevo Cooldown (horas)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Dejar vacío para no cambiar')
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(roleIdInput),
                    new ActionRowBuilder().addComponents(amountInput),
                    new ActionRowBuilder().addComponents(cooldownInput)
                );
                await interaction.showModal(modal);
                break;
            }
            case 'config_collect_remove_btn': {
                const modal = new ModalBuilder()
                    .setCustomId('config_collect_remove_modal')
                    .setTitle('➖ Eliminar Configuración /collect (Rol)');

                const roleIdInput = new TextInputBuilder()
                    .setCustomId('collect_role_id_remove')
                    .setLabel('ID del Rol a Eliminar')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 123456789012345678')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(roleIdInput));
                await interaction.showModal(modal);
                break;
            }
            default:
                console.log(`Custom ID de botón no manejado por configurar.js: ${customId}`);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: '❌ Opción de botón no configurada o error inesperado.', flags: MessageFlags.Ephemeral });
                }
                break;
        }
    },

    async handleModalSubmit(interaction) {
        await interaction.deferUpdate();

        const { customId } = interaction;

        switch (customId) {
            case 'config_economy_give_modal': {
                const giveRolesRaw = interaction.fields.getTextInputValue('economy_give_roles');
                const defaultGiveCommandRoles = giveRolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

                let errors = [];
                for (const roleId of defaultGiveCommandRoles) {
                    if (!interaction.guild.roles.cache.has(roleId)) {
                        errors.push(`El ID de Rol '${roleId}' para /give no es válido.`);
                    }
                }
                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores en la configuración de roles para /give:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('defaultGiveCommandRoles', defaultGiveCommandRoles);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración de /give Actualizada')
                    .setDescription('Se han guardado los nuevos roles para el comando `/give`.')
                    .addFields(
                        { name: 'Roles para /give:', value: defaultGiveCommandRoles.length > 0 ? `<@&${defaultGiveCommandRoles.join('>, <@&')}>` : 'Ninguno', inline: true },
                    )
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_economy_work_modal': {
                const workMinAmountRaw = interaction.fields.getTextInputValue('economy_work_min_amount');
                const workMaxAmountRaw = interaction.fields.getTextInputValue('economy_work_max_amount');
                const workCooldownHoursRaw = interaction.fields.getTextInputValue('economy_work_cooldown_hours');

                const workMinAmount = parseInt(workMinAmountRaw);
                const workMaxAmount = parseInt(workMaxAmountRaw);
                const workCooldownHours = parseInt(workCooldownHoursRaw);
                const workCooldownMs = workCooldownHours * 3600000;

                let errors = [];
                if (isNaN(workMinAmount) || isNaN(workMaxAmount) || isNaN(workCooldownHours) ||
                    workMinAmount < 0 || workMaxAmount < 0 || workCooldownHours < 0 ||
                    workMinAmount > workMaxAmount) {
                    errors.push('Por favor, ingresa números válidos y positivos para los montos y el cooldown. Asegúrate de que el monto mínimo no sea mayor que el máximo.');
                }
                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores en la configuración de /work:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('workConfig', { minAmount: workMinAmount, maxAmount: workMaxAmount, cooldown: workCooldownMs, roles: [] });
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración de /work Actualizada')
                    .setDescription('Se han guardado las nuevas configuraciones para el comando `/work`.')
                    .addFields(
                        { name: '`/work` Monto Mín.:', value: `$${workMinAmount.toLocaleString()}`, inline: true },
                        { name: '`/work` Monto Máx.:', value: `$${workMaxAmount.toLocaleString()}`, inline: true },
                        { name: '`/work` Cooldown:', value: `${workCooldownHours} horas`, inline: true },
                    )
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_collect_add_modal': {
                const roleId = interaction.fields.getTextInputValue('collect_role_id').trim();
                const amountRaw = interaction.fields.getTextInputValue('collect_amount');
                const cooldownHoursRaw = interaction.fields.getTextInputValue('collect_cooldown_hours');

                const amount = parseInt(amountRaw);
                const cooldownHours = parseInt(cooldownHoursRaw);

                let errors = [];
                if (!roleId || !interaction.guild.roles.cache.has(roleId)) {
                    errors.push('El ID de Rol ingresado no es válido o no existe.');
                }
                if (isNaN(amount) || amount <= 0) {
                    errors.push('El monto debe ser un número positivo.');
                }
                if (isNaN(cooldownHours) || cooldownHours <= 0) {
                    errors.push('El cooldown debe ser un número positivo de horas.');
                }

                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores al añadir configuración de /collect:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                let currentCollectConfigs = await getConfig('collectConfig');
                if (!Array.isArray(currentCollectConfigs)) {
                    currentCollectConfigs = [];
                }

                if (currentCollectConfigs.some(config => config.roleId === roleId)) {
                    return await interaction.followUp({ content: `❌ Ya existe una configuración de /collect para el rol <@&${roleId}>. Usa el botón "Editar" para modificarla.`, flags: MessageFlags.Ephemeral });
                }

                currentCollectConfigs.push({ roleId, amount, cooldownHours });
                await saveConfig('collectConfig', currentCollectConfigs);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración de /collect Añadida')
                    .setDescription(`Se añadió la configuración para el rol <@&${roleId}>:\n` +
                                    `Monto: \`$${amount.toLocaleString()}\` | Cooldown: \`${cooldownHours}h\``)
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_collect_edit_modal': {
                const roleId = interaction.fields.getTextInputValue('collect_role_id_edit').trim();
                const newAmountRaw = interaction.fields.getTextInputValue('collect_amount_edit');
                const newCooldownHoursRaw = interaction.fields.getTextInputValue('collect_cooldown_hours_edit');

                let currentCollectConfigs = await getConfig('collectConfig');
                if (!Array.isArray(currentCollectConfigs)) {
                    currentCollectConfigs = [];
                }
                const configIndex = currentCollectConfigs.findIndex(config => config.roleId === roleId);

                if (configIndex === -1) {
                    return await interaction.followUp({ content: `❌ No se encontró una configuración de /collect para el rol <@&${roleId}>.`, flags: MessageFlags.Ephemeral });
                }

                let updatedAmount = parseInt(newAmountRaw);
                let updatedCooldownHours = parseInt(newCooldownHoursRaw);
                let changesMade = false;

                if (newAmountRaw && (!isNaN(updatedAmount) && updatedAmount > 0)) {
                    currentCollectConfigs[configIndex].amount = updatedAmount;
                    changesMade = true;
                } else if (newAmountRaw && (isNaN(updatedAmount) || updatedAmount <= 0)) {
                    return await interaction.followUp({ content: '❌ El nuevo monto debe ser un número positivo o dejarse vacío para no cambiar.', flags: MessageFlags.Ephemeral });
                }

                if (newCooldownHoursRaw && (!isNaN(updatedCooldownHours) && updatedCooldownHours > 0)) {
                    currentCollectConfigs[configIndex].cooldownHours = updatedCooldownHours;
                    changesMade = true;
                } else if (newCooldownHoursRaw && (isNaN(updatedCooldownHours) || updatedCooldownHours <= 0)) {
                    return await interaction.followUp({ content: '❌ El nuevo cooldown debe ser un número positivo de horas o dejarse vacío para no cambiar.', flags: MessageFlags.Ephemeral });
                }

                if (!changesMade) {
                    return await interaction.followUp({ content: 'ℹ️ No se realizaron cambios, ya que no se proporcionaron valores válidos o no se modificaron.', flags: MessageFlags.Ephemeral });
                }

                await saveConfig('collectConfig', currentCollectConfigs);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración de /collect Editada')
                    .setDescription(`Se actualizó la configuración para el rol <@&${roleId}>:\n` +
                                    `Monto: \`$${currentCollectConfigs[configIndex].amount.toLocaleString()}\` | Cooldown: \`${currentCollectConfigs[configIndex].cooldownHours}h\``)
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_collect_remove_modal': {
                const roleId = interaction.fields.getTextInputValue('collect_role_id_remove').trim();

                let currentCollectConfigs = await getConfig('collectConfig');
                if (!Array.isArray(currentCollectConfigs)) {
                    currentCollectConfigs = [];
                }
                const initialLength = currentCollectConfigs.length;
                currentCollectConfigs = currentCollectConfigs.filter(config => config.roleId !== roleId);

                if (currentCollectConfigs.length === initialLength) {
                    return await interaction.followUp({ content: `❌ No se encontró una configuración de /collect para el rol <@&${roleId}>.`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('collectConfig', currentCollectConfigs);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración de /collect Eliminada')
                    .setDescription(`Se eliminó la configuración para el rol <@&${roleId}>.`)
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_user_roles_modal': {
                const unverifiedRoleId = interaction.fields.getTextInputValue('user_role_unverified_id').trim();
                const citizenRoleId = interaction.fields.getTextInputValue('user_role_citizen_id').trim();
                const staffRolesRaw = interaction.fields.getTextInputValue('user_role_staff_ids');

                const staffRoles = staffRolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

                let errors = [];

                if (unverifiedRoleId && !interaction.guild.roles.cache.has(unverifiedRoleId)) {
                    errors.push('El ID de Rol No Verificado no es válido.');
                }
                if (citizenRoleId && !interaction.guild.roles.cache.has(citizenRoleId)) {
                    errors.push('El ID de Rol Ciudadano no es válido.');
                }
                for (const roleId of staffRoles) {
                    if (!interaction.guild.roles.cache.has(roleId)) {
                        errors.push(`El ID de Rol de Staff '${roleId}' no es válido.`);
                    }
                }

                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores en la configuración de roles de usuario:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('unverifiedRole', unverifiedRoleId);
                await saveConfig('citizenRole', citizenRoleId);
                await saveConfig('staffRoles', staffRoles);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Roles de Usuario Actualizados')
                    .setDescription('Se han guardado las nuevas configuraciones de roles para usuarios.')
                    .addFields(
                        { name: 'Rol No Verificado:', value: unverifiedRoleId ? `<@&${unverifiedRoleId}>` : 'No configurado', inline: true },
                        { name: 'Rol Ciudadano:', value: citizenRoleId ? `<@&${citizenRoleId}>` : 'No configurado', inline: true },
                        { name: 'Roles de Staff:', value: staffRoles.length > 0 ? `<@&${staffRoles.join('>, <@&')}>` : 'Ninguno', inline: true },
                    )
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_police_roles_modal': {
                const rolesString = interaction.fields.getTextInputValue('policeRolesInput');
                const newPoliceRoles = rolesString.split(',').map(id => id.trim()).filter(id => id.length > 0);

                let errors = [];
                for (const roleId of newPoliceRoles) {
                    if (!interaction.guild.roles.cache.has(roleId)) {
                        errors.push(`El ID de Rol de Policía '${roleId}' no es válido.`);
                    }
                }

                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores en la configuración de roles de policía:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('policeRoles', newPoliceRoles);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Roles de Policía Actualizados')
                    .setDescription(`Los roles de policía han sido establecidos a: \n\`${newPoliceRoles.join('`, `') || 'Ninguno'}\``)
                    .setColor('Green');

                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_logs_channel_modal': {
                const channelId = interaction.fields.getTextInputValue('logs_channel_id').trim();
                const channel = interaction.guild.channels.cache.get(channelId);

                if (!channel || channel.type !== ChannelType.GuildText) {
                    return await interaction.followUp({ content: '❌ El ID de canal de logs no es válido o no es un canal de texto.', flags: MessageFlags.Ephemeral });
                }

                await saveConfig('logChannelId', channelId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Canal de Logs Actualizado')
                    .setDescription(`El canal de logs ha sido establecido a: <#${channelId}>`)
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_welcome_messages_modal': {
                const enabledStatus = interaction.fields.getTextInputValue('welcome_enable_disable_status').toLowerCase();
                const welcomeChannelId = interaction.fields.getTextInputValue('welcome_channel_id').trim();
                const welcomeMessageText = interaction.fields.getTextInputValue('welcome_message_text');

                const welcomeMessagesEnabled = enabledStatus === 'true';

                let errors = [];
                if (enabledStatus !== 'true' && enabledStatus !== 'false') {
                    errors.push('El estado de "Habilitar Mensajes de Bienvenida" debe ser `true` o `false`.');
                }
                if (welcomeChannelId && !interaction.guild.channels.cache.get(welcomeChannelId)) {
                    errors.push('El ID del Canal de Bienvenida no es válido.');
                }

                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores en la configuración de bienvenida:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('welcomeMessagesEnabled', welcomeMessagesEnabled);
                await saveConfig('welcomeChannelId', welcomeChannelId);
                await saveConfig('welcomeMessageText', welcomeMessageText);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Mensajes de Bienvenida Actualizados')
                    .setDescription('Se han guardado las nuevas configuraciones para los mensajes de bienvenida.')
                    .addFields(
                        { name: 'Habilitado:', value: welcomeMessagesEnabled ? 'Sí' : 'No', inline: true },
                        { name: 'Canal:', value: welcomeChannelId ? `<#${welcomeChannelId}>` : 'No configurado', inline: true },
                        { name: 'Mensaje:', value: welcomeMessageText || 'No configurado', inline: false },
                    )
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_ticket_channel_modal': {
                const categoryId = interaction.fields.getTextInputValue('ticket_category_id').trim();
                const category = interaction.guild.channels.cache.get(categoryId);

                if (!category || category.type !== ChannelType.GuildCategory) {
                    return await interaction.followUp({ content: '❌ El ID de la categoría de tickets no es válido o no es una categoría de canal.', flags: MessageFlags.Ephemeral });
                }

                await saveConfig('ticketCategoryChannelId', categoryId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Categoría de Tickets Actualizada')
                    .setDescription(`La categoría para los canales de tickets ha sido establecida a: \`${category.name}\``)
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_use_item_roles_modal': {
                const rolesRaw = interaction.fields.getTextInputValue('use_item_roles_ids');
                const useItemAllowedRoles = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

                let errors = [];
                for (const roleId of useItemAllowedRoles) {
                    if (!interaction.guild.roles.cache.has(roleId)) {
                        errors.push(`El ID de Rol '${roleId}' (uso de ítems) no es válido.`);
                    }
                }

                if (errors.length > 0) {
                    return await interaction.followUp({ content: `❌ Errores en la configuración de roles por uso de ítem:\n${errors.join('\n')}`, flags: MessageFlags.Ephemeral });
                }

                await saveConfig('useItemAllowedRoles', useItemAllowedRoles);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Roles por Uso de Ítem Actualizados')
                    .setDescription(`Los roles permitidos para usar ítems han sido establecidos a: \n\`${useItemAllowedRoles.join('`, `') || 'Ninguno'}\``)
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            }
            default:
                await interaction.followUp({ content: '🤔 Modal de configuración no reconocido.', flags: MessageFlags.Ephemeral });
        }
    }
};