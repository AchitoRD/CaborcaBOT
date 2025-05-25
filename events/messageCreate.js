// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../utils/embedBuilder');
const { embedColor } = require('../config');

// ¡IMPORTACIÓN CORREGIDA! Obtener ServerVote desde voteDatabase.js
const { ServerVote } = require('../database/voteDatabase'); 

module.exports = {
    name: Events.MessageCreate, // El nombre del evento que este archivo manejará
    async execute(message, client) { // Asegúrate de que 'client' se reciba aquí como argumento
        // Ignorar mensajes de bots para evitar bucles infinitos
        if (message.author.bot) return;

        // Buscar una votación activa en este canal (asumiendo que 'open' es el estado para esta votación)
        const activeVote = await ServerVote.findOne({
            where: {
                channelId: message.channel.id,
                status: 'open' // Asegúrate de que este estado coincida con lo que usas en el comando que inicia esta votación de código.
            }
        });

        if (activeVote) {
            // Asegúrate de que activeVote.voteCode exista en tu modelo o sea parte del proceso
            // Ya que ServerVote.js no tiene un campo 'voteCode', esto podría causar un error si no se define en otro lugar.
            // Si el mensaje contiene el código de votación (este 'activeVote.voteCode' debe venir de algún lugar, quizás ServerVote.options o algún otro campo personalizado si no está en el modelo)
            if (message.content.toUpperCase() === activeVote.voteCode.toUpperCase()) { // <--- POSIBLE PUNTO DE ERROR si 'voteCode' no está en ServerVote
                const codeVoters = activeVote.codeVoters; // Ya es un array gracias al getter del modelo (esto asume un getter o que es un JSONB)

                if (codeVoters.includes(message.author.id)) {
                    await message.delete().catch(() => console.error('Error al borrar mensaje de voto duplicado:', message.id));
                    const userAlreadyVotedEmbed = createCaborcaEmbed({
                        description: '⚠️ Ya votaste en esta apertura.',
                        color: '#FFA500' // Naranja
                    });
                    return await message.author.send({ embeds: [userAlreadyVotedEmbed] }).catch(() => {});
                }

                codeVoters.push(message.author.id);
                activeVote.codeVoters = codeVoters;
                activeVote.yesVotes = activeVote.codeVoters.length; // Actualiza el conteo de votos

                await activeVote.save();

                await message.delete().catch(() => console.error('Error al borrar mensaje de voto:', message.id));

                try {
                    const voteChannel = await client.channels.fetch(activeVote.channelId); // Usa 'client' pasado como argumento
                    const voteMessage = await voteChannel.messages.fetch(activeVote.messageId);

                    const currentEmbed = EmbedBuilder.from(voteMessage.embeds[0]);
                    currentEmbed.setFields(
                        { name: 'Código Secreto', value: `\`${activeVote.voteCode}\``, inline: true }, // <--- POSIBLE PUNTO DE ERROR
                        { name: 'Votos Necesarios', value: `\`${activeVote.targetVotes}\``, inline: true }, // <--- POSIBLE PUNTO DE ERROR
                        { name: 'Votos Actuales', value: `\`${activeVote.yesVotes} / ${activeVote.targetVotes}\``, inline: true }, // <--- POSIBLE PUNTO DE ERROR
                    );

                    await voteMessage.edit({ embeds: [currentEmbed] });

                    if (activeVote.yesVotes >= activeVote.targetVotes) {
                        activeVote.status = 'passed';
                        await activeVote.save();

                        const successEmbed = EmbedBuilder.from(currentEmbed)
                            .setColor(0x2ECC71)
                            .setTitle('🎉 ¡Servidor ABIERTO! 🎉')
                            .setDescription(`¡Felicidades! Se han alcanzado los ${activeVote.targetVotes} votos necesarios con el código secreto. El servidor (modo RP) está ahora abierto.`)
                            .setFields(
                                { name: 'Resultado', value: 'Votación Exitosa', inline: true },
                                { name: 'Estado Actual', value: 'ABIERTO', inline: true }
                            )
                            .setFooter({ text: '¡A disfrutar del desierto de Caborca!' });

                        await voteMessage.edit({ embeds: [successEmbed], components: [] });
                        await message.channel.send('¡El servidor ha sido abierto! Bienvenidos al RP.🌵');
                    }

                } catch (error) {
                    console.error('Error al actualizar mensaje de votación o al abrir el servidor (messageCreate):', error);
                }
            }
        }
    }
};