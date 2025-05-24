// commands/economy/give.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');
const { getConfig } = require('../../utils/configManager'); // Importa getConfig

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
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Requiere permiso de "Gestionar Servidor" por defecto
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.

        // Obtener roles permitidos desde la DB
        const giveCommandRoles = await getConfig('giveRoles');

        // Si 'giveRoles' está vacío en la configuración, solo se aplica el setDefaultMemberPermissions.
        // Si hay roles configurados, se verifica si el miembro tiene ALGUNO de esos roles.
        let hasPermission = false;
        if (giveCommandRoles && giveCommandRoles.length > 0) {
            hasPermission = giveCommandRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        } else {
            // Si no hay roles específicos configurados, se basa en los permisos de Discord del comando.
            // La línea .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) ya maneja esto.
            // Si quieres que solo roles configurados puedan usarlo, quita o ajusta setDefaultMemberPermissions
            // y siempre configura giveRoles.
            hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild); // Usar el permiso base del comando
        }


        if (!hasPermission) {
            const embed = createCaborcaEmbed({
                title: '🚫 Permiso Denegado',
                description: 'No tienes el rol necesario para usar el comando `/give`. Este comando es solo para el staff autorizado. 👮‍♂️',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
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
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            // Esta será la respuesta visible en el canal.
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
                // Para enviar un DM, se usa .send() y no se relaciona con la interacción del canal.
                await receiverUser.send({ embeds: [receiverEmbed] });
            } catch (e) {
                // Esta advertencia no necesita ser un editReply, es un log interno.
                console.warn(`[Give] No pude enviar DM a ${receiverUser.username} sobre la entrega de dinero: ${e.message}`);
            }

        } catch (error) {
            console.error('Error al dar dinero:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Entregar Dinero',
                description: 'Hubo un problema al intentar entregar el dinero. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply() en lugar de reply().
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};