// commands/admin/config/configurar-collect.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../../utils/embedBuilder');
const { saveConfig, getConfig } = require('../../../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-collect')
        .setDescription('Configura /collect (roles, cantidad, cooldown). (Solo Admin) ⚙️')
        .addStringOption(option =>
            option.setName('roles_id')
                .setDescription('IDs de roles permitidos, separados por comas (ej: ID1,ID2). Vacío para ninguno.')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Cantidad de Caborca Bucks a ganar por /collect.')
                .setRequired(false)
                .setMinValue(1))
        .addIntegerOption(option =>
            option.setName('cooldown_horas')
                .setDescription('Tiempo de espera en horas para /collect.')
                .setRequired(false)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const rolesIdInput = interaction.options.getString('roles_id');
        const amountInput = interaction.options.getInteger('cantidad');
        const cooldownHoursInput = interaction.options.getInteger('cooldown_horas');

        let currentConfig = await getConfig('collectConfig', null);
        // Si no existe, usa los valores por defecto del config.js
        if (!currentConfig) {
            currentConfig = { 
                amount: (await getConfig('collectConfig', 'amount')) || 100, 
                cooldown: (await getConfig('collectConfig', 'cooldown')) || 3600000, 
                roles: (await getConfig('collectConfig', 'roles')) || [] 
            };
        }

        // Si no se proporcionaron opciones, muestra la configuración actual
        if (rolesIdInput === null && amountInput === null && cooldownHoursInput === null) {
            const rolesList = currentConfig.roles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.';
            const embed = createCaborcaEmbed({
                title: '⚙️ Configuración Actual de /collect',
                description: `**Roles Permitidos:**\n${rolesList}\n\n` +
                             `**Cantidad por Recolección:** $${currentConfig.amount} Caborca Bucks\n` +
                             `**Cooldown:** ${currentConfig.cooldown / 3600000} hora(s)`,
                footer: { text: 'Usa las opciones para actualizar.' }
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Actualizar valores si se proporcionaron
        if (rolesIdInput !== null) {
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
            currentConfig.roles = newRoles;
        }
        if (amountInput !== null) {
            currentConfig.amount = amountInput;
        }
        if (cooldownHoursInput !== null) {
            currentConfig.cooldown = cooldownHoursInput * 3600000; // Convertir horas a milisegundos
        }

        const success = await saveConfig('collectConfig', currentConfig);

        if (success) {
            const rolesList = currentConfig.roles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.';
            const embed = createCaborcaEmbed({
                title: '✅ Configuración de /collect Actualizada',
                description: `**Roles Permitidos:**\n${rolesList}\n\n` +
                             `**Cantidad por Recolección:** $${currentConfig.amount} Caborca Bucks\n` +
                             `**Cooldown:** ${currentConfig.cooldown / 3600000} hora(s)`,
                color: '#2ECC71'
            });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else {
            const embed = createCaborcaEmbed({
                title: '❌ Error al Guardar',
                description: 'Hubo un error al guardar la configuración de roles para `/collect`.',
                color: '#FF0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};