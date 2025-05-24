// commands/economy/comprar.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');
const { shop } = require('../../config'); // Importa la config de la tienda

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprar')
        .setDescription('Compra un artículo de la tienda de Caborca. 🛍️')
        .addStringOption(option =>
            option.setName('articulo_id') // Cambiado a 'articulo_id' para ser más específico
                .setDescription('El ID del artículo que deseas comprar (ver /tienda)')
                .setRequired(true)),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;
        const itemId = interaction.options.getString('articulo_id').toLowerCase(); // Convertir a minúsculas para coincidir

        const itemToBuy = shop.items.find(item => item.id === itemId);

        if (!itemToBuy) {
            const notFoundEmbed = createCaborcaEmbed({
                title: '❌ Artículo No Encontrado',
                description: `El ID de artículo \`${itemId}\` no existe en la tienda. Revisa la lista con \`/tienda\`.`,
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            return await interaction.editReply({ embeds: [notFoundEmbed] });
        }

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            if (userEconomy.balance < itemToBuy.price) {
                const insufficientFundsEmbed = createCaborcaEmbed({
                    title: '💸 Fondos Insuficientes',
                    description: `No tienes suficientes Caborca Bucks para comprar **${itemToBuy.name}**. Necesitas $${itemToBuy.price}, y tú tienes $${userEconomy.balance}.`,
                    color: '#FFA500'
                });
                // CAMBIO CLAVE: Usar editReply() en lugar de reply().
                return await interaction.editReply({ embeds: [insufficientFundsEmbed] });
            }

            // Deducir dinero y añadir item al inventario
            userEconomy.balance -= itemToBuy.price;
            userEconomy.inventory.push(itemToBuy.id); // Guardar el ID del item
            await userEconomy.save();

            const successEmbed = createCaborcaEmbed({
                title: '✅ ¡Compra Exitosa!',
                description: `Has adquirido **${itemToBuy.name}** por **$${itemToBuy.price} Caborca Bucks**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${userEconomy.balance}`, inline: true },
                    { name: 'Artículo Comprado', value: itemToBuy.name, inline: true },
                ],
                footer: { text: '¡Revisa tu inventario con /inventario y usa /item use para activar efectos!' },
                color: '#2ECC71'
            });

            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error al comprar artículo:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Comprar',
                description: 'Hubo un problema al intentar procesar tu compra. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};