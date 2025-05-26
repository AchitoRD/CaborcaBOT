// commands/sistema/help.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require('discord.js');
const { createCaborcaEmbed } = require('../../utils/embedBuilder');
const { serverBannerUrl } = require('../../config');

// Objeto de configuración de categorías con emojis y descripciones
// Las claves DEBEN coincidir con los NOMBRES DE TUS CARPETAS de comandos.
// Las claves aquí deben estar en el mismo formato que los nombres de las carpetas (ej. 'admin', 'economy').
// Si tus carpetas son en minúsculas, las claves aquí también.
const categoryConfig = {
    'admin': {
        emoji: '👮‍♂️',
        displayName: 'Administración',
        description: 'Comandos para gestionar el servidor y el bot.',
    },
    'economy': {
        emoji: '💰',
        displayName: 'Economía',
        description: 'Comandos relacionados con la economía del servidor: balances, compras, trabajos, etc.',
    },
    'general': { // Carpeta 'general' para micedula, vercedula
        emoji: '📋',
        displayName: 'Generales',
        description: 'Comandos de utilidad general y registro de información, como la cédula.',
    },
    'sistema': { // Carpeta 'sistema' para /help, /status
        emoji: '🤖',
        displayName: 'Sistema',
        description: 'Comandos relacionados con el funcionamiento y la información del bot.',
    },
    'policia': { // Asegúrate de tener una carpeta 'policia' si usas esta categoría
        emoji: '🚓',
        displayName: 'Policía',
        description: 'Comandos exclusivos para el rol de policía: arrestos, multas, etc.',
    },
    'roleplay': { // Asegúrate de tener una carpeta 'roleplay' si usas esta categoría
        emoji: '🎭',
        displayName: 'Roleplay',
        description: 'Comandos para interactuar y rolear dentro del servidor.',
    },
    'Sin Categoría': { // Para comandos que no tienen una categoría asignada
        emoji: '❓',
        displayName: 'Otros Comandos',
        description: 'Comandos que no pertenecen a una categoría específica.',
    },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📚 Muestra la guía de comandos interactiva del bot.')
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.editReply({
            content: 'Cargando guía de comandos...',
            fetchReply: true,
            ephemeral: false
        });

        const commands = interaction.client.commands;
        const categoriesInBot = new Set(); // Recopilar solo las categorías que realmente existen en el bot

        for (const [name, command] of commands) {
            const category = command.category || 'Sin Categoría';
            categoriesInBot.add(category);
        }

        const selectOptions = Array.from(categoriesInBot)
            .sort((a, b) => {
                // Ordenar alfabéticamente, pero 'sistema' y 'Sin Categoría' al final
                if (a === 'sistema') return 1;
                if (b === 'sistema') return -1;
                if (a === 'Sin Categoría') return 1;
                if (b === 'Sin Categoría') return -1;
                return a.localeCompare(b);
            })
            .map(category => {
                // Obtiene la configuración de la categoría usando el nombre de la carpeta.
                // Si la carpeta no está en categoryConfig, usa 'Sin Categoría'.
                const config = categoryConfig[category] || categoryConfig['Sin Categoría']; 
                return new StringSelectMenuOptionBuilder()
                    .setLabel(`${config.emoji} ${config.displayName}`)
                    .setDescription(config.description)
                    .setValue(`help_category_${category}`); // El valor es simplemente el nombre de la carpeta (ej. 'admin')
            });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Elige una categoría para ver sus comandos...');

        if (selectOptions.length > 0) {
            selectMenu.addOptions(selectOptions);
        } else {
            selectMenu.setPlaceholder('No hay categorías de comandos disponibles.');
            selectMenu.setDisabled(true);
        }

        const actionRow = new ActionRowBuilder()
            .addComponents(selectMenu);

        const helpEmbed = createCaborcaEmbed({
            title: '📚 **Guía Interactiva de Comandos de Caborca Bot**',
            description: '¡Bienvenido a la ayuda! Aquí puedes explorar todos mis comandos organizados por categorías. Simplemente selecciona una opción del menú desplegable para ver los detalles.\n\n',
            imageUrl: serverBannerUrl,
            thumbnail: interaction.client.user.displayAvatarURL(),
            color: '#3498DB'
        });

        helpEmbed.setFooter({ text: `Para más detalles sobre un comando, usa / y selecciona. | Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        helpEmbed.setTimestamp();

        await interaction.editReply({
            content: '',
            embeds: [helpEmbed],
            components: [actionRow]
        });
    },

    async handleSelectMenu(interaction) {
        await interaction.deferUpdate();

        // selectedCategoryValue será el nombre de la carpeta tal cual (ej. 'admin', 'economy')
        const selectedCategoryValue = interaction.values[0].replace('help_category_', ''); 
        
        // Obtenemos la configuración de la categoría usando el nombre de la carpeta directamente
        const config = categoryConfig[selectedCategoryValue] || categoryConfig['Sin Categoría'];

        const commands = interaction.client.commands;
        const cmdsInCategory = [];

        for (const [name, command] of commands) {
            const commandCategory = command.category || 'Sin Categoría'; // Esto es lo que viene de commandHandler.js
            
            // La comparación directa entre el nombre de la carpeta del comando y el valor seleccionado.
            if (commandCategory === selectedCategoryValue) { 
                cmdsInCategory.push(command);
            }
        }

        const sortedCmds = cmdsInCategory.sort((a, b) => a.data.name.localeCompare(b.data.name));

        const commandListContent = sortedCmds.length > 0
            ? sortedCmds.map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`).join('\n')
            : 'No se encontraron comandos en esta categoría.';

        const categoryEmbed = createCaborcaEmbed({
            title: `${config.emoji} Comandos de la Categoría: ${config.displayName}`,
            description: `Aquí tienes los comandos para **${config.description.toLowerCase()}**:\n\n${commandListContent}`,
            color: '#28B463'
        });

        categoryEmbed.setFooter({ text: `Para ver otra categoría, usa el menú desplegable. | Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        categoryEmbed.setTimestamp();

        await interaction.editReply({
            embeds: [categoryEmbed],
            components: interaction.message.components // Mantiene el menú desplegable original
        });
    }
};