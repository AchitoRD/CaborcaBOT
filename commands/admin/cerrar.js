const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { serverBannerUrl, embedColor } = require('../../config'); // Importa serverBannerUrl y embedColor

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cerrar')
        .setDescription('Cierra el servidor y finaliza cualquier votación de apertura activa.')
        // El permiso de administrador ya se verifica en index.js
        ,
    async execute(interaction) {
        // CORRECCIÓN CLAVE: Deferir PÚBLICAMENTE para que todos lo vean.
        // index.js ya no diferirá este comando, así que /cerrar lo hace.
        await interaction.deferReply({ ephemeral: false }); 

        const adminUser = interaction.user.tag;

        // Construye el embed de cierre del servidor.
        const closeEmbed = createCaborcaEmbed({
            title: '🔒 ¡Servidor Cerrado!',
            description: `El servidor ha sido cerrado por el administrador **${adminUser}**. 
            \nLas operaciones del servidor están pausadas hasta nueva apertura.`,
            color: '#FF0000', // Color rojo para indicar cierre
            imageUrl: serverBannerUrl, // Usa el banner del config.js
            footer: { text: '¡Mantente atento para la próxima apertura!' },
            timestamp: true
        });

        // Envía el mensaje de cierre como una respuesta EDITADA a la deferencia pública.
        await interaction.editReply({ embeds: [closeEmbed] });

        // --- Lógica para limpiar y deshabilitar votaciones activas ---
        if (interaction.client.activePolls.size > 0) {
            // Itera sobre todas las votaciones activas para limpiarlas.
            for (const [messageId, poll] of interaction.client.activePolls.entries()) {
                if (poll.openServerTimer) {
                    clearTimeout(poll.openServerTimer); // Detiene cualquier temporizador de 15 minutos activo.
                }
                
                // Intenta deshabilitar los botones del mensaje de votación original.
                try {
                    // Obtener el canal donde se inició la votación (puede ser diferente al actual si el comando se usó en otro canal).
                    const pollChannel = interaction.client.channels.cache.get(poll.channelId);
                    if (pollChannel) {
                        const pollMessage = await pollChannel.messages.fetch(messageId); // Busca el mensaje por su ID.
                        if (pollMessage && pollMessage.components.length > 0) {
                            // Mapea los botones existentes y los deshabilita.
                            const disabledButtons = pollMessage.components[0].components.map(btn => 
                                ButtonBuilder.from(btn).setDisabled(true) // Crea un nuevo botón deshabilitado a partir del existente.
                            );
                            const row = new ActionRowBuilder().addComponents(disabledButtons);
                            await pollMessage.edit({ components: [row] }); // Actualiza el mensaje con los botones deshabilitados.
                        }
                    }
                } catch (e) {
                    // Si el mensaje de votación no se encuentra o hay un error, lo loguea.
                    console.error(`Error al deshabilitar botones de votación (ID: ${messageId}) al cerrar:`, e);
                }
            }
            interaction.client.activePolls.clear(); // Limpia todas las votaciones de la lista activa.
            // Avisa al administrador que las votaciones activas fueron limpiadas (este sí puede ser efímero).
            await interaction.followUp({ content: '✅ Se finalizó y limpió cualquier votación de apertura activa.', ephemeral: true });
        }
    },
};