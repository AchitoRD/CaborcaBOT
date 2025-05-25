const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { embedColor, serverBannerUrl, serverOpenChannelId } = require('../../config');
// ELIMINADA: const { defer, reply, followUp } = require('../../utils/responseUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cerrar')
        .setDescription('Anuncia el cierre del servidor para roleplay y limpia un canal específico o el canal actual.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // NO LLAMES A defer() AQUÍ. index.js ya lo hizo automáticamente como efímero.

        const guild = interaction.guild;
        let targetChannel = interaction.channel; // Por defecto, el canal donde se ejecuta el comando

        // Si hay un serverOpenChannelId configurado en config.js, lo usamos; de lo contrario, usamos el canal actual
        if (serverOpenChannelId) {
            const configuredChannel = guild.channels.cache.get(serverOpenChannelId);
            if (configuredChannel && configuredChannel.isTextBased()) {
                targetChannel = configuredChannel;
            } else {
                console.warn(`[CERRAR] serverOpenChannelId (${serverOpenChannelId}) configurado no es un canal de texto válido. Usando el canal actual para el comando /cerrar.`);
                // Usamos interaction.followUp para dar el aviso, ya que la deferencia inicial es para el comando.
                await interaction.followUp({
                    content: '⚠️ El ID de canal configurado (`serverOpenChannelId`) no es válido. El comando se ejecutará en este canal.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (!targetChannel || !targetChannel.isTextBased()) {
            // Usamos interaction.editReply para la primera respuesta del comando
            return await interaction.editReply({
                content: '❌ **Error:** Este comando solo se puede ejecutar en un canal de texto válido para enviar y limpiar mensajes.',
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('👋 ¡SERVIDOR CERRADO! 👋')
            .setDescription('El servidor ha cerrado. Muchas gracias por rolear en Caborca Roleplay. ¡Esperamos verte pronto de nuevo!')
            .setImage(serverBannerUrl)
            .setFooter({ text: '¡Hasta la próxima!', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        let sentMessage;
        try {
            // Envía el mensaje de cierre en el canal objetivo
            sentMessage = await targetChannel.send({ embeds: [embed] });
        } catch (sendError) {
            console.error(`Error al enviar el mensaje de cierre en el canal ${targetChannel.id}:`, sendError);
            // Usamos interaction.editReply o followUp para los errores
            return await interaction.editReply({
                content: '❌ Hubo un error al enviar el mensaje de cierre al canal. Verifica los permisos del bot en ese canal.',
                flags: MessageFlags.Ephemeral
            });
        }

        let cleanedMessagesCount = 0;
        let failedToCleanOldMessages = false;

        try {
            let fetched;
            do {
                fetched = await targetChannel.messages.fetch({ limit: 100 });
                const messagesToProcess = fetched.filter(msg => msg.id !== sentMessage.id);

                const fourteenDaysAgo = Date.now() - 1209599000; 
                
                const deletableMessages = messagesToProcess.filter(msg => 
                    msg.createdTimestamp > fourteenDaysAgo
                );
                
                const oldMessages = messagesToProcess.filter(msg => 
                    msg.createdTimestamp <= fourteenDaysAgo
                );

                if (deletableMessages.size > 0) {
                    const deleted = await targetChannel.bulkDelete(deletableMessages, true);
                    cleanedMessagesCount += deleted.size;
                }
                
                if (oldMessages.size > 0) {
                    failedToCleanOldMessages = true;
                    console.warn(`[CERRAR] Se encontraron ${oldMessages.size} mensajes de más de 14 días en el canal ${targetChannel.id} que no pudieron ser borrados masivamente.`);
                }

            } while (fetched.size > (1 + (failedToCleanOldMessages ? oldMessages.size : 0)));

            let successMessage = `✅ El servidor ha sido cerrado y **${cleanedMessagesCount}** mensajes recientes han sido limpiados en <#${targetChannel.id}>.`;
            if (failedToCleanOldMessages) {
                successMessage += '\n⚠️ **Nota:** Algunos mensajes antiguos (más de 14 días) no pudieron ser eliminados masivamente. Por favor, bórralos manualmente si es necesario.';
            }

            // Usamos interaction.editReply para la respuesta final del comando.
            await interaction.editReply({
                content: successMessage,
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('Error general al limpiar mensajes en /cerrar:', error);
            
            let errorMessage = '✅ El servidor ha sido cerrado, pero hubo un error al limpiar los mensajes. ';
            if (error.code === 10008 || error.code === 50034) {
                errorMessage += 'Esto pudo deberse a un problema con los mensajes (ej. ya borrados, o muy antiguos). Por favor, revisa el canal manualmente.';
            } else {
                errorMessage += 'Revisa la consola del bot para más detalles sobre este error inesperado.';
            }

            // Usamos interaction.editReply si es la primera vez que se responde, o followUp si ya se respondió.
            // Para simplificar, y dado que index.js ya maneja el estado, podemos lanzar el error
            // o intentar un editReply si la deferencia lo permite. Aquí usamos editReply como default.
            await interaction.editReply({ content: errorMessage, flags: MessageFlags.Ephemeral });
        }
    }
};