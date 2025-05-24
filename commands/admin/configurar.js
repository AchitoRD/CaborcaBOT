// commands/admin/configurar.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getConfig, saveConfig } = require('../../utils/configManager'); // Asegúrate de que configManager tenga las funciones adecuadas

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar')
        .setDescription('Abre el panel de configuración del bot.')
        .setDefaultMemberPermissions(0), // Solo administradores pueden usarlo por defecto

    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.

        // Verifica si el usuario tiene permisos de ADMINISTRADOR
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return await interaction.editReply({ content: '❌ No tienes permisos para usar este comando.' });
        }

        const configEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⚙️ Panel de Configuración de Caborca Bot')
            .setDescription('Aquí puedes ajustar varias configuraciones de tu bot. Selecciona una opción para comenzar.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: 'Opciones Principales:', value: 'Usa los botones o el menú para configurar:' },
                { name: '💰 Economía', value: 'Configura roles y montos para comandos de economía como `/give`, `/collect`, `/work`.', inline: true },
                { name: '👥 Roles de Usuario', value: 'Define roles para `No Verificado`, `Ciudadano`, y `Staff`.', inline: true },
                { name: '📝 Canal de Logs', value: 'Establece el canal donde el bot enviará registros.', inline: true },
                { name: '👋 Mensajes de Bienvenida', value: 'Configura mensajes automáticos para nuevos miembros.', inline: true },
                { name: '🎟️ Tickets', value: 'Define la categoría para los canales de tickets.', inline: true },
                { name: '✨ Roles por Uso de Ítem', value: 'Configura qué roles pueden usar ítems de tu tienda.', inline: true },
                { name: '🗑️ Vaciar Configuración', value: 'Borra todas las configuraciones guardadas. ¡Úsalo con precaución!', inline: true }, // ¡NUEVO CAMPO!
                { name: '❌ Cerrar Panel', value: 'Cierra esta ventana de configuración.', inline: true },
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

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
                new ButtonBuilder().setCustomId('config_clear_db_btn').setLabel('Vaciar Configuración').setStyle(ButtonStyle.Danger), // ¡NUEVO BOTÓN!
                new ButtonBuilder().setCustomId('config_exit_btn').setLabel('Cerrar Panel').setStyle(ButtonStyle.Secondary), // Cambiado a Secondary para diferenciarlo
            );

        await interaction.editReply({
            embeds: [configEmbed],
            components: [rowButtons1, rowButtons2, rowButtons3]
        });
    },
};