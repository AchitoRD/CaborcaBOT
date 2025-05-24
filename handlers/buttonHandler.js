// handlers/buttonHandler.js
const { MessageFlags, EmbedBuilder } = require('discord.js');
const Verification = require('../models/Verification');
const { createCaborcaEmbed } = require('../utils/embedBuilder');

module.exports = async (interaction, client, getConfig) => {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const action = parts[0] + '_' + parts[1];
    const userId = parts[2];
    const robloxName = parts.length > 3 ? parts.slice(3).join('_') : 'N/A';

    await interaction.deferUpdate();

    try {
        const member = await interaction.guild.members.fetch(userId).catch(error => {
            console.error(`Error al intentar obtener miembro ${userId}:`, error);
            return null;
        });

        if (!member) {
            const notFoundEmbed = createCaborcaEmbed({
                title: '⚠️ Usuario No Encontrado',
                description: `No se pudo encontrar al usuario con ID \`${userId}\` en el servidor. Es posible que haya abandonado o no se pudo cargar su información.`,
                color: '#FFA500'
            });
            await interaction.editReply({ embeds: [notFoundEmbed], components: [] });
            return;
        }

        const verificationEntry = await Verification.findOne({ where: { discordId: userId, status: 'pending' } });

        if (!verificationEntry) {
            const noPendingEmbed = createCaborcaEmbed({
                title: 'ℹ️ Solicitud No Encontrada',
                description: 'No se encontró una solicitud de verificación pendiente para este usuario.',
                color: '#0099FF'
            });
            await interaction.editReply({ embeds: [noPendingEmbed], components: [] });
            return;
        }

        const unverifiedRoleId = await getConfig('unverifiedRole');
        const citizenRoleId = await getConfig('citizenRole');

        if (!citizenRoleId) {
            const noConfigEmbed = createCaborcaEmbed({
                title: '❌ Configuración Faltante',
                description: 'Error: El rol de "Ciudadano" no está configurado. Contacta a un administrador para que lo establezca.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [noConfigEmbed], components: [] });
            return;
        }

        let verificationEmbed;
        if (interaction.message.embeds && interaction.message.embeds.length > 0) {
            verificationEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
        } else {
            verificationEmbed = new EmbedBuilder();
        }

        if (action === 'verify_approve') {
            // --- NUEVO: Cambiar Nickname ---
            try {
                if (member.nickname !== robloxName) { // Evita cambiar si ya tiene el nombre
                    await member.setNickname(robloxName, 'Verificación de Roblox aprobada');
                }
            } catch (nickError) {
                console.error(`Error al cambiar el nickname de ${member.user.tag} a ${robloxName}:`, nickError);
                // NOTA: No hacemos return aquí, ya que el rol y la verificación deben continuar.
                // Podrías enviar un mensaje de seguimiento al staff sobre el error del nickname.
                const nicknameErrorLog = `⚠️ Advertencia: No se pudo cambiar el nickname de ${member.user.tag} a \`${robloxName}\`. Asegúrate de que el bot tenga el permiso 'Gestionar apodos' y que su rol sea más alto que el del usuario y que no esté intentando cambiar el apodo de un administrador.`;
                console.warn(nicknameErrorLog);
                // Opcional: Podrías enviar este log al canal de logs si es crítico
                // await logsChannel.send(nicknameErrorLog); // Asegúrate de tener logsChannel disponible
            }

            if (!member.roles.cache.has(citizenRoleId)) {
                await member.roles.add(citizenRoleId).catch(error => {
                    console.error(`Error al añadir rol a ${member.user.tag}:`, error);
                    const roleErrorEmbed = createCaborcaEmbed({
                        title: '❌ Error de Rol',
                        description: `No se pudo asignar el rol <@&${citizenRoleId}> a ${member.user.tag}. Asegúrate de que el bot tenga permisos para gestionar roles y que su rol sea más alto que el del rol de Ciudadano.`,
                        color: '#FF0000'
                    });
                    interaction.editReply({ embeds: [roleErrorEmbed], components: [] });
                    return;
                });
                if (unverifiedRoleId && member.roles.cache.has(unverifiedRoleId)) {
                    await member.roles.remove(unverifiedRoleId).catch(error => {
                        console.warn(`Advertencia: No se pudo quitar el rol No Verificado a ${member.user.tag}:`, error);
                    });
                }
            }
            verificationEntry.status = 'approved';
            await verificationEntry.save();

            verificationEmbed
                .setColor(0x2ECC71) // Verde
                .setTitle('✅ Solicitud Aprobada')
                .setDescription(`La solicitud de **${robloxName}** ha sido **APROBADA**.`);
            verificationEmbed.setFields([
                { name: 'Usuario Discord', value: `<@${userId}>`, inline: true },
                { name: 'Nombre Roblox', value: `\`${robloxName}\``, inline: true },
                { name: 'Aprobado por', value: `<@${interaction.user.id}>`, inline: true }
            ]);

            await interaction.message.edit({
                embeds: [verificationEmbed],
                components: []
            });

            try {
                await member.send(`✅ ¡Felicidades! Tu cuenta de Roblox (\`${robloxName}\`) ha sido verificada en **${interaction.guild.name}**.`);
            } catch (dmError) {
                console.warn(`No se pudo enviar DM a ${member.user.tag} sobre la verificación aprobada.`);
            }

        } else if (action === 'verify_reject') {
            verificationEntry.status = 'rejected';
            await verificationEntry.save();

            verificationEmbed
                .setColor(0xFF0000) // Rojo
                .setTitle('❌ Solicitud Rechazada')
                .setDescription(`La solicitud de **${robloxName}** ha sido **RECHAZADA**.`);
            verificationEmbed.setFields([
                { name: 'Usuario Discord', value: `<@${userId}>`, inline: true },
                { name: 'Nombre Roblox', value: `\`${robloxName}\``, inline: true },
                { name: 'Rechazado por', value: `<@${interaction.user.id}>`, inline: true }
            ]);

            await interaction.message.edit({
                embeds: [verificationEmbed],
                components: []
            });

            try {
                await member.send(`❌ Tu solicitud de verificación de Roblox (\`${robloxName}\`) en **${interaction.guild.name}** ha sido rechazada. Por favor, revisa que la información o la imagen sean correctas y envía una nueva solicitud si lo deseas.`);
            } catch (dmError) {
                console.warn(`No se pudo enviar DM a ${member.user.tag} sobre el rechazo de verificación.`);
            }
        }
    } catch (error) {
        console.error('Error en buttonHandler al procesar verificación:', error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: '❌ Ocurrió un error al procesar esta solicitud de verificación. Revisa la consola para más detalles.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: '❌ Ocurrió un error al procesar esta solicitud de verificación. Revisa la consola para más detalles.', flags: MessageFlags.Ephemeral });
        }
    }
};