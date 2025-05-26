// commands/economy/balance.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// CAMBIO CLAVE: Importa UserEconomy directamente desde economyDatabase.js
const { UserEconomy } = require('../../database/economyDatabase'); // <--- ¡CAMBIO AQUÍ!

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Muestra tu saldo actual de Caborca Bucks. 💰'),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;

        try {
            // Encuentra o crea el usuario en la DB de economía
            // Ahora UserEconomy es el modelo de Sequelize correctamente importado
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

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener balance:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Consultar Balance',
                description: 'Hubo un problema al intentar obtener tu saldo. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};