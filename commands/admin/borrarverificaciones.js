// commands/admin/borrarverificaciones.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const Verification = require('../../models/Verification'); // Importa tu modelo de Verificación
const { createCaborcaEmbed } = require('../../utils/embedBuilder'); // Para embeds consistentes

module.exports = {
    data: new SlashCommandBuilder()
        .setName('borrarverificaciones')
        .setDescription('🚨 Borra TODOS los registros de verificación de la base de datos.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo administradores
    async execute(interaction) {
        // --- ¡ELIMINADO! NO SE NECESITA deferReply AQUÍ porque commandHandler.js ya lo hace. ---
        // await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const confirmEmbed = createCaborcaEmbed({
            title: '⚠️ Confirmar Borrado de Verificaciones',
            description: 'Estás a punto de borrar **TODOS** los registros de verificación (pendientes, aprobadas, rechazadas) de la base de datos. ¡Esta acción es irreversible!\n\n¿Estás seguro de que quieres continuar?',
            color: '#FF0000' // Rojo para advertencia
        });

        // Como ya se diferió en commandHandler, ahora simplemente editamos esa respuesta.
        await interaction.editReply({ embeds: [confirmEmbed], components: [
            new ActionRowBuilder() // Asegurarse de que el ActionRowBuilder está aquí
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
};