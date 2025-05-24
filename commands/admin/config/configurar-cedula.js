// commands/admin/config/configurar-cedula.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../../utils/embedBuilder');
const { saveConfig, getConfig } = require('../../../utils/configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-cedula')
        .setDescription('Configura el rol que se asigna al registrar cédula. (Solo Admin) ⚙️')
        .addStringOption(option =>
            option.setName('rol_ciudadano_id')
                .setDescription('ID del rol que se asignará (ej: Ciudadano, Verificado). Vacío para no asignar.')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('rol_no_verificado_id')
                .setDescription('ID del rol a remover (ej: No Verificado). Vacío para no remover.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const citizenRoleIdInput = interaction.options.getString('rol_ciudadano_id');
        const unverifiedRoleIdInput = interaction.options.getString('rol_no_verificado_id');

        // Obtener configuraciones actuales
        const currentCitizenRole = await getConfig('citizenRole', null);
        const currentUnverifiedRole = await getConfig('unverifiedRole', null);

        // Si no se proporcionaron opciones, muestra la configuración actual
        if (citizenRoleIdInput === null && unverifiedRoleIdInput === null) {
            const embed = createCaborcaEmbed({
                title: '⚙️ Configuración Actual de Cédulas',
                description: `**Rol de Ciudadano al Registrar Cédula:** ${currentCitizenRole ? `<@&${currentCitizenRole}>` : 'Ninguno.'}\n` +
                             `**Rol a Remover al Registrar Cédula:** ${currentUnverifiedRole ? `<@&${currentUnverifiedRole}>` : 'Ninguno.'}`,
                footer: { text: 'Usa las opciones para actualizar.' }
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let changesMade = false;
        let citizenRoleSuccess = true;
        let unverifiedRoleSuccess = true;

        if (citizenRoleIdInput !== null) {
            if (citizenRoleIdInput.length > 0 && !interaction.guild.roles.cache.has(citizenRoleIdInput)) {
                const embed = createCaborcaEmbed({
                    title: '⚠️ ID de Rol Inválido',
                    description: `El ID de rol de ciudadano \`${citizenRoleIdInput}\` no se encontró en este servidor.`,
                    color: '#FFA500'
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            citizenRoleSuccess = await saveConfig('citizenRole', citizenRoleIdInput.length > 0 ? citizenRoleIdInput : null);
            if (citizenRoleSuccess) changesMade = true;
        }

        if (unverifiedRoleIdInput !== null) {
            if (unverifiedRoleIdInput.length > 0 && !interaction.guild.roles.cache.has(unverifiedRoleIdInput)) {
                const embed = createCaborcaEmbed({
                    title: '⚠️ ID de Rol Inválido',
                    description: `El ID de rol "no verificado" \`${unverifiedRoleIdInput}\` no se encontró en este servidor.`,
                    color: '#FFA500'
                });
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            unverifiedRoleSuccess = await saveConfig('unverifiedRole', unverifiedRoleIdInput.length > 0 ? unverifiedRoleIdInput : null);
            if (unverifiedRoleSuccess) changesMade = true;
        }

        if (changesMade && citizenRoleSuccess && unverifiedRoleSuccess) {
            const newCitizenRole = await getConfig('citizenRole', null);
            const newUnverifiedRole = await getConfig('unverifiedRole', null);
            const embed = createCaborcaEmbed({
                title: '✅ Configuración de Cédula Actualizada',
                description: `**Rol de Ciudadano:** ${newCitizenRole ? `<@&${newCitizenRole}>` : 'Ninguno.'}\n` +
                             `**Rol a Remover:** ${newUnverifiedRole ? `<@&${newUnverifiedRole}>` : 'Ninguno.'}`,
                color: '#2ECC71'
            });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else if (!changesMade) {
            const embed = createCaborcaEmbed({
                title: 'ℹ️ Sin Cambios',
                description: 'No se proporcionaron nuevos valores para actualizar la configuración de cédulas.',
                color: '#3498DB'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = createCaborcaEmbed({
                title: '❌ Error al Guardar',
                description: 'Hubo un error al guardar la configuración de roles de cédula.',
                color: '#FF0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};