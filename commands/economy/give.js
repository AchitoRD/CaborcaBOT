const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// CAMBIO CLAVE: Importa UserEconomy directamente desde economyDatabase.js
const { UserEconomy } = require('../../database/economyDatabase'); 
const { getConfig } = require('../../utils/configManager'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Da Caborca Bucks a un usuario. (Solo para Staff) 💸')
        .addUserOption(option =>
            option.setName('receptor')
                .setDescription('El usuario que recibirá el dinero')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('La cantidad de Caborca Bucks a dar')
                .setRequired(true)
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), 
    async execute(interaction) {
        const giveCommandRoles = await getConfig('giveRoles');

        let hasPermission = false;
        // Si hay roles específicos configurados, verifica que el miembro tenga alguno de ellos.
        if (giveCommandRoles && giveCommandRoles.length > 0) {
            hasPermission = giveCommandRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        } else {
            // Si no hay roles configurados, se basa en los permisos de Discord (ManageGuild en este caso).
            hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild); 
        }

        if (!hasPermission) {
            const embed = createCaborcaEmbed({
                title: '🚫 Permiso Denegado',
                description: 'No tienes el rol necesario para usar el comando `/give`. Este comando es solo para el staff autorizado. 👮‍♂️',
                color: '#FF0000'
            });
            return await interaction.editReply({ embeds: [embed] });
        }

        const receiverUser = interaction.options.getUser('receptor');
        const receiverId = receiverUser.id;
        const amount = interaction.options.getInteger('cantidad');

        try {
            const [receiverEconomy] = await UserEconomy.findOrCreate({
                where: { userId: receiverId },
                defaults: { balance: 500 }
            });

            receiverEconomy.balance += amount;
            await receiverEconomy.save();

            const successEmbed = createCaborcaEmbed({
                title: '💸 ¡Dinero Entregado!',
                description: `Has dado **$${amount} Caborca Bucks** a **${receiverUser.username}**!`,
                fields: [
                    { name: 'Operador', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Receptor', value: `<@${receiverId}>`, inline: true },
                    { name: 'Nuevo saldo del Receptor', value: `$${receiverEconomy.balance}`, inline: false },
                ],
                color: '#2ECC71'
            });
            await interaction.editReply({ embeds: [successEmbed] });

            const receiverEmbed = createCaborcaEmbed({
                title: '💰 ¡Dinero Recibido del Staff!',
                description: `El staff te ha dado **$${amount} Caborca Bucks**!`,
                fields: [
                    { name: 'Tu nuevo saldo', value: `$${receiverEconomy.balance}`, inline: true },
                    { name: 'Operador', value: `<@${interaction.user.id}>`, inline: true },
                ],
                color: '#00FF00'
            });
            try {
                await receiverUser.send({ embeds: [receiverEmbed] });
            } catch (e) {
                console.warn(`[Give] No pude enviar DM a ${receiverUser.username} sobre la entrega de dinero: ${e.message}`);
            }

        } catch (error) {
            console.error('Error al dar dinero:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Entregar Dinero',
                description: 'Hubo un problema al intentar entregar el dinero. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};