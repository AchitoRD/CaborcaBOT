const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// CAMBIO CLAVE: Importa UserEconomy directamente desde economyDatabase.js
const { UserEconomy } = require('../../database/economyDatabase'); 
const { getRemainingCooldown, setCooldown } = require('../../utils/cooldownManager');
const { getConfig } = require('../../utils/configManager'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Trabaja en Caborca para ganar dinero. 👷‍♂️'),
    async execute(interaction) {
        const userId = interaction.user.id;
        const member = interaction.member;

        const workConfig = await getConfig('workConfig'); 

        // Asegúrate de que workConfig y workConfig.roles no sean undefined/null
        const requiredRoles = workConfig?.roles || [];
        const hasRequiredRole = requiredRoles.length > 0 ? requiredRoles.some(roleId => member.roles.cache.has(roleId)) : true; // Si no hay roles configurados, cualquiera puede usarlo.

        if (!hasRequiredRole) {
            const embed = createCaborcaEmbed({
                title: '🚫 Rol No Autorizado',
                description: `No tienes el rol necesario para usar el comando \`/work\`. Este comando es para roles de trabajo específicos en Caborca RP.`,
                color: '#FFA500'
            });
            return await interaction.editReply({ embeds: [embed] });
        }

        // Asegúrate de que workConfig.cooldown tenga un valor válido
        const cooldownTime = workConfig?.cooldown || 0; // Valor por defecto si no está configurado
        const remainingCooldown = getRemainingCooldown(userId, 'work', cooldownTime);

        if (remainingCooldown > 0) {
            const minutes = Math.floor(remainingCooldown / 60000);
            const seconds = Math.floor((remainingCooldown % 60000) / 1000);
            const embed = createCaborcaEmbed({
                title: '⏳ En Cooldown',
                description: `Ya has trabajado recientemente. Por favor, espera **${minutes}m ${seconds}s** para volver a trabajar.`,
                color: '#FF0000'
            });
            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            // Asegúrate de que minAmount y maxAmount sean válidos
            const minAmount = workConfig?.minAmount || 0;
            const maxAmount = workConfig?.maxAmount || 0;
            const earnedAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
            
            userEconomy.balance += earnedAmount;
            await userEconomy.save();

            setCooldown(userId, 'work', cooldownTime);

            const embed = createCaborcaEmbed({
                title: '✅ ¡Trabajo Completado!',
                description: `¡Has trabajado duro y ganado **$${earnedAmount} Caborca Bucks**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${userEconomy.balance}`, inline: true },
                ],
                footer: { text: `Puedes volver a trabajar en ${Math.floor(cooldownTime / 3600000)} hora(s).` },
                color: '#2ECC71'
            });
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al trabajar:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Trabajar',
                description: 'Hubo un problema al intentar trabajar. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};