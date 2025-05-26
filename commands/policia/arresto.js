const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Arresto } = require('../../database/economyDatabase');
// ELIMINADA: const { defer, reply } = require('../../utils/responseUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('arresto')
        .setDescription('Registra un arresto en la base de datos con detalles específicos.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario que va a ser arrestado.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('tiempo')
                .setDescription('Tiempo de arresto en minutos.')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Una descripción detallada o razón del arresto.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('articulos')
                .setDescription('Artículos incautados al momento del arresto (ej: Articulo: 80).')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('foto')
                .setDescription('Sube una imagen/evidencia del arresto (opcional).')
                .setRequired(false)),
    async execute(interaction) {
        // NO LLAMES A defer() AQUÍ. index.js ya lo hizo automáticamente.
        // Si necesitas que la respuesta sea pública, tendrás que hacer editReply con ephemeral: false
        // o ajustar la deferencia global en index.js para este comando.
        // Asumiendo que quieres que sea público:
        await interaction.editReply({ content: 'Procesando arresto...', ephemeral: false });

        const usuarioArrestado = interaction.options.getUser('usuario');
        const tiempoMinutos = interaction.options.getInteger('tiempo');
        const descripcionArresto = interaction.options.getString('descripcion');
        const articulosIncautados = interaction.options.getString('articulos');
        const fotoAttachment = interaction.options.getAttachment('foto');

        const policia = interaction.user;
        const policiaId = policia.id;
        const userIdArrestado = usuarioArrestado.id;

        if (!userIdArrestado || !tiempoMinutos || !descripcionArresto || !policiaId) {
            // Si el error es en la validación inicial, usa editReply.
            return await interaction.editReply({ content: '❌ Error: Asegúrate de proporcionar el **Usuario**, el **Tiempo** de arresto y la **Descripción**.', flags: MessageFlags.Ephemeral });
        }

        const fotoUrl = fotoAttachment ? fotoAttachment.url : null;

        try {
            const nuevoArresto = await Arresto.create({
                userId: userIdArrestado,
                policiaId: policiaId,
                razon: descripcionArresto,
                tiempoMinutos: tiempoMinutos,
                fotoUrl: fotoUrl,
                articulos: articulosIncautados,
            });

            const arrestEmbed = new EmbedBuilder()
                .setColor(0xCD2026)
                .setTitle('🚨 **CABORCA RP | INFORME DE ARRESTO** 🚨')
                .setDescription(`⚠️ Un nuevo arresto ha sido registrado en el sistema. ⚠️`)
                .setThumbnail(usuarioArrestado.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Arrestado', value: `<@${usuarioArrestado.id}> (${usuarioArrestado.tag})`, inline: true },
                    { name: '👮‍♂️ Agente', value: `<@${policia.id}> (${policia.tag})`, inline: true },
                    { name: '⏳ Tiempo de Cárcel', value: `\`${tiempoMinutos} minutos\``, inline: true },
                    { name: '📝 Descripción del Arresto', value: `\`\`\`${descripcionArresto}\`\`\``, inline: false },
                    { name: '🎒 Artículos Incautados', value: `\`${articulosIncautados || 'Ninguno'}\``, inline: false },
                )
                .setTimestamp()
                .setFooter({
                    text: `ID de Arresto: ${nuevoArresto.id} | Fecha: ${new Date().toLocaleDateString('es-ES')}`,
                    iconURL: 'https://i.imgur.com/851722.png'
                });

            if (fotoUrl) {
                arrestEmbed.setImage(fotoUrl);
            }

            // Edita la respuesta diferida. Si quieres que sea pública, asegúrate de `ephemeral: false`
            await interaction.editReply({ embeds: [arrestEmbed], ephemeral: false });
        } catch (error) {
            console.error('Error al registrar arresto:', error);
            let errorMessage = '❌ Hubo un error inesperado al intentar registrar el arresto. Por favor, inténtalo de nuevo.';
            if (error.name === 'SequelizeValidationError') {
                errorMessage = '❌ Error de validación al registrar el arresto: Asegúrate de que todos los campos requeridos estén llenos correctamente.';
            }
            // Usa followUp para errores si el editReply ya fue para el embed, o editReply si no.
            // Para mantenerlo consistente con index.js, simplemente lanzamos el error.
            throw error;
        }
    },

    
};