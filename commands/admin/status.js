// commands/admin/status.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const path = require('path');
const fs = require('fs');

// NO importamos Sequelize directamente aquí. Se obtiene del 'client'.

const { embedColor } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('📊 Muestra el estado actual del bot, APIs y módulos.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // 🚨 AQUÍ SÍ DEBE ESTAR LA PRIMERA RESPUESTA/DEFERRAL 🚨
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); 

        let dbStatus = '❔ Estado Desconocido (bot no en línea)';
        
        // Verificamos si la instancia de Sequelize está disponible en el cliente del bot
        if (interaction.client.sequelize) {
            try {
                await interaction.client.sequelize.authenticate();
                dbStatus = '✅ Conectado y Sincronizado';
            } catch (error) {
                console.error('Error al verificar la conexión a la DB en comando /status:', error);
                dbStatus = `❌ Error: ${error.message.substring(0, 70)}${error.message.length > 70 ? '...' : ''}`;
            }
        } else {
            dbStatus = '⚠️ DB no inicializada (bot no en línea o problema de acceso).';
        }

        // --- Contar comandos y eventos cargados ---
        const commandsRootPath = path.join(__dirname, '..');
        const eventsPath = path.join(__dirname, '..', '..', 'events');

        let commandsCount = 0;
        try {
            const commandFolders = fs.readdirSync(commandsRootPath, { withFileTypes: true });
            for (const dirent of commandFolders) {
                if (dirent.isDirectory()) {
                    const folderPath = path.join(commandsRootPath, dirent.name);
                    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
                    commandsCount += commandFiles.length;
                } else if (dirent.isFile() && dirent.name.endsWith('.js')) {
                    commandsCount++;
                }
            }
        } catch (error) {
            console.error('Error al contar comandos:', error);
            commandsCount = 'Error al leer comandos';
        }

        let eventsCount = 0;
        try {
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
            eventsCount = eventFiles.length;
        } catch (error) {
            console.error('Error al contar eventos:', error);
            eventsCount = 'Error al leer eventos';
        }
        // --- Fin del conteo ---

        // Calculando el tiempo de actividad (uptime)
        const uptimeMilliseconds = interaction.client.uptime;
        const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);
        const uptimeHours = Math.floor(uptimeMinutes / 60);
        const uptimeDays = Math.floor(uptimeHours / 24);

        const uptimeString = `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`;

        // Uso de memoria del proceso
        const memoryUsage = process.memoryUsage();
        const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);

        const statusEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('📊 Estado del Caborca Bot')
            .addFields(
                { name: '🌐 Discord API', value: `\`${interaction.client.ws.ping}ms\``, inline: true },
                { name: '⏱️ Uptime', value: `\`${uptimeString}\``, inline: true },
                { name: '💾 Base de Datos', value: `\`${dbStatus}\``, inline: false },
                { name: '🤖 Bot', value: `\`${interaction.client.user.tag} (ID: ${interaction.client.user.id})\``, inline: false },
                { name: '🏠 Servidores', value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
                { name: '👥 Usuarios en Caché', value: `\`${interaction.client.users.cache.size}\``, inline: true },
                { name: '📜 Comandos Cargados', value: `\`${commandsCount}\``, inline: true },
                { name: '✨ Eventos Cargados', value: `\`${eventsCount}\``, inline: true },
                { name: '🧠 Uso de Memoria', value: `\`${rss}MB (RSS) / ${heapUsed}MB (Heap)\``, inline: false },
                { name: 'Node.js Versión', value: `\`${process.version}\``, inline: true },
            )
            .setTimestamp()
            .setFooter({ text: 'Información actualizada en tiempo real' });

        await interaction.editReply({ embeds: [statusEmbed] });
    },
};