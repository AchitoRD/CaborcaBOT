const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// CAMBIO CLAVE: Importa UserEconomy directamente desde economyDatabase.js
const { UserEconomy } = require('../../database/economyDatabase'); 
const { shop } = require('../../config'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Muestra los artículos que posees en Caborca RP. 🎒'),
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            const userInventoryIds = userEconomy.inventory;

            const inventoryItems = Array.isArray(userInventoryIds) 
                ? userInventoryIds.map(itemId => {
                    const item = shop.items.find(shopItem => shopItem.id === itemId);
                    return item ? item.name : `Artículo Desconocido (ID: ${itemId})`;
                })
                : []; // Si no es un array, se considera vacío

            let inventoryList = inventoryItems.length > 0
                ? inventoryItems.map(item => `- ${item}`).join('\n')
                : 'Tu inventario está vacío. ¡Visita la `/tienda`!';

            const embed = createCaborcaEmbed({
                title: `🎒 Inventario de ${interaction.user.username}`,
                description: inventoryList,
                footer: { text: 'Usa /item use <ID_del_articulo> para activar un item.' },
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Consultar Inventario',
                description: 'Hubo un problema al intentar obtener tu inventario. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};