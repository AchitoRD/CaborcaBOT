const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');
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
                    .setDescription('Configura roles que pueden usar ítems de la tienda.')
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
    },

    async handleSelectMenu(interaction) {
        await interaction.deferUpdate();

        const [selectedValue] = interaction.values;

        switch (selectedValue) {
            case 'config_economy': {
                const modal = new ModalBuilder()
                    .setCustomId('config_economy_modal')
                    .setTitle('💰 Configuración de Economía');

                const defaultGiveRoles = await getConfig('defaultGiveCommandRoles') || [];
                const collectConfig = await getConfig('collectConfig') || { amount: 0, cooldown: 0, roles: [] };
                const workConfig = await getConfig('workConfig') || { minAmount: 0, maxAmount: 0, cooldown: 0, roles: [] };

                const giveRolesInput = new TextInputBuilder()
                    .setCustomId('economy_give_roles')
                    .setLabel('Roles para /give (IDs, separados por coma)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Ej: 123..., 456...')
                    .setRequired(false)
                    .setValue(defaultGiveRoles.join(', '));

                const collectAmountInput = new TextInputBuilder()
                    .setCustomId('economy_collect_amount')
                    .setLabel('Monto para /collect')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 15000')
                    .setRequired(true)
                    .setValue(collectConfig.amount.toString());

                const collectCooldownInput = new TextInputBuilder()
                    .setCustomId('economy_collect_cooldown')
                    .setLabel('Cooldown /collect (milisegundos)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 3600000 (1 hora)')
                    .setRequired(true)
                    .setValue(collectConfig.cooldown.toString());

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


                modal.addComponents(
                    new ActionRowBuilder().addComponents(giveRolesInput),
                    new ActionRowBuilder().addComponents(collectAmountInput),
                    new ActionRowBuilder().addComponents(collectCooldownInput),
                    new ActionRowBuilder().addComponents(workMinAmountInput),
                    new ActionRowBuilder().addComponents(workMaxAmountInput)
                );

                await interaction.showModal(modal);
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
                    .setDescription('Estás a punto de borrar **TODAS** las configuraciones guardadas. Esta acción es irreversible y reseteará el bot a sus valores por defecto. ¿Estás seguro?')
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

                await interaction.followUp({ embeds: [confirmEmbed], components: [confirmRow], flags: MessageFlags.Ephemeral });
                break;
            }
            case 'config_exit':
                await interaction.deleteReply();
                await interaction.followUp({ content: '✅ Panel de configuración cerrado.', flags: MessageFlags.Ephemeral });
                break;
            default:
                await interaction.followUp({ content: '🤔 Opción de configuración no reconocida.', flags: MessageFlags.Ephemeral });
        }
    },

    async handleModalSubmit(interaction) {
        await interaction.deferUpdate();

        const { customId } = interaction;

        switch (customId) {
            case 'config_economy_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Deferir la respuesta del modal

                const giveRolesRaw = interaction.fields.getTextInputValue('economy_give_roles');
                const collectAmountRaw = interaction.fields.getTextInputValue('economy_collect_amount');
                const collectCooldownRaw = interaction.fields.getTextInputValue('economy_collect_cooldown');
                const workMinAmountRaw = interaction.fields.getTextInputValue('economy_work_min_amount');
                const workMaxAmountRaw = interaction.fields.getTextInputValue('economy_work_max_amount');

                const defaultGiveCommandRoles = giveRolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);
                const collectAmount = parseInt(collectAmountRaw);
                const collectCooldown = parseInt(collectCooldownRaw);
                const workMinAmount = parseInt(workMinAmountRaw);
                const workMaxAmount = parseInt(workMaxAmountRaw);

                if (isNaN(collectAmount) || isNaN(collectCooldown) || isNaN(workMinAmount) || isNaN(workMaxAmount) ||
                    collectAmount < 0 || collectCooldown < 0 || workMinAmount < 0 || workMaxAmount < 0 ||
                    workMinAmount > workMaxAmount) {
                    return await interaction.editReply({ content: '❌ Por favor, ingresa números válidos y positivos para los montos y cooldowns. Asegúrate de que el monto mínimo de trabajo no sea mayor que el máximo.' });
                }

                await saveConfig('defaultGiveCommandRoles', defaultGiveCommandRoles);
                await saveConfig('collectConfig', { amount: collectAmount, cooldown: collectCooldown, roles: [] }); // Roles de collect/work no se editan aquí para simplificar
                await saveConfig('workConfig', { minAmount: workMinAmount, maxAmount: workMaxAmount, cooldown: workConfig.cooldown, roles: [] }); // Mantener roles de work

                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración de Economía Actualizada')
                    .setDescription('Se han guardado las nuevas configuraciones para los comandos de economía.')
                    .addFields(
                        { name: 'Roles para /give:', value: defaultGiveCommandRoles.length > 0 ? `<@&${defaultGiveCommandRoles.join('>, <@&')}>` : 'Ninguno', inline: true },
                        { name: '`/collect` Monto:', value: `$${collectAmount.toLocaleString()}`, inline: true },
                        { name: '`/collect` Cooldown:', value: `${collectCooldown / 1000 / 60} minutos`, inline: true },
                        { name: '`/work` Monto Mín.:', value: `$${workMinAmount.toLocaleString()}`, inline: true },
                        { name: '`/work` Monto Máx.:', value: `$${workMaxAmount.toLocaleString()}`, inline: true },
                        { name: '`/work` Cooldown:', value: `${workConfig.cooldown / 1000 / 60 / 60} horas`, inline: true },
                    )
                    .setColor('Green');
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'config_user_roles_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
                    return await interaction.editReply({ content: `❌ Errores en la configuración de roles de usuario:\n${errors.join('\n')}` });
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
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'config_police_roles_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const rolesString = interaction.fields.getTextInputValue('policeRolesInput');
                const newPoliceRoles = rolesString.split(',').map(id => id.trim()).filter(id => id.length > 0);

                let errors = [];
                for (const roleId of newPoliceRoles) {
                    if (!interaction.guild.roles.cache.has(roleId)) {
                        errors.push(`El ID de Rol de Policía '${roleId}' no es válido.`);
                    }
                }

                if (errors.length > 0) {
                    return await interaction.editReply({ content: `❌ Errores en la configuración de roles de policía:\n${errors.join('\n')}` });
                }

                await saveConfig('policeRoles', newPoliceRoles);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Roles de Policía Actualizados')
                    .setDescription(`Los roles de policía han sido establecidos a: \n\`${newPoliceRoles.join('`, `') || 'Ninguno'}\``)
                    .setColor('Green');

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'config_logs_channel_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const channelId = interaction.fields.getTextInputValue('logs_channel_id').trim();
                const channel = interaction.guild.channels.cache.get(channelId);

                if (!channel || channel.type !== ChannelType.GuildText) {
                    return await interaction.editReply({ content: '❌ El ID de canal de logs no es válido o no es un canal de texto.' });
                }

                await saveConfig('logChannelId', channelId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Canal de Logs Actualizado')
                    .setDescription(`El canal de logs ha sido establecido a: <#${channelId}>`)
                    .setColor('Green');
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'config_welcome_messages_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
                    return await interaction.editReply({ content: `❌ Errores en la configuración de bienvenida:\n${errors.join('\n')}` });
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
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'config_ticket_channel_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const categoryId = interaction.fields.getTextInputValue('ticket_category_id').trim();
                const category = interaction.guild.channels.cache.get(categoryId);

                if (!category || category.type !== ChannelType.GuildCategory) {
                    return await interaction.editReply({ content: '❌ El ID de la categoría de tickets no es válido o no es una categoría de canal.' });
                }

                await saveConfig('ticketCategoryChannelId', categoryId);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Categoría de Tickets Actualizada')
                    .setDescription(`La categoría para los canales de tickets ha sido establecida a: \`${category.name}\``)
                    .setColor('Green');
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'config_use_item_roles_modal': {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const rolesRaw = interaction.fields.getTextInputValue('use_item_roles_ids');
                const useItemAllowedRoles = rolesRaw.split(',').map(id => id.trim()).filter(id => id.length > 0);

                let errors = [];
                for (const roleId of useItemAllowedRoles) {
                    if (!interaction.guild.roles.cache.has(roleId)) {
                        errors.push(`El ID de Rol '${roleId}' (uso de ítems) no es válido.`);
                    }
                }

                if (errors.length > 0) {
                    return await interaction.editReply({ content: `❌ Errores en la configuración de roles por uso de ítem:\n${errors.join('\n')}` });
                }

                await saveConfig('useItemAllowedRoles', useItemAllowedRoles);

                const embed = new EmbedBuilder()
                    .setTitle('✅ Roles por Uso de Ítem Actualizados')
                    .setDescription(`Los roles permitidos para usar ítems han sido establecidos a: \n\`${useItemAllowedRoles.join('`, `') || 'Ninguno'}\``)
                    .setColor('Green');
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            default:
                await interaction.followUp({ content: '🤔 Modal de configuración no reconocido.', flags: MessageFlags.Ephemeral });
        }
    },

    async handleButton(interaction) {
        await interaction.deferUpdate();
        const { customId } = interaction;

        if (customId === 'confirm_clear_config_yes') {
            try {
                await clearAllConfigs();
                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuración Borrada')
                    .setDescription('Todas las configuraciones han sido borradas y el bot ha sido reseteado a sus valores por defecto. Es posible que necesites reiniciar el bot para que algunos cambios surtan efecto.')
                    .setColor('Green');
                await interaction.followUp({ embeds: [embed], components: [], flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('Error al confirmar borrado de configuración:', error);
                await interaction.followUp({ content: '❌ Hubo un error al intentar borrar las configuraciones.', components: [], flags: MessageFlags.Ephemeral });
            }
        } else if (customId === 'confirm_clear_config_no') {
            const embed = new EmbedBuilder()
                .setTitle('❌ Borrado de Configuración Cancelado')
                .setDescription('La operación de borrado de configuraciones ha sido cancelada.')
                .setColor('Red');
            await interaction.followUp({ embeds: [embed], components: [], flags: MessageFlags.Ephemeral });
        }
    }
};