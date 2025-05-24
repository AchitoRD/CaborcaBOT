// commands/admin/config/configurar-work.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../../utils/embedBuilder');
const { saveConfig, getConfig } = require('../../../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-work')
        .setDescription('Configura /work (roles, rango de dinero, cooldown). (Solo Admin) ⚙️')
        .addStringOption(option =>
            option.setName('roles_id')
                .setDescription('IDs de roles permitidos, separados por comas (ej: ID1,ID2). Vacío para ninguno.')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('min_cantidad')
                .setDescription('Cantidad mínima de Caborca Bucks a ganar por /work.')
                .setRequired(false)
                .setMinValue(0))
        .addIntegerOption(option =>
            option.setName('max_cantidad')
                .setDescription('Cantidad máxima de Caborca Bucks a ganar por /work.')
                .setRequired(false)
                .setMinValue(1))
        .addIntegerOption(option =>
            option.setName('cooldown_horas')
                .setDescription('Tiempo de espera en horas para /work.')
                .setRequired(false)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const rolesIdInput = interaction.options.getString('roles_id');
        const minAmountInput = interaction.options.getInteger('min_cantidad');
        const maxAmountInput = interaction.options.getInteger('max_cantidad');
        const cooldownHoursInput = interaction.options.getInteger('cooldown_horas');

        let currentConfig = await getConfig('workConfig', null);
        if (!currentConfig) {
            currentConfig = { 
                minAmount: (await getConfig('workConfig', 'minAmount')) || 50, 
                maxAmount: (await getConfig('workConfig', 'maxAmount')) || 200, 
                cooldown: (await getConfig('workConfig', 'cooldown')) || 14400000, 
                roles: (await getConfig('workConfig', 'roles')) || [] 
            };
        }
        
        // Si no se proporcionaron opciones, muestra la configuración actual
        if (rolesIdInput === null && minAmountInput === null && maxAmountInput === null && cooldownHoursInput === null) {
            const rolesList = currentConfig.roles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.';
            const embed = createCaborcaEmbed({
                title: '⚙️ Configuración Actual de /work',
                description: `**Roles Permitidos:**\n${rolesList}\n\n` +
                             `**Rango de Ganancia:** $${currentConfig.minAmount} - $${currentConfig.maxAmount} Caborca Bucks\n` +
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
        if (minAmountInput !== null) {
            currentConfig.minAmount = minAmountInput;
        }
        if (maxAmountInput !== null) {
            currentConfig.maxAmount = maxAmountInput;
        }
        if (cooldownHoursInput !== null) {
            currentConfig.cooldown = cooldownHoursInput * 3600000;
        }

        // Validar que min no sea mayor que max
        if (currentConfig.minAmount > currentConfig.maxAmount) {
            const embed = createCaborcaEmbed({
                title: '❌ Error de Configuración',
                description: 'La cantidad mínima no puede ser mayor que la cantidad máxima de ganancia.',
                color: '#FF0000'
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const success = await saveConfig('workConfig', currentConfig);

        if (success) {
            const rolesList = currentConfig.roles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.';
            const embed = createCaborcaEmbed({
                title: '✅ Configuración de /work Actualizada',
                description: `**Roles Permitidos:**\n${rolesList}\n\n` +
                             `**Rango de Ganancia:** $${currentConfig.minAmount} - $${currentConfig.maxAmount} Caborca Bucks\n` +
                             `**Cooldown:** ${currentConfig.cooldown / 3600000} hora(s)`,
                color: '#2ECC71'
            });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else {
            const embed = createCaborcaEmbed({
                title: '❌ Error al Guardar',
                description: 'Hubo un error al guardar la configuración de roles para `/work`.',
                color: '#FF0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};