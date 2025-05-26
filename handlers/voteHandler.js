const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { createCaborcaEmbed } = require('../utils/embedBuilder'); // Ajusta la ruta si es necesario

// Se redefinen las constantes para que voteHandler no dependa de config.js para su lógica interna.
const MIN_VOTES_TO_OPEN = 15; 
const OPEN_SERVER_DURATION_MINUTES = 15; 

module.exports = {
    async handleVoteButton(interaction, client) {
        // Deferir la actualización del botón de forma efímera para evitar "La interacción falló".
        await interaction.deferUpdate({ ephemeral: true });

        const { customId } = interaction;
        // Obtiene los datos de la votación activa usando el ID del mensaje donde se presionó el botón.
        const pollData = client.activePolls.get(interaction.message.id);

        // Verifica si la votación existe y está activa.
        if (!pollData || !pollData.isActive) {
            return await interaction.followUp({ content: '❌ Esta votación ya no está activa.', ephemeral: true });
        }

        // --- Lógica de Votación (Voto Único con Anulación/Cambio) ---
        const userId = interaction.user.id;
        const userCurrentVote = pollData.voters.get(userId); // Obtener el voto actual del usuario

        if (customId === 'open_vote_yes') {
            if (userCurrentVote === 'yes') {
                return await interaction.followUp({ content: 'ℹ️ Ya has votado SÍ en esta votación.', ephemeral: true });
            }
            // Si el usuario había votado 'no' previamente, el voto SÍ lo anula y lo suma.
            if (userCurrentVote === 'no') {
                // No hay contador de noVotes, así que solo actualizamos el voto a 'yes' y sumamos.
                // Si hubiera un contador de noVotes, se restaría aquí.
            } else {
                pollData.votes++; // Sumar voto SÍ si no había votado antes.
            }
            pollData.voters.set(userId, 'yes'); // Registrar el voto como 'yes'
            await interaction.followUp({ content: `✅ ¡Voto SÍ registrado! Votos actuales: ${pollData.votes}/${pollData.requiredVotes}`, ephemeral: true });

        } else if (customId === 'open_vote_no') {
            if (userCurrentVote === 'no') {
                return await interaction.followUp({ content: 'ℹ️ Ya has anulado tu voto (presionando NO) en esta votación.', ephemeral: true });
            }
            // Si el usuario había votado SÍ, anular su voto.
            if (userCurrentVote === 'yes') {
                pollData.votes--; // Restar voto SÍ
            }
            pollData.voters.set(userId, 'no'); // Registrar que anuló su voto o votó 'no'
            await interaction.followUp({ content: `❌ ¡Voto anulado! Votos actuales: ${pollData.votes}/${pollData.requiredVotes}`, ephemeral: true });
        }

        // --- Actualización del Embed de Votación ---
        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed);

        // Actualizar el campo de votos (índice 1)
        if (originalEmbed.fields && originalEmbed.fields.length > 1) {
            updatedEmbed.spliceFields(1, 1, { // spliceFields(índice, cuántos eliminar, nuevoCampo)
                name: '✅ Votos Actuales', 
                value: `${pollData.votes}/${pollData.requiredVotes}`, 
                inline: true 
            });
        } else {
            // Esto debería no pasar si el embed inicial se crea correctamente.
            updatedEmbed.addFields({ name: '✅ Votos Actuales', value: `${pollData.votes}/${pollData.requiredVotes}`, inline: true });
        }

        // --- Lógica de Apertura del Servidor al Alcanzar los Votos ---
        if (pollData.votes >= pollData.requiredVotes) {
            pollData.isActive = false; // Desactiva la votación.
            updatedEmbed.setTitle('✅ ¡Servidor ABIERTO por Votación!'); // Nuevo título.
            updatedEmbed.setDescription(`El administrador ${pollData.adminUser} inició una votación para abrir el servidor, ¡y se han alcanzado los votos necesarios!`);
            
            // Actualizar el campo de estado (índice 2)
            if (originalEmbed.fields && originalEmbed.fields.length > 2) {
                 updatedEmbed.spliceFields(2, 1, { 
                    name: 'Estado', 
                    value: 'Abierto', 
                    inline: true 
                });
            } else {
                // Esto debería no pasar si el embed inicial se crea correctamente.
                updatedEmbed.addFields({ name: 'Estado', value: 'Abierto', inline: true });
            }

            updatedEmbed.setColor(0x2ECC71); // Cambia el color del embed a verde.
            updatedEmbed.addFields({
                name: '📢 ¡Advertencia Importante!',
                value: `Tienes **${OPEN_SERVER_DURATION_MINUTES} minutos** para entrar al servidor con el código \`CABORPLAY\` o podrías ser sancionado por un administrador.`,
                inline: false
            });

            // Deshabilita los botones de votación una vez que el servidor está abierto.
            const disabledButtons = interaction.message.components[0].components.map(btn => 
                ButtonBuilder.from(btn).setDisabled(true)
            );
            const row = new ActionRowBuilder().addComponents(disabledButtons);

            // Edita el mensaje original de votación con el nuevo embed y los botones deshabilitados.
            await interaction.editReply({ embeds: [updatedEmbed], components: [row] });

            // --- Temporizador para Aviso de Sanción ---
            pollData.openServerTimer = setTimeout(async () => {
                const followUpEmbed = createCaborcaEmbed({
                    title: '🚨 ¡Advertencia de Sanción por Inactividad!',
                    description: `Ha transcurrido el tiempo límite de **${OPEN_SERVER_DURATION_MINUTES} minutos** desde la apertura del servidor.
                    \nLos usuarios que aún no hayan entrado al servidor con el código \`CABORPLAY\` son susceptibles de ser sancionados por un administrador.`,
                    color: '#FF0000', // Color rojo para la advertencia.
                    footer: { text: 'Un administrador revisará la actividad.' },
                    timestamp: true
                });
                // Envía el aviso de sanción al canal donde se inició la votación.
                try {
                    const originalChannel = client.channels.cache.get(pollData.channelId); 
                    if (originalChannel) {
                        await originalChannel.send({ embeds: [followUpEmbed] });
                    }
                } catch (e) {
                    console.error('Error enviando aviso de sanción:', e);
                }
                // Elimina la votación de la lista activa una vez que el temporizador finaliza.
                client.activePolls.delete(interaction.message.id); 
            }, OPEN_SERVER_DURATION_MINUTES * 60 * 1000); // Convierte minutos a milisegundos.

        } else {
            // Si los votos aún no son suficientes, solo actualiza el conteo en el mensaje.
            const row = ActionRowBuilder.from(interaction.message.components[0]); // Mantiene los botones habilitados.
            await interaction.editReply({ embeds: [updatedEmbed], components: [row] });
        }
    },
};