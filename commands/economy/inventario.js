// commands/economy/inventario.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');
const { shop } = require('../../config'); // Para acceder a los nombres de los ítems

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Muestra los artículos que posees en Caborca RP. 🎒'),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            const userInventoryIds = userEconomy.inventory;

            // Mapear los IDs de los ítems a sus nombres y descripciones completas
            const inventoryItems = userInventoryIds.map(itemId => {
                const item = shop.items.find(shopItem => shopItem.id === itemId);
                return item ? item.name : `Artículo Desconocido (ID: ${itemId})`;
            });

            let inventoryList = inventoryItems.length > 0
                ? inventoryItems.map(item => `- ${item}`).join('\n')
                : 'Tu inventario está vacío. ¡Visita la `/tienda`!';

            const embed = createCaborcaEmbed({
                title: `🎒 Inventario de ${interaction.user.username}`,
                description: inventoryList,
                footer: { text: 'Usa /item use <ID_del_articulo> para activar un item.' },
            });

            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            // La propiedad 'ephemeral' ya fue establecida por commandHandler.js en la deferencia inicial.
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error al obtener inventario:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Consultar Inventario',
                description: 'Hubo un problema al intentar obtener tu inventario. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};