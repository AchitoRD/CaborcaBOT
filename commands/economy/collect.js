// commands/economy/collect.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { UserEconomy } = require('../../database/economyDatabase');
const { getRemainingCooldown, setCooldown } = require('../../utils/cooldownManager');
const { getConfig } = require('../../utils/configManager'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('collect')
        .setDescription('Recolecta tus ingresos periódicos de Caborca. 📦'),
        version: '1.0.1', // <-- Puedes añadir esto
    state: 'Producción', // <-- Y esto
    async execute(interaction) {
        const userId = interaction.user.id;
        const member = interaction.member;

        let collectConfigs = await getConfig('collectConfig');
        if (!Array.isArray(collectConfigs)) {
            collectConfigs = [];
        }

        let userCollectConfig = null;
        let givingRoleName = "Rol no especificado"; // Variable para guardar el nombre del rol que da dinero

        for (const config of collectConfigs) {
            if (member.roles.cache.has(config.roleId)) {
                userCollectConfig = config;
                // Intentamos obtener el nombre del rol si existe
                const role = interaction.guild.roles.cache.get(config.roleId);
                if (role) {
                    givingRoleName = role.name;
                } else {
                    givingRoleName = `ID de Rol: ${config.roleId}`; // Si no se encuentra, mostrar el ID
                }
                break;
            }
        }

        let collectAmount = 0;
        let cooldownHours = 0;
        let hasAnyCollectConfigDefined = collectConfigs.length > 0; 

        if (userCollectConfig) {
            collectAmount = userCollectConfig.amount;
            cooldownHours = userCollectConfig.cooldownHours;
        } else if (hasAnyCollectConfigDefined) { 
            const embed = createCaborcaEmbed({
                title: '🚫 Rol No Autorizado',
                description: `No tienes el rol necesario para usar el comando \`/collect\`. Este comando es para roles específicos de Caborca RP.`,
                color: '#FFA500'
            });
            return await interaction.editReply({ embeds: [embed] });
        } else { 
            const embed = createCaborcaEmbed({
                title: '❌ Recolección No Configurada',
                description: 'El sistema de recolección de dinero no ha sido configurado por los administradores. No hay roles ni montos definidos para este comando.',
                color: '#FF0000'
            });
            return await interaction.editReply({ embeds: [embed] });
        }
        
        const cooldownMs = cooldownHours * 3600000;

        const remainingCooldown = getRemainingCooldown(userId, 'collect', cooldownMs);

        if (remainingCooldown > 0) {
            // Calcula las horas y minutos restantes
            const remainingHours = Math.floor(remainingCooldown / 3600000);
            const remainingMinutes = Math.floor((remainingCooldown % 3600000) / 60000);
            const remainingSeconds = Math.floor(((remainingCooldown % 3600000) % 60000) / 1000);
            
            let timeMessage = '';
            if (remainingHours > 0) {
                timeMessage += `**${remainingHours}h** `;
            }
            if (remainingMinutes > 0) {
                timeMessage += `**${remainingMinutes}m** `;
            }
            if (remainingSeconds > 0 || timeMessage === '') { // Asegura que muestre segundos si no hay horas/minutos
                timeMessage += `**${remainingSeconds}s**`;
            }

            const embed = createCaborcaEmbed({
                title: '⏳ En Cooldown',
                description: `Ya has recolectado recientemente. Por favor, espera ${timeMessage.trim()} para volver a recolectar.`,
                color: '#FF0000'
            });
            return await interaction.editReply({ embeds: [embed] });
        }

        if (collectAmount === 0) {
            return; 
        }

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            userEconomy.balance += collectAmount;
            await userEconomy.save();

            setCooldown(userId, 'collect', cooldownMs);

            const embed = createCaborcaEmbed({
                title: '✅ ¡Recolección Exitosa!',
                description: `Has recolectado **$${collectAmount} Caborca Bucks**!`,
                fields: [
                    { name: 'Rol que te dio el dinero', value: `\`${givingRoleName}\``, inline: true }, // Muestra el rol
                    { name: 'Cantidad recolectada', value: `$${collectAmount.toLocaleString()}`, inline: true }, // Muestra la cantidad
                    { name: 'Tu nuevo saldo', value: `$${userEconomy.balance.toLocaleString()}`, inline: true },
                ],
                footer: { text: `Puedes volver a recolectar en ${cooldownHours} hora(s).` },
                color: '#2ECC71'
            });
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al recolectar dinero:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Recolectar',
                description: 'Hubo un problema al intentar recolectar dinero. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};