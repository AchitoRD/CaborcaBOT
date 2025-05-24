// commands/economy/pay.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Transfiere Caborca Bucks a otro usuario. 💸')
        .addUserOption(option =>
            option.setName('receptor')
                .setDescription('El usuario que recibirá el dinero')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('La cantidad de Caborca Bucks a transferir')
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const senderId = interaction.user.id;
        const receiverUser = interaction.options.getUser('receptor');
        const receiverId = receiverUser.id;
        const amount = interaction.options.getInteger('cantidad');

        if (senderId === receiverId) {
            const embed = createCaborcaEmbed({
                title: '🚫 No puedes pagarte a ti mismo',
                description: '¡No tiene sentido pagarte a ti mismo! Usa tus Caborca Bucks sabiamente. 😅',
                color: '#FFA500'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            // Obtener o crear al remitente
            const [senderEconomy] = await UserEconomy.findOrCreate({
                where: { userId: senderId },
                defaults: { balance: 500 }
            });

            if (senderEconomy.balance < amount) {
                const embed = createCaborcaEmbed({
                    title: '💸 Fondos Insuficientes',
                    description: `No tienes suficientes Caborca Bucks. Solo tienes $${senderEconomy.balance}.`,
                    color: '#FF0000'
                });
                // CAMBIO CLAVE: Usar editReply() en lugar de reply().
                return await interaction.editReply({ embeds: [embed] });
            }

            // Obtener o crear al receptor
            const [receiverEconomy] = await UserEconomy.findOrCreate({
                where: { userId: receiverId },
                defaults: { balance: 500 }
            });

            // Realizar la transacción
            senderEconomy.balance -= amount;
            receiverEconomy.balance += amount;

            await senderEconomy.save();
            await receiverEconomy.save();

            const successEmbed = createCaborcaEmbed({
                title: '💸 ¡Transacción Exitosa!',
                description: `Has transferido **$${amount} Caborca Bucks** a **${receiverUser.username}**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${senderEconomy.balance}`, inline: true },
                    { name: 'Receptor', value: `<@${receiverId}>`, inline: true },
                ],
                color: '#2ECC71'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            // Esta será la respuesta visible en el canal.
            await interaction.editReply({ embeds: [successEmbed] });

            // Notificar al receptor en privado
            const receiverEmbed = createCaborcaEmbed({
                title: '💰 ¡Dinero Recibido!',
                description: `**${interaction.user.username}** te ha enviado **$${amount} Caborca Bucks**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${receiverEconomy.balance}`, inline: true },
                    { name: 'Remitente', value: `<@${senderId}>`, inline: true },
                ],
                color: '#00FF00'
            });
            try {
                // Para enviar un DM, se usa .send() y no se relaciona con la interacción del canal.
                await receiverUser.send({ embeds: [receiverEmbed] });
            } catch (e) {
                console.warn(`[Pay] No pude enviar DM a ${receiverUser.username} sobre la transferencia.`);
            }

        } catch (error) {
            console.error('Error al transferir dinero:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Transferir Dinero',
                description: 'Hubo un problema al intentar realizar la transferencia. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};