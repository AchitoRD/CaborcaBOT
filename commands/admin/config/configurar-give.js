// commands/admin/config/configurar-give.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../../utils/embedBuilder');
const { saveConfig, getConfig } = require('../../../utils/configManager'); // Importa del configManager

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurar-give')
        .setDescription('Configura los roles que pueden usar el comando /give. (Solo Admin) ⚙️')
        .addStringOption(option =>
            option.setName('roles_id')
                .setDescription('IDs de los roles, separados por comas (ej: ID1,ID2,ID3). Deja vacío para ver actuales.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo administradores
    async execute(interaction) {
        const rolesIdInput = interaction.options.getString('roles_id');

        if (rolesIdInput === null) { // Mostrar configuración actual
            const currentRoles = await getConfig('giveRoles', null) || [];
            const embed = createCaborcaEmbed({
                title: '⚙️ Configuración Actual de /give',
                description: `Los roles autorizados para usar \`/give\` son:\n${currentRoles.map(id => `<@&${id}>`).join('\n') || 'Ninguno configurado.'}`,
                footer: { text: 'Usa /configurar-give <IDs> para actualizar.' }
            });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Limpiar y validar IDs de roles
        const newRoles = rolesIdInput.split(',').map(id => id.trim()).filter(id => id.length > 0);
        
        // Verificar que los IDs sean válidos y existan en el servidor (opcional, pero buena práctica)
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

        const success = await saveConfig('giveRoles', newRoles);

        if (success) {
            const embed = createCaborcaEmbed({
                title: '✅ Configuración de /give Actualizada',
                description: `Ahora los roles autorizados para \`/give\` son:\n${newRoles.map(id => `<@&${id}>`).join('\n') || 'Ninguno.'}`,
                color: '#2ECC71'
            });
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } else {
            const embed = createCaborcaEmbed({
                title: '❌ Error al Guardar',
                description: 'Hubo un error al guardar la configuración de roles para `/give`.',
                color: '#FF0000'
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};