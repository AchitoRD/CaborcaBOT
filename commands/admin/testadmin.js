// commands/admin/testadmin.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder'); 

module.exports = { // <--- ¡Asegúrate de que esta línea esté presente y correcta!
    data: new SlashCommandBuilder()
        .setName('testadmin')
        .setDescription('Comando de prueba solo para administradores. 👑')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 
    async execute(interaction) { // <--- ¡Asegúrate de que esta función esté presente y correcta!
        const embed = createCaborcaEmbed({
            title: '👑 Acceso de Administrador Confirmado',
            description: `¡Felicidades, ${interaction.user.username}! Parece que tienes permisos de administrador. Este comando funciona correctamente. ✅`,
            color: '#2ECC71' 
        });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
}; // <--- ¡Asegúrate de que cierre aquí con la llave del module.exports!