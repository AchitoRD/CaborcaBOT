// commands/economy/tienda.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { shop, serverBannerUrl } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tienda')
        .setDescription('Explora los artículos disponibles en la tienda de Caborca. 🏪'),
    async execute(interaction) {
        await interaction.editReply({
            content: 'Cargando tienda...',
            fetchReply: true,
            ephemeral: false
        });

        const welcomeEmbed = createCaborcaEmbed({
            title: '🏪 ¡Bienvenido a la Tienda Central de Caborca RP! 🌵',
            description: 'Explora nuestra amplia selección de artículos para tu vida en el desierto. \n\n**Selecciona una categoría en el menú desplegable para ver los productos:**',
            imageUrl: serverBannerUrl,
            footer: { text: '¡Compra con sabiduría! | Usa /comprar <ID_ARTICULO> para comprar' },
            color: '#FFD700'
        });

        const categories = [...new Set(shop.items.map(item => item.category))].filter(Boolean);

        const selectOptions = categories.map(category =>
            new StringSelectMenuOptionBuilder()
                .setLabel(category)
                .setDescription(`Ver artículos de la categoría: ${category}`)
                // CAMBIO CLAVE AQUI: Aseguramos que el valor sea 'minúsculas_con_guion_bajo'
                .setValue(`shop_category_${category.toLowerCase().replace(/\s+/g, '_')}`) 
        );

        let row = null;
        if (selectOptions.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('shop_category_select')
                .setPlaceholder('Selecciona una categoría de artículos...')
                .addOptions(selectOptions);

            row = new ActionRowBuilder()
                .addComponents(selectMenu);
        } else {
            welcomeEmbed.setDescription('No hay artículos disponibles en la tienda en este momento.');
            welcomeEmbed.setColor('#FF0000');
        }

        await interaction.editReply({
            embeds: [welcomeEmbed],
            components: row ? [row] : [],
        });
    },

    async handleShopSelectMenu(interaction) {
        await interaction.deferUpdate();

        const selectedValue = interaction.values[0];
        // CAMBIO CLAVE AQUI: Aseguramos que rawCategoryName sea 'minúsculas_con_guion_bajo'
        const rawCategoryNameProcessed = selectedValue.replace('shop_category_', ''); 
        
        // Para mostrar, lo convertimos a un nombre legible, pero no para la comparación
        const displayCategoryName = rawCategoryNameProcessed.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        const itemsInCategory = shop.items.filter(item => {
            // CAMBIO CLAVE AQUI: Normalizamos el nombre de la categoría del ítem a 'minúsculas_con_guion_bajo'
            const itemCategoryNormalized = item.category ? item.category.toLowerCase().replace(/\s+/g, '_') : '';
            return itemCategoryNormalized === rawCategoryNameProcessed;
        });

        let itemsListContent = '';
        if (itemsInCategory.length > 0) {
            itemsListContent = itemsInCategory.map(item =>
                `**${item.name}**\n\`ID: ${item.id}\` | Precio: \`$${item.price.toLocaleString()}\`\n*${item.description}*\n`
            ).join('\n');

            // Limitar la longitud de la descripción del embed si hay muchos ítems
            if (itemsListContent.length > 3900) { // Un poco menos de 4096 para ser seguro
                itemsListContent = itemsListContent.substring(0, 3900) + '\n... (más artículos)';
            }
        } else {
            itemsListContent = 'No se encontraron artículos en esta categoría.';
        }

        const categoryEmbed = createCaborcaEmbed({
            title: `🛍️ Artículos de la Categoría: ${displayCategoryName}`,
            description: itemsListContent,
            color: '#FFD700'
        });

        categoryEmbed.setFooter({ text: `Usa /comprar <ID_ARTICULO> | Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        categoryEmbed.setTimestamp();

        await interaction.editReply({
            embeds: [categoryEmbed],
            components: interaction.message.components
        });
    }
};