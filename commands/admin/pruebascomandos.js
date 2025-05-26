const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder'); 

const DEFAULT_COMMAND_VERSION = '1.0.1'; 
const DEFAULT_COMMAND_STATE = 'Funcionando'; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pruebascomandos')
        .setDescription('Ejecuta una serie de pruebas de diagnóstico en todos los comandos del bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const client = interaction.client;
        const commandsToTest = Array.from(client.commands.values()); 

        let results = [];
        let successCount = 0;
        let failCount = 0;
        let ignoredCount = 0;

        const mockInteraction = {
            user: { 
                id: interaction.user.id,
                username: interaction.user.username,
                tag: interaction.user.tag,
                displayAvatarURL: (options) => interaction.user.displayAvatarURL(options), 
                createdTimestamp: interaction.user.createdTimestamp, 
            },
            member: { 
                id: interaction.member.id,
                displayName: interaction.member.displayName,
                roles: interaction.member.roles, 
                permissions: interaction.member.permissions, 
                joinedTimestamp: interaction.member.joinedTimestamp,
                displayAvatarURL: (options) => interaction.member.displayAvatarURL(options),
            },
            guild: interaction.guild,     
            channel: interaction.channel, 
            client: client,               
            id: 'mock_interaction_' + Date.now(),
            
            createdTimestamp: interaction.createdTimestamp, 
            
            replied: false,
            deferred: false,

            editReply: async (options) => { mockInteraction.replied = true; mockInteraction.deferred = true; },
            reply: async (options) => { mockInteraction.replied = true; },
            followUp: async (options) => { /* console.log('[MOCK] followUp:', options); */ },
            deferReply: async (options) => { mockInteraction.deferred = true; }, 
            deferUpdate: async () => { mockInteraction.deferred = true; },
            showModal: async (modal) => { mockInteraction.replied = true; }, 
            deleteReply: async () => { mockInteraction.replied = false; mockInteraction.deferred = false; },

            isChatInputCommand: () => true, 
            isButton: () => false,
            isStringSelectMenu: () => false,
            isModalSubmit: () => false,
            
            options: {
                getString: (name) => 'mock_string_value', 
                getInteger: (name) => 123,                 
                getNumber: (name) => 456.78,               
                getBoolean: (name) => true,                
                
                getUser: (name) => ({ 
                    id: '123456789012345678', 
                    username: 'mock_user', 
                    tag: 'mock_user#0000',
                    displayAvatarURL: () => 'https://example.com/avatar.png',
                    createdTimestamp: Date.now() - 3600000 * 24 * 365, 
                }),
                getMember: (name) => ({
                    id: '123456789012345678', 
                    displayName: 'Mock Member',
                    roles: { cache: new Map() }, 
                    permissions: new PermissionFlagsBits(PermissionFlagsBits.SendMessages), 
                    joinedTimestamp: Date.now() - 3600000 * 24 * 180, 
                    displayAvatarURL: () => 'https://example.com/avatar.png', 
                }),
                getChannel: (name) => ({
                    id: '234567890123456789',
                    name: 'mock-channel',
                    type: 0, 
                    createdTimestamp: Date.now() - 3600000 * 24 * 90, 
                }),
                getRole: (name) => ({
                    id: '345678901234567890',
                    name: 'Mock Role',
                    createdTimestamp: Date.now() - 3600000 * 24 * 60, 
                }),
                getAttachment: (name) => ({
                    id: 'attachment_id_mock',
                    name: 'mock_file.png',
                    url: 'https://example.com/mock_file.png',
                    contentType: 'image/png',
                    size: 1024,
                    proxyURL: 'https://example.com/proxy_mock_file.png',
                }),

                getSubcommand: () => null, 
                getSubcommandGroup: () => null,
            },
            fields: {
                getTextInputValue: (customId) => 'mock_modal_text_input',
            },
        };

        for (const command of commandsToTest) {
            const startTime = process.hrtime.bigint(); 

            mockInteraction.replied = false;
            mockInteraction.deferred = false;

            let status = '✅ OK'; 
            let errorMessage = 'Ninguno'; 

            try {
                if (command.data.name === 'pruebascomandos') {
                    status = '🟡 IGNORADO';
                    errorMessage = 'Este comando no se auto-prueba.';
                    ignoredCount++;
                } else if (command.execute) {
                    await command.execute(mockInteraction);
                } else {
                    status = '❌ FALLO';
                    errorMessage = 'El comando no tiene una función `execute` definida.';
                }

            } catch (error) {
                status = '❌ FALLO';
                errorMessage = error.message || 'Error desconocido';
            }

            const endTime = process.hrtime.bigint(); 
            const executionTimeMs = Number(endTime - startTime) / 1_000_000; 

            results.push({
                name: command.data.name,
                status: status,
                errorMessage: errorMessage,
                executionTime: `${executionTimeMs.toFixed(2)}ms`,
                version: command.version || DEFAULT_COMMAND_VERSION, 
                internalState: command.state || DEFAULT_COMMAND_STATE 
            });

            if (status.startsWith('✅')) {
                successCount++;
            } else if (status.startsWith('❌')) {
                failCount++;
            }
        }

        // --- CONSTRUCCIÓN DEL EMBED DE INFORME (SIN ARCHIVO ADJUNTO) ---
        const testResultsEmbed = createCaborcaEmbed({
            title: '📊 Informe de Pruebas de Comandos',
            description: `Se han ejecutado pruebas de diagnóstico en **${commandsToTest.length} comandos** de tu bot.`,
            color: '#007bff', 
            thumbnail: interaction.client.user.displayAvatarURL(),
            fields: [], 
            footer: { text: `Prueba realizada por ${interaction.user.tag}` },
            timestamp: true
        });

        testResultsEmbed.addFields(
            { name: 'Total de Comandos Probados', value: `${commandsToTest.length}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true }, // Espacio en blanco
            { name: 'Resumen de Resultados', value: '\u200B', inline: false }, // Encabezado para el resumen
            { name: '✅ OK', value: `${successCount} comandos`, inline: true },
            { name: '❌ Fallidos', value: `${failCount} comandos`, inline: true },
            { name: '🟡 Ignorados', value: `${ignoredCount} comandos`, inline: true }, 
        );

        // --- Detalles Completos en Campos del Embed (Ordenados y Limitados) ---
        // Ordenar los resultados para que los fallidos aparezcan primero
        results.sort((a, b) => {
            if (a.status.startsWith('❌') && !b.status.startsWith('❌')) return -1;
            if (!a.status.startsWith('❌') && b.status.startsWith('❌')) return 1;
            if (a.status.startsWith('🟡') && !b.status.startsWith('🟡')) return 1; 
            if (!a.status.startsWith('🟡') && b.status.startsWith('🟡')) return -1;
            return a.name.localeCompare(b.name); 
        });

        let detailDescription = '';
        results.forEach(res => {
            detailDescription += `\n**\`/${res.name}\`**: ${res.status} (Tiempo: ${res.executionTime})\n`;
            if (res.errorMessage !== 'Ninguno') {
                detailDescription += `> 📝 **Error**: \`${res.errorMessage}\`\n`;
            }
            detailDescription += `> ℹ️ **Versión**: \`${res.version}\` | **Estado**: \`${res.internalState}\`\n`;
        });

        // Dividir la descripción detallada en múltiples campos si excede el límite de 1024 caracteres
        const chunkSize = 1000; // Usamos 1000 para ser seguros
        for (let i = 0; i < detailDescription.length; i += chunkSize) {
            const chunk = detailDescription.substring(i, i + chunkSize);
            testResultsEmbed.addFields({ 
                name: i === 0 ? 'Detalles por Comando' : '\u200B', // Solo el primer campo tiene título
                value: chunk, 
                inline: false 
            });
        }
        
        // --- Envío del Informe al Usuario ---
        try {
            await interaction.user.send({ embeds: [testResultsEmbed] }); 
            await interaction.editReply({ content: '✅ El informe de pruebas de comandos ha sido enviado a tu DM.', ephemeral: true }); 
        } catch (dmError) {
            console.error(`Error enviando informe de pruebas al DM de ${interaction.user.tag}:`, dmError);
            // Si el DM falla, se envía el embed directamente al canal como efímero.
            await interaction.editReply({ 
                content: '❌ No pude enviarte el informe por DM. Aquí está:\n', 
                embeds: [testResultsEmbed], 
                ephemeral: true 
            });
        }
    },
};