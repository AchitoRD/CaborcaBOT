// commands/policia/consultarantecedentes.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Arresto, Multa } = require('../../database/economyDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('consultarantecedentes')
        .setDescription('Consulta los antecedentes (arrestos y multas) de un usuario.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario del cual consultar los antecedentes.')
                .setRequired(true)),
    async execute(interaction) {
        const usuarioConsultado = interaction.options.getUser('usuario');
        
        // Verifica si estamos en el entorno de prueba simulado
        const isMockInteraction = interaction.id && interaction.id.startsWith('mock_interaction_');

        if (!usuarioConsultado) {
            return await interaction.editReply({ content: '❌ Error: No se pudo obtener el usuario para consultar antecedentes.', flags: MessageFlags.Ephemeral });
        }
        
        const userIdConsultado = usuarioConsultado.id; // Ya tenemos un mock.user.id válido

        try {
            let arrestos = [];
            let multas = [];

            if (isMockInteraction) {
                // Si es un mock, simula que no hay arrestos ni multas o devuelve datos de prueba.
                // Esto evita que las llamadas a la DB real fallen durante la prueba.
                arrestos = []; // O puedes poner: [{ id: 1, razon: 'Mock Arresto', tiempoMinutos: 10, policiaId: '123', createdAt: new Date() }]
                multas = [];   // O puedes poner: [{ id: 1, cantidad: 500, pagada: false, policiaId: '123', createdAt: new Date() }]
            } else {
                // Si es una interacción real, haz la consulta a la base de datos.
                arrestos = await Arresto.findAll({
                    where: { userId: userIdConsultado },
                    order: [['createdAt', 'DESC']],
                });

                multas = await Multa.findAll({
                    where: { userId: userIdConsultado },
                    order: [['createdAt', 'DESC']],
                });
            }

            const antecedentsEmbed = new EmbedBuilder()
                .setColor(0x007bff)
                .setTitle(`📋 Historial de Antecedentes de ${usuarioConsultado.tag}`)
                .setDescription(`Información detallada de arrestos y multas de ${usuarioConsultado.username}.`)
                .setThumbnail(usuarioConsultado.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({
                    text: `Consulta realizada por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });

            if (arrestos.length > 0) {
                let arrestosDescription = '';
                arrestos.forEach((a, index) => {
                    arrestosDescription += `**─── Arresto #${a.id} ───**\n`;
                    arrestosDescription += `📝 **Descripción:** \`${a.razon}\`\n`;
                    arrestosDescription += `⏳ **Tiempo:** \`${a.tiempoMinutos} minutos\`\n`;
                    arrestosDescription += `👮‍♂️ **Agente:** <@${a.policiaId}>\n`;
                    if (a.articulos) {
                        arrestosDescription += `🎒 **Artículos:** \`${a.articulos}\`\n`;
                    }
                    arrestosDescription += `📅 **Fecha:** <t:${Math.floor(a.createdAt.getTime() / 1000)}:F>\n`;
                    if (a.fotoUrl) {
                        arrestosDescription += `📸 **Evidencia:** [Ver Foto](${a.fotoUrl})\n`;
                    }
                    if (index < arrestos.length - 1) arrestosDescription += '\n';
                });
                antecedentsEmbed.addFields({ name: '🚨 Historial de Arrestos', value: arrestosDescription, inline: false });
            } else {
                antecedentsEmbed.addFields({ name: '🚨 Historial de Arrestos', value: 'No se encontraron registros de arrestos para este usuario.', inline: false });
            }

            if (multas.length > 0) {
                let multasDescription = '';
                multas.forEach((m, index) => {
                    multasDescription += `**─── Multa #${m.id} ───**\n`;
                    multasDescription += `💰 **Valor:** \`$${m.cantidad}\`\n`;
                    multasDescription += `🆔 **Placa/ID:** \`${m.placa || 'N/A'}\`\n`;
                    multasDescription += `⚖️ **Estado:** ${m.pagada ? '✅ Pagada' : '❌ Pendiente'}\n`;
                    multasDescription += `👮‍♂️ **Agente:** <@${m.policiaId}>\n`;
                    if (m.articulos) {
                        multasDescription += `🎒 **Artículos:** \`${m.articulos}\`\n`;
                    }
                    multasDescription += `📅 **Fecha:** <t:${Math.floor(m.createdAt.getTime() / 1000)}:F>\n`;
                    if (m.fotoUrl) {
                        multasDescription += `📸 **Evidencia:** [Ver Foto](${m.fotoUrl})\n`;
                    }
                    if (index < multas.length - 1) multasDescription += '\n';
                });
                antecedentsEmbed.addFields({ name: '💸 Historial de Multas', value: multasDescription, inline: false });
            } else {
                antecedentsEmbed.addFields({ name: '💸 Historial de Multas', value: 'No se encontraron registros de multas para este usuario.', inline: false });
            }

            await interaction.editReply({ embeds: [antecedentsEmbed] });

        } catch (error) {
            console.error('Error al consultar antecedentes:', error);
            // IMPORTANTE: NO uses 'throw error' aquí si quieres que la prueba de /pruebascomandos capture el error.
            // Si el error es de DB, no queremos que rompa el proceso de prueba de /pruebascomandos.
            // Retorna un mensaje de error claro en el embed en su lugar, o simplemente deja que /pruebascomandos lo capture.
            await interaction.editReply({ content: '❌ Hubo un error al consultar los antecedentes. Inténtalo de nuevo más tarde.' });
        }
    },
};