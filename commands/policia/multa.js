const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Multa, UserEconomy } = require('../../database/economyDatabase');
// ELIMINADA: const { defer, reply } = require('../../utils/responseUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('multa')
        .setDescription('Impone una multa a un usuario con detalles específicos.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario a quien se le impondrá la multa.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('placa')
                .setDescription('Placa del vehículo o ID de la persona multada.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('valor_multa')
                .setDescription('La cantidad de dinero de la multa.')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('articulos')
                .setDescription('Artículos incautados al momento de la multa (ej: licencia, vehículo , Articulo).')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('foto')
                .setDescription('Sube una imagen/evidencia de la multa (opcional).')
                .setRequired(false)),
    async execute(interaction) {
        // NO LLAMES A defer() AQUÍ. index.js ya lo hizo automáticamente.
        // Si quieres que sea pública, edita la respuesta con ephemeral: false.
        await interaction.editReply({ content: 'Procesando multa...', ephemeral: false });

        const usuarioMultado = interaction.options.getUser('usuario');
        const placa = interaction.options.getString('placa');
        const valorMulta = interaction.options.getInteger('valor_multa');
        const articulosIncautados = interaction.options.getString('articulos');
        const fotoAttachment = interaction.options.getAttachment('foto');

        const policia = interaction.user;
        const policiaId = policia.id;
        const userIdMultado = usuarioMultado.id;

        if (!userIdMultado || !placa || !valorMulta || !policiaId) {
            return await interaction.editReply({ content: '❌ Error: Asegúrate de proporcionar el **Usuario**, la **Placa** y el **Valor de la multa**.', flags: MessageFlags.Ephemeral });
        }

        const fotoUrl = fotoAttachment ? fotoAttachment.url : null;

        try {
            const nuevaMulta = await Multa.create({
                userId: userIdMultado,
                policiaId: policiaId,
                cantidad: valorMulta,
                placa: placa,
                articulos: articulosIncautados,
                razon: `Multa con placa ${placa} y valor ${valorMulta}.`,
                fotoUrl: fotoUrl,
                pagada: false,
            });

            const fineEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('💸 **CABORCA RP | INFORME DE MULTA** 💸')
                .setDescription(`📜 Una nueva multa ha sido impuesta en Caborca Roleplay.`)
                .setThumbnail(usuarioMultado.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Multado', value: `<@${usuarioMultado.id}> (${usuarioMultado.tag})`, inline: true },
                    { name: '👮‍♂️ Agente', value: `<@${policia.id}> (${policia.tag})`, inline: true },
                    { name: '💰 Valor de la Multa', value: `\`$${valorMulta}\``, inline: true },
                    { name: '🆔 Placa / ID', value: `\`${placa}\``, inline: true },
                    { name: '⚖️ Estado', value: '❌ **PENDIENTE**', inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: '🎒 Artículos Incautados', value: `\`${articulosIncautados || 'Ninguno'}\``, inline: false },
                )
                .setTimestamp()
                .setFooter({
                    text: `ID de Multa: ${nuevaMulta.id} | El usuario puede pagarla con /pagarmulta`,
                    iconURL: 'https://i.imgur.com/3257125.png'
                });

            if (fotoUrl) {
                fineEmbed.setImage(fotoUrl);
            }

            // Edita la respuesta diferida. Si quieres que sea pública, asegúrate de `ephemeral: false`
            await interaction.editReply({ embeds: [fineEmbed], ephemeral: false });

        } catch (error) {
            console.error('Error al imponer multa:', error);
            let errorMessage = '❌ Hubo un error inesperado al intentar imponer la multa. Por favor, inténtalo de nuevo.';
            if (error.name === 'SequelizeValidationError') {
                errorMessage = '❌ Error de validación al imponer la multa: Asegúrate de que todos los campos requeridos estén llenos correctamente.';
            }
            // Lanza el error para que index.js lo capture y maneje globalmente.
            throw error;
        }
    },
};