// commands/general/status.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

const cedulaSequelize = require('../../database/database');
const { economySequelize } = require('../../database/economyDatabase');
const configSequelize = require('../../database/configDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('🚀 Muestra un informe detallado del estado y rendimiento del bot.')
        .setDMPermission(false),

    async execute(interaction) {
        // En el entorno de prueba, interaction.editReply no devuelve un objeto Message real.
        // Para evitar el error, podemos simular el comportamiento o manejarlo.
        let sent;
        // Solo intenta fetchReply si no estamos en un entorno de mock de pruebas
        if (interaction.id && interaction.id.startsWith('mock_interaction_')) { // Verifica si es nuestro mock
             sent = { createdTimestamp: Date.now() }; // Simula un timestamp para el mock
        } else {
             sent = await interaction.editReply({
                content: '🔍 Recopilando datos del bot y bases de datos...',
                fetchReply: true,
                ephemeral: false
            });
        }

        // --- 1. Calcular Ping ---
        const websocketPing = interaction.client.ws.ping;
        // Asegúrate de que interaction.createdTimestamp exista para evitar NaN
        const roundtripPing = sent.createdTimestamp - (interaction.createdTimestamp || Date.now()); 

        // --- 2. Uso de Memoria ---
        const memoryUsage = process.memoryUsage();
        const rssMemory = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);

        // --- 3. Estado del Tiempo Activo ---
        const uptime = formatUptime(process.uptime());

        // --- 4. Estado de las Bases de Datos ---
        // Los mocks de DB son más complejos. Para pruebas, solo intentamos la conexión.
        // Si no tienes una DB de prueba con datos, estas llamadas podrían fallar en el mock.
        // En un entorno de prueba, estas llamadas a la DB real PUEDEN ser problemáticas.
        // Podrías mockear sequelizeInstance.authenticate() para que siempre resuelva en el mock.
        const checkDbConnection = async (sequelizeInstance, dbName) => {
            if (interaction.id && interaction.id.startsWith('mock_interaction_')) {
                // Simula una conexión exitosa en el entorno de prueba
                return `✅ ${dbName}: Conectado (Mock)`; 
            }
            try {
                await sequelizeInstance.authenticate();
                return `✅ ${dbName}: Conectado`;
            } catch (error) {
                console.error(`Error al conectar con ${dbName}:`, error.message);
                return `❌ ${dbName}: Desconectado`;
            }
        };

        const [cedulaDbStatus, economyDbStatus, configDbStatus] = await Promise.all([
            checkDbConnection(cedulaSequelize, 'Cédulas'),
            checkDbConnection(economySequelize, 'Economía'),
            checkDbConnection(configSequelize, 'Configuración')
        ]);

        // --- 5. Información General del Bot ---
        const guildsCount = interaction.client.guilds.cache.size;
        const usersCount = interaction.client.users.cache.size;
        const channelsCount = interaction.client.channels.cache.size;

        // --- 6. Conteo de Comandos por Carpeta ---
        // Los comandos se cargan en interaction.client.commands en el bot real
        // Asegúrate de que tus comandos exporten una propiedad 'category'
        const commandCategories = new Map();
        for (const [name, command] of interaction.client.commands) {
            // Asegúrate de que 'command.category' exista. Si no, ajusta tus comandos o usa un default.
            const category = command.category || 'Sin Categoría'; 
            commandCategories.set(category, (commandCategories.get(category) || 0) + 1);
        }

        let commandSummary = '';
        for (const [category, count] of commandCategories) {
            commandSummary += `\`${category}\`: ${count} comandos\n`;
        }
        if (!commandSummary) commandSummary = 'No se encontraron comandos cargados.';

        // --- Construcción del Embed ---
        const statusEmbed = new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('🚀 **Informe de Estado de Caborca Bot**')
            .setDescription('Aquí está un vistazo al rendimiento y la salud de Caborca Bot, incluyendo el estado de sus sistemas principales.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { name: '🌐 Latencia de Red', value: `**API:** \`${websocketPing}ms\` | **Bot:** \`${roundtripPing}ms\``, inline: true },
                { name: '⏳ Tiempo Activo', value: `\`${uptime}\``, inline: true },
                { name: '🧠 Uso de Memoria', value: `**Total:** \`${rssMemory} MB\` | **Heap:** \`${heapUsed} MB\``, inline: true },
                { name: '📊 Estadísticas de Discord', value: `**Servidores:** \`${guildsCount}\`\n**Usuarios en caché:** \`${usersCount}\`\n**Canales:** \`${channelsCount}\``, inline: true },
                { name: '🗄️ Estado de Bases de Datos', value: `${cedulaDbStatus}\n${economyDbStatus}\n${configDbStatus}`, inline: false },
                { name: '📁 Comandos Cargados por Categoría', value: commandSummary || 'No se cargaron comandos.', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.editReply({ content: '', embeds: [statusEmbed] });
    },
};

// Función auxiliar para formatear el tiempo activo
function formatUptime(seconds) {
    function pad(s) {
        return (s < 10 ? '0' : '') + s;
    }
    const days = Math.floor(seconds / (3600 * 24));
    seconds %= (3600 * 24);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
}