const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// ELIMINADA: const { defer, reply } = require('../../utils/responseUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testadmin')
        .setDescription('Comando de prueba solo para administradores. 👑')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // NO LLAMES A defer() AQUÍ. index.js ya lo hizo automáticamente como efímero.

        const embed = createCaborcaEmbed({
            title: '👑 Acceso de Administrador Confirmado',
            description: `¡Felicidades, **${interaction.user.username}**! Parece que tienes permisos de administrador. Este comando funciona correctamente. ✅`,
            color: '#2ECC71'
        });

        // Usa interaction.editReply para enviar el contenido. Será efímero porque ya lo diferimos efímeramente.
        await interaction.editReply({ embeds: [embed] });
    },
};