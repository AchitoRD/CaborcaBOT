// commands/rp/registrarcedula.js
const { SlashCommandBuilder } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const Cedula = require('../../models/Cedula');
const { getConfig } = require('../../utils/configManager'); // Importa getConfig

const DNI_BACKGROUND_URL = 'https://media.discordapp.net/attachments/952725082508259399/1374848907716202506/background.png?ex=68322e53&is=6830dcd3&hm=15c1b5702d676468e660842924bd06072f30b17cb57538775180b09d48d49747&=&format=webp&quality=lossless';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registrarcedula')
        .setDescription('Registra la cédula de tu personaje de rol en Caborca RP. 🆔')
        .addStringOption(option => option.setName('nombre').setDescription('Tu nombre de rol').setRequired(true))
        .addStringOption(option => option.setName('apellido').setDescription('Tu apellido de rol').setRequired(true))
        .addStringOption(option => option.setName('fecha_nacimiento').setDescription('Tu fecha de nacimiento de rol (DD/MM/AAAA)').setRequired(true))
        .addStringOption(option => option.setName('nacionalidad').setDescription('Tu nacionalidad de rol').setRequired(true))
        .addStringOption(option =>
            option.setName('genero')
                .setDescription('Tu género de rol')
                .setRequired(false)
                .addChoices(
                    { name: 'Masculino', value: 'Masculino' },
                    { name: 'Femenino', value: 'Femenino' },
                    { name: 'No Binario', value: 'No Binario' },
                    { name: 'Prefiero no decirlo', value: 'No especificado' }
                ))
        .addStringOption(option =>
            option.setName('tipo_sangre')
                .setDescription('Tu tipo de sangre de rol (ej: A+, O-, etc.)')
                .setRequired(false)
                .addChoices(
                    { name: 'A+', value: 'A+' }, { name: 'A-', value: 'A-' },
                    { name: 'B+', value: 'B+' }, { name: 'B-', value: 'B-' },
                    { name: 'AB+', value: 'AB+' }, { name: 'AB-', value: 'AB-' },
                    { name: 'O+', value: 'O+' }, { name: 'O-', value: 'O-' }
                ))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Una breve descripción de tu personaje de rol (máx. 250 caracteres)')
                .setRequired(false)),
    async execute(interaction) {
        // *** NO DEBE HABER DEFERENCIA AQUÍ. commandHandler.js la hace automáticamente. ***

        const userId = interaction.user.id;
        const member = interaction.member;
        const nombre = interaction.options.getString('nombre');
        const apellido = interaction.options.getString('apellido');
        const fechaNacimiento = interaction.options.getString('fecha_nacimiento');
        const nacionalidad = interaction.options.getString('nacionalidad');
        const genero = interaction.options.getString('genero') || 'No especificado';
        const tipoSangre = interaction.options.getString('tipo_sangre') || 'Desconocido';
        const descripcion = interaction.options.getString('descripcion') || 'Sin descripción.';

        try {
            const existingCedula = await Cedula.findByPk(userId);

            if (existingCedula) {
                const existingCedulaEmbed = createCaborcaEmbed({
                    title: '📝 Cédula Ya Registrada',
                    description: `¡Ya tienes una cédula a nombre de **${existingCedula.nombre} ${existingCedula.apellido}** en nuestros registros!
                    \nUsa \`/micedula\` para verla o contacta al staff si necesitas modificarla.`,
                    color: '#FFA500',
                    footer: { text: 'Una cédula por persona en Caborca RP.' }
                });
                // *** CAMBIO: Usar editReply() ***
                return await interaction.editReply({ embeds: [existingCedulaEmbed] });
            }

            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(fechaNacimiento)) {
                 const invalidDateEmbed = createCaborcaEmbed({
                    title: '❌ Formato de Fecha Inválido',
                    description: 'La fecha de nacimiento debe estar en formato **DD/MM/AAAA** (ej: 01/01/1990).',
                    color: '#FF0000'
                });
                // *** CAMBIO: Usar editReply() ***
                return await interaction.editReply({ embeds: [invalidDateEmbed] });
            }

            await Cedula.create({
                userId: userId,
                nombre: nombre,
                apellido: apellido,
                fechaNacimiento: fechaNacimiento,
                nacionalidad: nacionalidad,
                genero: genero,
                tipoSangre: tipoSangre,
                descripcion: descripcion.substring(0, 250),
                dniImageUrl: DNI_BACKGROUND_URL
            });

            // --- Lógica para asignar/remover roles usando getConfig ---
            const citizenRole = await getConfig('citizenRole');
            const unverifiedRole = await getConfig('unverifiedRole');

            if (citizenRole) {
                try {
                    const role = await interaction.guild.roles.fetch(citizenRole);
                    if (role) {
                        await member.roles.add(role, 'Cédula registrada: Asignando rol de Ciudadano.');
                        console.log(`[Roles] Rol "${role.name}" asignado a ${member.user.tag} por registrar cédula.`);

                        if (unverifiedRole && member.roles.cache.has(unverifiedRole)) {
                            const unverified = await interaction.guild.roles.fetch(unverifiedRole);
                            if (unverified) {
                                await member.roles.remove(unverified, 'Cédula registrada: Removiendo rol de no verificado.');
                                console.log(`[Roles] Rol "${unverified.name}" removido de ${member.user.tag}.`);
                            }
                        }

                    } else {
                        console.warn(`[Roles] No se encontró el rol de ciudadano con ID: ${citizenRole}.`);
                    }
                } catch (roleError) {
                    console.error(`[Roles] Error al asignar/remover rol a ${member.user.tag}:`, roleError);
                }
            } else {
                console.warn('[Roles] El rol de ciudadano no está configurado en la DB.');
            }
            // --- Fin de lógica de roles ---

            const successEmbed = createCaborcaEmbed({
                title: '✅ ¡Cédula Registrada con Éxito!',
                description: `¡Bienvenido, **${nombre} ${apellido}**, a la vida oficial de Caborca RP! Tu edad se calculará automáticamente.
                \n${citizenRole ? '¡Has recibido tu rol de Ciudadano de Caborca! 🎉' : ''}`,
                fields: [
                    { name: 'Nombre Completo', value: `${nombre} ${apellido}`, inline: true },
                    { name: 'Fecha de Nacimiento', value: fechaNacimiento, inline: true },
                    { name: 'Nacionalidad', value: nacionalidad, inline: true },
                    { name: 'Género', value: genero, inline: true },
                    { name: 'Tipo de Sangre', value: tipoSangre, inline: true },
                    { name: 'Descripción', value: descripcion.substring(0, 250), inline: false },
                ],
                imageUrl: DNI_BACKGROUND_URL,
                footer: { text: '¡Tu nueva identidad en el desierto de Caborca! Usa /micedula para verla. 🌵' },
            });

            // *** CAMBIO: Usar editReply() y omitir ephemeral, ya lo maneja commandHandler.js ***
            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error al registrar cédula:', error);
            const errorEmbed = createCaborcaEmbed({
                title: '❌ Error al Registrar Cédula',
                description: 'Hubo un problema al intentar registrar tu cédula. Por favor, inténtalo de nuevo más tarde.\n(Si el error persiste, contacta al staff con este mensaje: ' + error.message + ')',
                color: '#FF0000'
            });
            // *** CAMBIO: Usar editReply() ***
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};