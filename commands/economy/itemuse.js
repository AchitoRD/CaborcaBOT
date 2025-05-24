// commands/economy/itemuse.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const UserEconomy = require('../../models/UserEconomy');
const { shop } = require('../../config');
const { getConfig } = require('../../utils/configManager'); // Importa getConfig

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemuse')
        .setDescription('Usa un artículo de tu inventario para activar su efecto. ✨')
        .addStringOption(option =>
            option.setName('articulo_id')
                .setDescription('El ID del artículo que deseas usar')
                .setRequired(true)),
    async execute(interaction) {
        // NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente.
        const userId = interaction.user.id;
        const member = interaction.member;
        const itemId = interaction.options.getString('articulo_id').toLowerCase();

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            if (!userEconomy.inventory.includes(itemId)) {
                const embed = createCaborcaEmbed({
                    title: '🚫 Artículo No Encontrado en tu Inventario',
                    description: `No tienes el artículo con ID \`${itemId}\` en tu inventario. Revisa con \`/inventario\`.`,
                    color: '#FFA500'
                });
                // CAMBIO CLAVE: Usar editReply()
                return await interaction.editReply({ embeds: [embed] });
            }

            const itemToUse = shop.items.find(item => item.id === itemId);

            if (!itemToUse) {
                const embed = createCaborcaEmbed({
                    title: '❌ Error de Artículo',
                    description: `El artículo con ID \`${itemId}\` no se pudo encontrar en la tienda. Contacta al staff.`,
                    color: '#FF0000'
                });
                // CAMBIO CLAVE: Usar editReply()
                return await interaction.editReply({ embeds: [embed] });
            }

            // Verificar si el usuario tiene un rol que le permita usar items (desde la DB)
            const useItemAllowedRoles = await getConfig('useItemAllowedRoles');
            const canUseItem = useItemAllowedRoles.some(roleId => member.roles.cache.has(roleId));
            if (useItemAllowedRoles.length > 0 && !canUseItem) {
                 const embed = createCaborcaEmbed({
                    title: '🚫 Permiso Denegado',
                    description: `No tienes el rol necesario para usar este tipo de artículo. Solo roles específicos pueden activar ítems.`,
                    color: '#FFA500'
                });
                // CAMBIO CLAVE: Usar editReply()
                return await interaction.editReply({ embeds: [embed] });
            }

            let useMessage = `Has usado **${itemToUse.name}**. `;
            let responseColor = '#2ECC71';

            if (itemToUse.roleId) {
                try {
                    const role = await interaction.guild.roles.fetch(itemToUse.roleId);
                    if (role) {
                        if (member.roles.cache.has(role.id)) {
                             useMessage += `Ya posees el rol "${role.name}".`;
                             responseColor = '#FFA500';
                        } else {
                            await member.roles.add(role, `Uso de item: ${itemToUse.name}`);
                            useMessage += `¡Has obtenido el rol **${role.name}**! 🎉`;
                            console.log(`[Item Use] Rol "${role.name}" asignado a ${member.user.tag} por usar ${itemToUse.name}.`);
                        }
                    } else {
                        useMessage += `El rol asociado a este item no fue encontrado.`;
                        responseColor = '#FFA500';
                    }
                } catch (roleError) {
                    console.error(`[Item Use] Error al asignar rol para item ${itemToUse.id}:`, roleError);
                    useMessage += `Hubo un error al intentar asignarte el rol.`;
                    responseColor = '#FF0000';
                }
            } else {
                useMessage += `Este artículo no tiene un efecto de rol directo.`;
            }

            const embed = createCaborcaEmbed({
                title: '✨ Artículo Usado',
                description: useMessage,
                footer: { text: `Gracias por usar el artículo de Caborca RP.` },
                color: responseColor
            });
            // CAMBIO CLAVE: Usar editReply()
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al usar artículo:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Usar Artículo',
                description: 'Hubo un problema al intentar usar el artículo. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // CAMBIO CLAVE: Usar editReply()
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};