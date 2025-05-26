const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
// CAMBIO CLAVE: Importa UserEconomy directamente desde economyDatabase.js
const { UserEconomy } = require('../../database/economyDatabase'); 
const { shop } = require('../../config');
const { getConfig } = require('../../utils/configManager'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('itemuse')
        .setDescription('Usa un artículo de tu inventario para activar su efecto. ✨')
        .addStringOption(option =>
            option.setName('articulo_id')
                .setDescription('El ID del artículo que deseas usar')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const member = interaction.member;
        const itemId = interaction.options.getString('articulo_id').toLowerCase();

        try {
            const [userEconomy] = await UserEconomy.findOrCreate({
                where: { userId: userId },
                defaults: { balance: 500 }
            });

            // Asegúrate de que userEconomy.inventory sea un array antes de usar .includes
            if (!Array.isArray(userEconomy.inventory) || !userEconomy.inventory.includes(itemId)) {
                const embed = createCaborcaEmbed({
                    title: '🚫 Artículo No Encontrado en tu Inventario',
                    description: `No tienes el artículo con ID \`${itemId}\` en tu inventario. Revisa con \`/inventario\`.`,
                    color: '#FFA500'
                });
                return await interaction.editReply({ embeds: [embed] });
            }

            const itemToUse = shop.items.find(item => item.id === itemId);

            if (!itemToUse) {
                const embed = createCaborcaEmbed({
                    title: '❌ Error de Artículo',
                    description: `El artículo con ID \`${itemId}\` no se pudo encontrar en la tienda. Contacta al staff.`,
                    color: '#FF0000'
                });
                return await interaction.editReply({ embeds: [embed] });
            }

            // Verificar si el usuario tiene un rol que le permita usar items (desde la DB)
            const useItemAllowedRoles = await getConfig('useItemAllowedRoles');
            const canUseItem = useItemAllowedRoles && useItemAllowedRoles.length > 0 
                ? useItemAllowedRoles.some(roleId => member.roles.cache.has(roleId)) 
                : true; // Si no hay roles configurados, cualquiera puede usarlo

            if (!canUseItem) {
                 const embed = createCaborcaEmbed({
                    title: '🚫 Permiso Denegado',
                    description: `No tienes el rol necesario para usar este tipo de artículo. Solo roles específicos pueden activar ítems.`,
                    color: '#FFA500'
                });
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

            // Eliminar el item del inventario después de usarlo
            userEconomy.inventory = userEconomy.inventory.filter(id => id !== itemId);
            await userEconomy.save();

            const embed = createCaborcaEmbed({
                title: '✨ Artículo Usado',
                description: useMessage,
                footer: { text: `Gracias por usar el artículo de Caborca RP.` },
                color: responseColor
            });
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error al usar artículo:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Usar Artículo',
                description: 'Hubo un problema al intentar usar el artículo. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};