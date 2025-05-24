// commands/general/ping.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('¡Comprueba si Caborca Bot está despierto! 🏓'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pingeando...', fetchReply: true, ephemeral: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = createCaborcaEmbed({
            title: '🏓 ¡Caborca Bot Responde!',
            description: `**Latencia del Bot:** \`${latency}ms\`\n**Latencia de la API:** \`${Math.round(interaction.client.ws.ping)}ms\``,
            footer: { text: `Caborca Bot | Online en ${interaction.client.guilds.cache.size} servidores` },
            color: '#7289DA' 
        });

        await interaction.editReply({ content: ' ', embeds: [embed], ephemeral: true });
    },
};