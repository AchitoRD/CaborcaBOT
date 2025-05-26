const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// CAMBIO CLAVE: Importa UserEconomy directamente desde economyDatabase.js
const { UserEconomy } = require('../../database/economyDatabase'); 
const { shop } = require('../../config'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprar')
        .setDescription('Compra un artículo de la tienda de Caborca. 🛍️')
        .addStringOption(option =>
            option.setName('articulo_id') 
                .setDescription('El ID del artículo que deseas comprar (ver /tienda)')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const itemId = interaction.options.getString('articulo_id').toLowerCase(); 

        const itemToBuy = shop.items.find(item => item.id === itemId);

        if (!itemToBuy) {
            const notFoundEmbed = createCaborcaEmbed({
                title: '❌ Artículo No Encontrado',
                description: `El ID de artículo \`${itemId}\` no existe en la tienda. Revisa la lista con \`/tienda\`.`,
                color: '#FF0000'
            });
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
                return await interaction.editReply({ embeds: [insufficientFundsEmbed] });
            }

            // Deducir dinero y añadir item al inventario
            userEconomy.balance -= itemToBuy.price;
            // Asegúrate de que userEconomy.inventory sea un array antes de hacer push
            if (!Array.isArray(userEconomy.inventory)) {
                userEconomy.inventory = []; 
            }
            userEconomy.inventory.push(itemToBuy.id); 
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

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error al comprar artículo:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Comprar',
                description: 'Hubo un problema al intentar procesar tu compra. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};