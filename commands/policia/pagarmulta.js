const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { Multa, UserEconomy } = require('../../database/economyDatabase');
// ELIMINADA: const { defer, reply, followUp } = require('../../utils/responseUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pagarmulta')
        .setDescription('Permite pagar una multa pendiente.'),

    async execute(interaction) {
        // NO LLAMES A defer() AQUÍ. index.js ya lo hizo automáticamente como efímero.

        const userId = interaction.user.id;

        const multasPendientes = await Multa.findAll({
            where: {
                userId: userId,
                pagada: false,
            },
            order: [['createdAt', 'ASC']],
        });

        if (multasPendientes.length === 0) {
            // Usa editReply para la primera respuesta
            return await interaction.editReply({ content: 'No tienes multas pendientes para pagar.', flags: MessageFlags.Ephemeral });
        }

        const options = multasPendientes.map(multa => ({
            label: `Multa ID: ${multa.id} - $${multa.cantidad.toFixed(2)}`,
            description: `Impuesta por ${multa.policiaId} el ${multa.createdAt.toLocaleDateString('es-ES')}`,
            value: multa.id.toString(),
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('pagarmulta_select')
            .setPlaceholder('Selecciona una multa para pagar...')
            .addOptions(options);

        const actionRow = new ActionRowBuilder()
            .addComponents(selectMenu);

        // Usa editReply para la primera respuesta con el select menu
        await interaction.editReply({
            content: 'Por favor, selecciona la multa que deseas pagar:',
            components: [actionRow],
            flags: MessageFlags.Ephemeral
        });
    },

    async handleSelectMenu(interaction) {
        await interaction.deferUpdate(); // Esto sigue siendo necesario para los select menus

        const multaId = interaction.values[0];
        const multa = await Multa.findByPk(multaId);
        const userEconomy = await UserEconomy.findOne({ where: { userId: interaction.user.id } });

        if (!multa) {
            return await interaction.followUp({ content: 'La multa seleccionada no existe.', flags: MessageFlags.Ephemeral });
        }
        if (multa.pagada) {
            return await interaction.followUp({ content: 'Esta multa ya ha sido pagada.', flags: MessageFlags.Ephemeral });
        }
        if (!userEconomy || userEconomy.balance < multa.cantidad) {
            return await interaction.followUp({ content: `No tienes suficiente dinero para pagar esta multa. Necesitas $${multa.cantidad.toFixed(2)}.`, flags: MessageFlags.Ephemeral });
        }

        try {
            userEconomy.balance -= multa.cantidad;
            await userEconomy.save();

            multa.pagada = true;
            multa.fechaPago = new Date();
            await multa.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ Multa Pagada Exitosamente ✅')
                .setColor('Green')
                .addFields(
                    { name: 'ID de Multa', value: multa.id.toString(), inline: true },
                    { name: 'Monto Pagado', value: `$${multa.cantidad.toFixed(2)}`, inline: true },
                    { name: 'Razón', value: multa.razon || 'N/A', inline: true },
                    { name: 'Fecha de Pago', value: multa.fechaPago.toLocaleDateString('es-ES') },
                )
                .setTimestamp();

            // Usa followUp para la respuesta final al seleccionar una opción del menú
            await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error al pagar multa:', error);
            // Lanza el error para que index.js lo capture y maneje globalmente.
            throw error;
        }
    }
};