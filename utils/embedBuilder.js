// utils/embedBuilder.js
const { EmbedBuilder } = require('discord.js');
const { botLogoUrl, serverBannerUrl, embedColor } = require('../config');

// Función para crear un embed básico con la configuración de Caborca Bot
const createCaborcaEmbed = (options = {}) => {
    const embed = new EmbedBuilder()
        .setColor(options.color || embedColor) // Usa el color del config o uno específico
        .setThumbnail(botLogoUrl) // Siempre incluye el logo del bot
        .setTimestamp(); // Añade marca de tiempo

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.author) embed.setAuthor(options.author);
    if (options.fields) embed.addFields(options.fields);
    if (options.imageUrl) embed.setImage(options.imageUrl); // Para imágenes grandes como el banner
    if (options.footer) embed.setFooter(options.footer);

    return embed;
};

module.exports = { createCaborcaEmbed };