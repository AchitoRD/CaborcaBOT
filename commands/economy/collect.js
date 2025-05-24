// commands/economy/collect.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');
const { getRemainingCooldown, setCooldown } = require('../../utils/cooldownManager');
const { getConfig } = require('../../utils/configManager'); // Importa getConfig

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collect')
        .setDescription('Recolecta tus ingresos periódicos de Caborca. 📦'),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;
        const member = interaction.member;

        const collectConfig = await getConfig('collectConfig'); // Carga la config de collect

        const hasRequiredRole = collectConfig.roles.some(roleId => member.roles.cache.has(roleId));
        if (collectConfig.roles.length > 0 && !hasRequiredRole) {
            const embed = createCaborcaEmbed({
                title: '🚫 Rol No Autorizado',
                description: `No tienes el rol necesario para usar el comando \`/collect\`. Este comando es para roles específicos de Caborca RP.`,
                color: '#FFA500'
            });
            // CAMBIO CLAVE: Usar editReply()
            return await interaction.editReply({ embeds: [embed] });
        }

        const remainingCooldown = getRemainingCooldown(userId, 'collect', collectConfig.cooldown);

        if (remainingCooldown > 0) {
            const minutes = Math.floor(remainingCooldown / 60000);
            const seconds = Math.floor((remainingCooldown % 60000) / 1000);
            const embed = createCaborcaEmbed({
                title: '⏳ En Cooldown',
                description: `Ya has recolectado recientemente. Por favor, espera **${minutes}m ${seconds}s** para volver a recolectar.`,
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply()
            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            userEconomy.balance += collectConfig.amount;
            await userEconomy.save();

            setCooldown(userId, 'collect', collectConfig.cooldown);

            const embed = createCaborcaEmbed({
                title: '✅ ¡Recolección Exitosa!',
                description: `Has recolectado **$${collectConfig.amount} Caborca Bucks**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${userEconomy.balance}`, inline: true },
                ],
                footer: { text: `Puedes volver a recolectar en ${Math.floor(collectConfig.cooldown / 3600000)} hora(s).` },
                color: '#2ECC71'
            });
            // CAMBIO CLAVE: Usar editReply()
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al recolectar dinero:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Recolectar',
                description: 'Hubo un problema al intentar recolectar dinero. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply()
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};