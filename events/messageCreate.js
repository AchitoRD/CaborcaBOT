// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../utils/embedBuilder');
const { embedColor } = require('../config');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Ignorar mensajes de bots para evitar bucles infinitos
        if (message.author.bot) return;

        // --- Aquí puedes añadir OTRAS lógicas para los mensajes si las necesitas ---
        // Por ejemplo:
        // - Moderación de palabras
        // - Auto-respuestas simples
        // - Registro de mensajes en un canal de logs (si tu bot no lo hace ya con otros eventos)

        // De momento, este archivo no hará nada si no tienes otras lógicas aquí.
    }
};