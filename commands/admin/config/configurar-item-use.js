// commands/admin/config/configurar-item-use.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../../utils/embedBuilder');
const { saveConfig, getConfig } = require('../../../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-item-use')
        .setDescription('Configura los roles que pueden usar el comando /itemuse. (Solo Admin) ⚙️')
        .addStringOption(option =>
            option.setName('roles_id')
                .setDescription('IDs de los roles, separados por comas (ej: ID1,ID2,ID3). Deja vacío para ver actuales.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo administradores
    async execute(interaction) {
        const rolesIdInput = interaction.options.getString('roles_id');

        if (rolesIdInput === null) { // Mostrar configuración actual
            const currentRoles = await getConfig('useItemAllowedRoles', null) || [];
            const embed = createCaborcaEmbed({
                title: '⚙️ Configuración Actual de /itemuse',
                description: `Los roles autorizados para usar \`/itemuse\` son:\n${currentRoles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.'}`,
                footer: { text: 'Usa /configurar-item-use <IDs> para actualizar.' }
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

        const success = await saveConfig('useItemAllowedRoles', newRoles);

        if (success) {
            const embed = createCaborcaEmbed({
                title: '✅ Configuración de /itemuse Actualizada',
                description: `Ahora los roles autorizados para \`/itemuse\` son:\n${newRoles.map(id => `<@&${id}>`).join('\n') || 'Ninguno.'}`,
                color: '#2ECC71'
            });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else {
            const embed = createCaborcaEmbed({
                title: '❌ Error al Guardar',
                description: 'Hubo un error al guardar la configuración de roles para `/itemuse`.',
                color: '#FF0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};