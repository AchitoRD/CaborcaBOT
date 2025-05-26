const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const Verification = require('../../models/Verification'); // Importa tu modelo de Verificación
const { createCaborcaEmbed } = require('../../utils/embedBuilder'); // Para embeds consistentes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('borrarverificaciones')
        .setDescription('🚨 Borra TODOS los registros de verificación de la base de datos.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo administradores
    async execute(interaction) {
        // commandHandler.js ya hace deferReply, así que simplemente editamos esa respuesta.
        const confirmEmbed = createCaborcaEmbed({
            title: '⚠️ Confirmar Borrado de Verificaciones',
            description: 'Estás a punto de borrar **TODOS** los registros de verificación (pendientes, aprobadas, rechazadas) de la base de datos. ¡Esta acción es irreversible!\n\n¿Estás seguro de que quieres continuar?',
            color: '#FF0000' // Rojo para advertencia
        });

        await interaction.editReply({ embeds: [confirmEmbed], components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_clear_verifications_yes')
                        .setLabel('Sí, Borrar Todo')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('confirm_clear_verifications_no')
                        .setLabel('No, Cancelar')
                        .setStyle(ButtonStyle.Secondary),
                )
        ]});
    },

    // --- NUEVA FUNCIÓN PARA MANEJAR LOS BOTONES ---
    async handleButton(interaction) {
        // Aplazar la interacción del botón para que no muestre "pensando..."
        await interaction.deferUpdate();

        const { customId } = interaction;

        if (customId === 'confirm_clear_verifications_yes') {
            try {
                // Borrar todos los registros de verificación
                const deletedCount = await Verification.destroy({ where: {} }); // Cuidado: esto borra todo

                const successEmbed = createCaborcaEmbed({
                    title: '✅ Verificaciones Borradas',
                    description: `Se han borrado exitosamente **${deletedCount}** registros de verificación de la base de datos.`,
                    color: '#00FF00' // Verde para éxito
                });
                // Usar followUp para enviar un nuevo mensaje después de la confirmación
                await interaction.followUp({ embeds: [successEmbed], components: [], flags: MessageFlags.Ephemeral });

            } catch (error) {
                console.error('Error al borrar registros de verificación:', error);
                const errorEmbed = createCaborcaEmbed({
                    title: '❌ Error al Borrar Verificaciones',
                    description: 'Hubo un error al intentar borrar los registros de verificación. Por favor, revisa la consola del bot para más detalles.',
                    color: '#FF0000'
                });
                await interaction.followUp({ embeds: [errorEmbed], components: [], flags: MessageFlags.Ephemeral });
            }
        } else if (customId === 'confirm_clear_verifications_no') {
            const cancelEmbed = createCaborcaEmbed({
                title: '❌ Borrado de Verificaciones Cancelado',
                description: 'La operación de borrado de verificaciones ha sido cancelada.',
                color: '#FFA500' // Naranja para cancelación
            });
            await interaction.followUp({ embeds: [cancelEmbed], components: [], flags: MessageFlags.Ephemeral });
        }
    }
};