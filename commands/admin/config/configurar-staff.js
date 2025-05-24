// commands/admin/config/configurar-staff.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../../utils/embedBuilder');
const { saveConfig, getConfig } = require('../../../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-staff')
        .setDescription('Configura los roles de staff general del bot. (Solo Admin) ⚙️')
        .addStringOption(option =>
            option.setName('roles_id')
                .setDescription('IDs de los roles de staff, separados por comas (ej: ID1,ID2,ID3).')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const rolesIdInput = interaction.options.getString('roles_id');

        if (rolesIdInput === null) { // Mostrar configuración actual
            const currentRoles = await getConfig('staffRoles', null) || [];
            const embed = createCaborcaEmbed({
                title: '⚙️ Configuración Actual de Roles de Staff',
                description: `Los roles de staff general son:\n${currentRoles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.'}`,
                footer: { text: 'Usa /configurar-staff <IDs> para actualizar.' }
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const newRoles = rolesIdInput.split(',').map(id => id.trim()).filter(id => id.length > 0);
        
        const invalidRoles = [];
        for (const roleId of newRoles) {
            if (!interaction.guild.roles.cache.has(roleId)) {
                invalidRoles.push(roleId);
            }
        }

        if (invalidRoles.length > 0) {
            const embed = createCaborcaEmbed({
                title: '⚠️ IDs de Roles Inválidos',
                description: `Los siguientes IDs de roles no se encontraron en este servidor: \`${invalidRoles.join(', ')}\`.`,
                color: '#FFA500'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const success = await saveConfig('staffRoles', newRoles);

        if (success) {
            const embed = createCaborcaEmbed({
                title: '✅ Configuración de Staff Actualizada',
                description: `Ahora los roles de staff general son:\n${newRoles.map(id => `<@&${id}>`).join('\n') || 'Ninguno.'}`,
                color: '#2ECC71'
            });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else {
            const embed = createCaborcaEmbed({
                title: '❌ Error al Guardar',
                description: 'Hubo un error al guardar la configuración de roles de staff.',
                color: '#FF0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};