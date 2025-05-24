// commands/economy/work.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');
const { getRemainingCooldown, setCooldown } = require('../../utils/cooldownManager');
const { getConfig } = require('../../utils/configManager'); // Importa getConfig

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Trabaja en Caborca para ganar dinero. 👷‍♂️'),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;
        const member = interaction.member;

        const workConfig = await getConfig('workConfig'); // Carga la config de work

        const hasRequiredRole = workConfig.roles.some(roleId => member.roles.cache.has(roleId));
        if (workConfig.roles.length > 0 && !hasRequiredRole) {
            const embed = createCaborcaEmbed({
                title: '🚫 Rol No Autorizado',
                description: `No tienes el rol necesario para usar el comando \`/work\`. Este comando es para roles de trabajo específicos en Caborca RP.`,
                color: '#FFA500'
            });
            // CAMBIO CLAVE: Usar editReply()
            return await interaction.editReply({ embeds: [embed] });
        }

        const remainingCooldown = getRemainingCooldown(userId, 'work', workConfig.cooldown);

        if (remainingCooldown > 0) {
            const minutes = Math.floor(remainingCooldown / 60000);
            const seconds = Math.floor((remainingCooldown % 60000) / 1000);
            const embed = createCaborcaEmbed({
                title: '⏳ En Cooldown',
                description: `Ya has trabajado recientemente. Por favor, espera **${minutes}m ${seconds}s** para volver a trabajar.`,
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

            const earnedAmount = Math.floor(Math.random() * (workConfig.maxAmount - workConfig.minAmount + 1)) + workConfig.minAmount;
            userEconomy.balance += earnedAmount;
            await userEconomy.save();

            setCooldown(userId, 'work', workConfig.cooldown);

            const embed = createCaborcaEmbed({
                title: '✅ ¡Trabajo Completado!',
                description: `¡Has trabajado duro y ganado **$${earnedAmount} Caborca Bucks**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${userEconomy.balance}`, inline: true },
                ],
                footer: { text: `Puedes volver a trabajar en ${Math.floor(workConfig.cooldown / 3600000)} hora(s).` },
                color: '#2ECC71'
            });
            // CAMBIO CLAVE: Usar editReply()
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al trabajar:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Trabajar',
                description: 'Hubo un problema al intentar trabajar. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply()
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};