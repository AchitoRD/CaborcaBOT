const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { serverBannerUrl, embedColor } = require('../../config'); // Importa serverBannerUrl y embedColor

const MIN_VOTES_TO_OPEN = 15; // Número de votos requeridos para abrir el servidor
const OPEN_SERVER_DURATION_MINUTES = 15; // Minutos que tienen los usuarios para entrar después de la apertura

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abrir')
        .setDescription('Inicia una votación para abrir el servidor.')
        // El permiso de administrador ya se verifica en index.js
        ,
    async execute(interaction) {
        // CORRECCIÓN CLAVE: Deferir PÚBLICAMENTE para que todos vean la votación.
        // index.js no diferirá este comando, así que /abrir lo hace directamente.
        await interaction.deferReply({ ephemeral: false }); 
        
        // Verifica si ya hay una votación activa globalmente en el bot
        if (interaction.client.activePolls.size > 0) {
            // Si ya hay una, informa al administrador efímeramente.
            return await interaction.editReply({ // editReply porque ya diferimos
                content: '❌ Ya hay una votación activa en curso. ¡Espera a que termine o ciérrala!',
                ephemeral: true 
            });
        }

        // Construye el embed inicial para la votación de apertura del servidor.
        const pollEmbed = createCaborcaEmbed({
            title: '🗳️ ¡Votación Iniciada para Abrir el Servidor!',
            description: `El administrador ${interaction.user.tag} ha iniciado una votación para abrir el servidor.`,
            color: embedColor, // Usa el color del config.js
            imageUrl: serverBannerUrl, // Usa el banner del config.js
            fields: [
                { name: '🌐 Código del Servidor', value: '```CABORPLAY```', inline: false },
                { name: '✅ Votos Actuales', value: `0/${MIN_VOTES_TO_OPEN}`, inline: true },
                { name: 'Estado', value: 'En votación...', inline: true }
            ],
            footer: { text: '¡Vota para abrir el servidor!' },
            timestamp: true
        });

        // Crea los botones para la votación (SÍ y NO).
        const voteButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_vote_yes') // ID personalizado para el botón "Votar SÍ"
                    .setLabel('Votar SÍ')
                    .setStyle(ButtonStyle.Success) // Estilo de botón verde
                    .setEmoji('✅'), // Emoji Unicode para "sí"
                new ButtonBuilder()
                .setCustomId('open_vote_no') // ID personalizado para el botón "Votar NO"
                .setLabel('Votar NO')
                .setStyle(ButtonStyle.Danger) // Estilo de botón rojo
                .setEmoji('❌'), // Emoji Unicode para "no"
            );

        // Envía el mensaje de votación al canal donde se ejecutó el comando.
        // fetchReply: true es necesario para obtener el message.id del mensaje enviado.
        const sentMessage = await interaction.editReply({ // editReply porque ya diferimos públicamente
            embeds: [pollEmbed],
            components: [voteButtons],
            fetchReply: true 
        });

        // Almacena la información de la votación activa en client.activePolls.
        // Esto permite que el manejador de botones acceda a los datos de la votación.
        interaction.client.activePolls.set(sentMessage.id, {
            votes: 0,
            requiredVotes: MIN_VOTES_TO_OPEN,
            voters: new Map(), // CAMBIO: Usamos Map() para voto único con anulación
            isActive: true,
            statusMessageId: sentMessage.id, // ID del mensaje de la votación
            adminUser: interaction.user.tag, // Administrador que inició la votación
            adminId: interaction.user.id,
            channelId: interaction.channelId, // ID del canal donde se inició la votación (para futuros avisos)
            openServerTimer: null // Para el temporizador de los 15 minutos después de la apertura
        });
    },
};