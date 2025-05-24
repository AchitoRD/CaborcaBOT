// commands/rp/verificar.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { getConfig } = require('../../utils/configManager');
const Verification = require('../../models/Verification');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verificar')
        .setDescription('Inicia el proceso de verificación para tu cuenta de Roblox. ✅')
        .addStringOption(option =>
            option.setName('nombre_roblox')
                .setDescription('Tu nombre de usuario EXACTO en Roblox.')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('comprobante_imagen')
                .setDescription('Adjunta una captura de pantalla de tu perfil de Roblox mostrando tu nombre.')
                .setRequired(true)),
    async execute(interaction) {
        const robloxName = interaction.options.getString('nombre_roblox');
        const comprobanteImagen = interaction.options.getAttachment('comprobante_imagen');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        if (!comprobanteImagen || !comprobanteImagen.contentType || !comprobanteImagen.contentType.startsWith('image/')) {
            const invalidImageEmbed = createCaborcaEmbed({
                title: '❌ Archivo Inválido',
                description: 'Por favor, adjunta una **imagen** (JPG, PNG, GIF, etc.) como comprobante.',
                color: '#FF0000'
            });
            return await interaction.editReply({ embeds: [invalidImageEmbed] });
        }

        const existingVerification = await Verification.findOne({ where: { discordId: userId } });

        if (existingVerification) {
            let message = '';
            if (existingVerification.status === 'pending') {
                message = 'Ya tienes una solicitud de verificación pendiente. Por favor, espera a que sea revisada.';
            } else if (existingVerification.status === 'approved') {
                message = `¡Tu cuenta de Roblox ya está verificada como **${existingVerification.robloxName}**!`;
            } else if (existingVerification.status === 'rejected') {
                message = 'Tu última solicitud fue rechazada. Puedes enviar una nueva solicitud si lo deseas.';
            }

            const alreadyExistsEmbed = createCaborcaEmbed({
                title: 'ℹ️ Estado de Verificación',
                description: message,
                color: existingVerification.status === 'pending' ? '#FFA500' : (existingVerification.status === 'approved' ? '#2ECC71' : '#FF0000')
            });
            return await interaction.editReply({ embeds: [alreadyExistsEmbed] });
        }

        // --- Obtener configuraciones, incluyendo roles de staff ---
        const logsChannelId = await getConfig('logChannelId');
        const citizenRoleId = await getConfig('citizenRole');
        const staffRolesIds = await getConfig('staffRoles'); // <-- NUEVO: Obtener roles de staff

        const verifiedRoleId = citizenRoleId;

        // Asegúrate de que las configuraciones necesarias existan
        if (!logsChannelId || !verifiedRoleId || !staffRolesIds) { // <-- Añadido staffRolesIds a la verificación
            const noConfigEmbed = createCaborcaEmbed({
                title: '⚠️ Configuración Faltante',
                description: 'El canal de logs, el rol de ciudadano/verificado o los roles de staff no han sido configurados por el staff. Contacta a un administrador.',
                color: '#FFA500'
            });
            return await interaction.editReply({ embeds: [noConfigEmbed], ephemeral: true });
        }

        const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
        if (!logsChannel || logsChannel.type !== ChannelType.GuildText || !logsChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
            const invalidChannelEmbed = createCaborcaEmbed({
                title: '⚠️ Canal de Logs Inválido',
                description: 'El canal de logs configurado no es válido, no es un canal de texto o el bot no tiene permisos para enviar mensajes. Contacta a un administrador.',
                color: '#FFA500'
            });
            return await interaction.editReply({ embeds: [invalidChannelEmbed], ephemeral: true });
        }

        const verificationEmbed = new EmbedBuilder()
            .setColor(0x00B0E6)
            .setTitle('✅ Nueva Solicitud de Verificación de Roblox')
            .setDescription(`Un usuario ha solicitado verificación para su cuenta de Roblox.`)
            .addFields(
                { name: 'Usuario Discord', value: `<@${userId}> (\`${interaction.user.tag}\`)`, inline: true },
                { name: 'ID de Usuario Discord', value: `\`${userId}\``, inline: true },
                { name: 'Nombre de Usuario Roblox Solicitado', value: `\`${robloxName}\``, inline: false },
            )
            .setImage(comprobanteImagen.url)
            .setTimestamp()
            .setFooter({ text: `Solicitud enviada por ${interaction.user.tag}` });

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`verify_approve_${userId}_${robloxName}`)
                    .setLabel('Aprobar Verificación ✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`verify_reject_${userId}`)
                    .setLabel('Rechazar Verificación ❌')
                    .setStyle(ButtonStyle.Danger),
            );

        try {
            const newVerification = await Verification.create({
                discordId: userId,
                robloxName: robloxName,
                comprobanteUrl: comprobanteImagen.url,
                status: 'pending'
            });

            // --- NUEVO: Construir string de menciones a roles de staff ---
            let staffMentions = '';
            if (Array.isArray(staffRolesIds) && staffRolesIds.length > 0) {
                // Filtra los roles que realmente existen en el servidor
                const validStaffRoles = staffRolesIds.filter(roleId => interaction.guild.roles.cache.has(roleId));
                if (validStaffRoles.length > 0) {
                    staffMentions = validStaffRoles.map(roleId => `<@&${roleId}>`).join(' ');
                } else {
                    console.warn('Advertencia: Los IDs de roles de staff configurados no corresponden a roles válidos en el servidor.');
                }
            } else {
                console.warn('Advertencia: No hay roles de staff configurados para mencionar en las solicitudes de verificación.');
            }

            // Envía el mensaje con la solicitud y los botones al canal de logs
            const sentMessage = await logsChannel.send({
                content: `🚨 **¡Nueva Solicitud de Verificación!** ${staffMentions}`, // <-- Añadido el ping
                embeds: [verificationEmbed],
                components: [actionRow]
            });

            newVerification.messageId = sentMessage.id;
            await newVerification.save();

            const successEmbed = createCaborcaEmbed({
                title: '✅ Solicitud de Verificación Enviada',
                description: 'Tu solicitud de verificación ha sido enviada al staff. Por favor, espera a que sea revisada. ¡Gracias por tu paciencia!',
                color: '#2ECC71'
            });
            await interaction.editReply({ embeds: [successEmbed], ephemeral: true });

        } catch (error) {
            console.error('Error al enviar solicitud de verificación o guardar en DB:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Enviar Solicitud',
                description: 'Hubo un problema al intentar enviar tu solicitud de verificación. Por favor, inténtalo de nuevo más tarde. Si el problema persiste, contacta a un administrador.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};