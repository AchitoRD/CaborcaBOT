const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Arresto, Multa } = require('../../database/economyDatabase');
// ELIMINADA: const { defer, reply } = require('../../utils/responseUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('consultarantecedentes')
        .setDescription('Consulta los antecedentes (arrestos y multas) de un usuario.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario del cual consultar los antecedentes.')
                .setRequired(true)),
    async execute(interaction) {
        // NO LLAMES A defer() AQUÍ. index.js ya lo hizo automáticamente como efímero.

        const usuarioConsultado = interaction.options.getUser('usuario');
        const userIdConsultado = usuarioConsultado.id;

        if (!usuarioConsultado) {
            // Usa editReply para la primera respuesta
            return await interaction.editReply({ content: '❌ Error: No se pudo obtener el usuario para consultar antecedentes.', flags: MessageFlags.Ephemeral });
        }

        try {
            const arrestos = await Arresto.findAll({
                where: { userId: userIdConsultado },
                order: [['createdAt', 'DESC']],
            });

            const multas = await Multa.findAll({
                where: { userId: userIdConsultado },
                order: [['createdAt', 'DESC']],
            });

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

            // Usa editReply para la respuesta final. Es efímera porque index.js lo difirió así.
            await interaction.editReply({ embeds: [antecedentsEmbed] });

        } catch (error) {
            console.error('Error al consultar antecedentes:', error);
            // Lanza el error para que index.js lo capture y maneje globalmente.
            throw error;
        }
    },
};