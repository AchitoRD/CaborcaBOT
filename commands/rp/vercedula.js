// commands/rp/vercedula.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const Cedula = require('../../models/Cedula');

const DNI_BACKGROUND_URL = 'https://media.discordapp.net/attachments/952725082508259399/1374848907716202506/background.png?ex=68322e53&is=6830dcd3&hm=15c1b5702d676468e660842924bd06072f30b17cb57538775180b09d48d49747&=&format=webp&quality=lossless';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vercedula')
        .setDescription('Muestra la cédula de otro usuario de rol en Caborca RP. 🕵️‍♂️')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('El usuario del que quieres ver la cédula')
                .setRequired(true)),
    async execute(interaction) {
        // *** NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente. ***

        const targetUser = interaction.options.getUser('usuario');

        try {
            const cedula = await Cedula.findByPk(targetUser.id);

            if (!cedula) {
                const noCedulaEmbed = createCaborcaEmbed({
                    title: '🚫 Cédula No Encontrada',
                    description: `**${targetUser.username}** aún no tiene una cédula registrada en Caborca RP.`,
                    color: '#FFEA00'
                });
                // *** CAMBIO: Usar editReply() ***
                return await interaction.editReply({ embeds: [noCedulaEmbed] });
            }

            const cedulaEmbed = createCaborcaEmbed({
                title: `🆔 CÉDULA DE IDENTIDAD - CABORCA RP`,
                description: `**Información de ${cedula.nombre} ${cedula.apellido}**`,
                fields: [
                    { name: 'NOMBRE COMPLETO', value: `\`\`\`${cedula.nombre} ${cedula.apellido}\`\`\``, inline: false },
                    { name: 'FECHA DE NACIMIENTO', value: `\`\`\`${cedula.fechaNacimiento}\`\`\``, inline: true },
                    { name: 'EDAD', value: `\`\`\`${cedula.edad} años\`\`\``, inline: true }, // <-- Nuevo campo de edad
                    { name: 'NACIONALIDAD', value: `\`\`\`${cedula.nacionalidad}\`\`\``, inline: true },
                    { name: 'GÉNERO', value: `\`\`\`${cedula.genero}\`\`\``, inline: true },
                    { name: 'TIPO DE SANGRE', value: `\`\`\`${cedula.tipoSangre}\`\`\``, inline: true },
                    { name: 'ID DE CIUDADANO', value: `\`\`\`${cedula.userId}\`\`\``, inline: false },
                    { name: 'DESCRIPCIÓN', value: `\`\`\`${cedula.descripcion || 'Sin descripción.'}\`\`\``, inline: false }
                ],
                imageUrl: DNI_BACKGROUND_URL,
                footer: { text: `Emitido por la Oficina de Identificación de Caborca. 🌵 | Registrado el ${cedula.fechaRegistro.toLocaleDateString()}` },
            });

            // *** CAMBIO: Usar editReply() ***
            await interaction.editReply({ embeds: [cedulaEmbed] });
        } catch (error) {
            console.error('Error al obtener cédula de otro usuario:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Mostrar Cédula',
                description: 'Hubo un problema al intentar recuperar la cédula del usuario. Por favor, inténtalo de nuevo más tarde.',
                color: '#FF0000'
            });
            // *** CAMBIO: Usar editReply() ***
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};