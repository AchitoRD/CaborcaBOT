// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const ServerVote = require('../models/ServerVote'); // ¡RUTA CORREGIDA AQUÍ!
const { createCaborcaEmbed } = require('../utils/embedBuilder');
const { embedColor } = require('../config');

module.exports = {
    name: Events.MessageCreate, // El nombre del evento que este archivo manejará
    async execute(message, client) { // Asegúrate de que 'client' se reciba aquí como argumento
        // Ignorar mensajes de bots para evitar bucles infinitos
        if (message.author.bot) return;

        // Buscar una votación activa en este canal
        const activeVote = await ServerVote.findOne({
            where: {
                channelId: message.channel.id,
                status: 'open'
            }
        });

        if (activeVote) {
            // Si el mensaje contiene el código de votación
            if (message.content.toUpperCase() === activeVote.voteCode.toUpperCase()) {
                const codeVoters = activeVote.codeVoters; // Ya es un array gracias al getter del modelo

                if (codeVoters.includes(message.author.id)) {
                    // Usuario ya votó con el código
                    await message.delete().catch(() => console.error('Error al borrar mensaje de voto duplicado:', message.id));
                    const userAlreadyVotedEmbed = createCaborcaEmbed({
                        description: '⚠️ Ya votaste en esta apertura.',
                        color: '#FFA500' // Naranja
                    });
                    // Intenta enviar DM, si falla, ignora (el usuario puede tener DMs cerrados)
                    return await message.author.send({ embeds: [userAlreadyVotedEmbed] }).catch(() => {});
                }

                // Añadir usuario a la lista de votantes por código
                codeVoters.push(message.author.id);
                activeVote.codeVoters = codeVoters; // El setter JSON.stringify lo maneja
                activeVote.yesVotes = activeVote.codeVoters.length; // Actualiza el conteo de votos

                await activeVote.save(); // Guarda el voto

                // Borra el mensaje del usuario con el código
                await message.delete().catch(() => console.error('Error al borrar mensaje de voto:', message.id));

                // Actualizar el mensaje de votación en Discord
                try {
                    // message.client es la forma correcta de acceder al cliente desde el evento
                    const voteChannel = await message.client.channels.fetch(activeVote.channelId);
                    const voteMessage = await voteChannel.messages.fetch(activeVote.messageId);

                    const currentEmbed = EmbedBuilder.from(voteMessage.embeds[0]);
                    currentEmbed.setFields(
                        { name: 'Código Secreto', value: `\`${activeVote.voteCode}\``, inline: true },
                        { name: 'Votos Necesarios', value: `\`${activeVote.targetVotes}\``, inline: true },
                        { name: 'Votos Actuales', value: `\`${activeVote.yesVotes} / ${activeVote.targetVotes}\``, inline: true },
                    );

                    await voteMessage.edit({ embeds: [currentEmbed] });

                    // Verificar si se alcanzó el objetivo de votos
                    if (activeVote.yesVotes >= activeVote.targetVotes) {
                        activeVote.status = 'passed'; // Marca la votación como pasada
                        await activeVote.save();

                        const successEmbed = EmbedBuilder.from(currentEmbed)
                            .setColor(0x2ECC71) // Verde
                            .setTitle('🎉 ¡Servidor ABIERTO! 🎉')
                            .setDescription(`¡Felicidades! Se han alcanzado los ${activeVote.targetVotes} votos necesarios con el código secreto. El servidor (modo RP) está ahora abierto.`)
                            .setFields(
                                { name: 'Resultado', value: 'Votación Exitosa', inline: true },
                                { name: 'Estado Actual', value: 'ABIERTO', inline: true }
                            )
                            .setFooter({ text: '¡A disfrutar del desierto de Caborca!' });

                        await voteMessage.edit({ embeds: [successEmbed], components: [] }); // Elimina los botones del mensaje de votación
                        await message.channel.send('¡El servidor ha sido abierto! Bienvenidos al RP.🌵');
                    }

                } catch (error) {
                    console.error('Error al actualizar mensaje de votación o al abrir el servidor:', error);
                }
            }
        }
    }
};