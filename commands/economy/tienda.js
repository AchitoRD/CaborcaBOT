// commands/economy/tienda.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { shop, serverBannerUrl } = require('../../config'); // Importa la config de la tienda

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tienda')
        .setDescription('Explora los artículos disponibles en la tienda de Caborca. 🏪'),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.

        // Mensaje de bienvenida a la tienda
        const welcomeEmbed = createCaborcaEmbed({
            title: '🏪 ¡Bienvenido a la Tienda Central de Caborca RP! 🌵',
            description: 'Explora nuestra amplia selección de artículos para tu vida en el desierto. \n\n**Selecciona una categoría en el menú desplegable para ver los productos:**',
            imageUrl: serverBannerUrl,
            footer: { text: '¡Compra con sabiduría!' },
        });

        // Obtener categorías únicas de los items de la tienda
        // Filtra para asegurar que solo haya categorías si hay ítems con esa categoría
        const categories = [...new Set(shop.items.map(item => item.category))].filter(Boolean); // .filter(Boolean) para quitar null/undefined

        // Crear opciones para el menú desplegable
        const selectOptions = categories.map(category =>
            new StringSelectMenuOptionBuilder()
                .setLabel(category)
                .setValue(category)
        );

        // Si no hay categorías, no creamos el menú desplegable para evitar errores
        let row = null;
        if (selectOptions.length > 0) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('shop_category_select') // ID único para este menú
                .setPlaceholder('Selecciona una categoría...')
                .addOptions(selectOptions);

            row = new ActionRowBuilder()
                .addComponents(selectMenu);
        } else {
            welcomeEmbed.setDescription('No hay artículos disponibles en la tienda en este momento.');
        }


        // CAMBIO CLAVE: Usar editReply() en lugar de reply().
        // La propiedad 'ephemeral' ya fue establecida por commandHandler.js en la deferencia inicial.
        await interaction.editReply({
            embeds: [welcomeEmbed],
            components: row ? [row] : [], // Solo añade componentes si hay opciones
        });
    },
};