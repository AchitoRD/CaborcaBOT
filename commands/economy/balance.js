// commands/economy/balance.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy'); // Importa el modelo

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Muestra tu saldo actual de Caborca Bucks. 💰'),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;

        try {
            // Encuentra o crea el usuario en la DB de economía
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 } // Dinero inicial
            });

            const embed = createCaborcaEmbed({
                title: `💰 Tu Billetera de Caborca RP`,
                description: `¡Hola **${interaction.user.username}**!`,
                fields: [
                    { name: 'Saldo Actual', value: `**$${userEconomy.balance} Caborca Bucks** 🤑`, inline: true },
                ],
                footer: { text: '¡Gana más Caborca Bucks en el desierto de Caborca!' },
            });

            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            // La propiedad 'ephemeral' ya fue establecida por commandHandler.js en la deferencia inicial.
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener balance:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Consultar Balance',
                description: 'Hubo un problema al intentar obtener tu saldo. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};