const {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags, // Importado para el warning de ephemeral y flags
    ActivityType, // Para los estados del bot
    PermissionFlagsBits // Para permisos de comandos
} = require('discord.js');

const { token, botLogoUrl, serverBannerUrl, embedColor, minVotesToOpenServer, serverOpenChannelId } = require('./config'); // Asegúrate de importar todo lo necesario de config

const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const interactionHandler = require('./handlers/interactionHandler'); // <-- ¡NUEVO! Maneja botones, select menus, modales

// Bases de datos y modelos
const cedulaSequelize = require('./database/database');
require('./models/Cedula');

const { economySequelize, UserEconomy, Arresto, Multa } = require('./database/economyDatabase'); // ServerVote removido de aquí


const configSequelize = require('./database/configDatabase');
require('./models/Config');
const { initializeConfigs, getConfig } = require('./utils/configManager'); // Mantenemos getConfig para verificación de roles

// --- DECLARACIÓN DEL CLIENTE AL PRINCIPIO ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

client.commands = new Collection();
client.config = require('./config');

// Carga los manejadores de comandos y eventos
commandHandler(client);
eventHandler(client);

// --- Lógica para los estados de presencia rotativos del bot ---
const botStatuses = [
    // Usando el emoji Unicode para '🕹️ CABORPLAY'
    { type: ActivityType.Playing, name: '🕹️ CABORPLAY' },
  
    { type: ActivityType.Custom, name: '✨ ➜ Configurado por ʿ　♡ ﹒ Achitodev　⏇' },
   
    { type: ActivityType.Watching, name: '⚙️ Mi Update 1.0.1' },
  
    { type: ActivityType.Custom, name: '🎉 Unete Ya!' } 
];
let currentStatusIndex = 0;

function setRandomStatus() {
    const status = botStatuses[currentStatusIndex];
    if (status.type === ActivityType.Custom) {
        client.user.setPresence({ activities: [{ name: status.name, type: ActivityType.Custom }], status: 'online' });
    } else {
        client.user.setPresence({ activities: [{ name: status.name, type: status.type }], status: 'online' });
    }
    currentStatusIndex = (currentStatusIndex + 1) % botStatuses.length;
}

client.once(Events.ClientReady, c => {
    console.log(`✅ ¡Bot listo! Logueado como ${c.user.tag}`);
    setRandomStatus(); // Establece el estado inicial al arrancar el bot
    setInterval(setRandomStatus, 5000); // Cambia el estado cada **5 segundos**
});


// --- Manejo centralizado de TODAS las interacciones de Discord ---
client.on(Events.InteractionCreate, async interaction => {
    // 1. Manejo de comandos de barra (Slash Commands)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No se encontró un comando que coincida con ${interaction.commandName}.`);
            return await interaction.reply({ content: 'Oops! No pude encontrar ese comando. ¿Está bien escrito? 🤔', flags: MessageFlags.Ephemeral });
        }

        // --- Lógica de verificación de rol para comandos restringidos ---
        const comandosPolicia = ['arresto', 'multa', 'consultarantecedentes'];
        const comandosAdmin = ['abrir', 'cerrar', 'configurar', 'testadmin'];
        const comandosRestringidosPorRol = [...comandosPolicia];

        // Pre-chequeo de permisos de administrador para comandos de admin
        if (comandosAdmin.includes(command.data.name)) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({ content: '❌ No tienes permisos de administrador para ejecutar este comando.', flags: MessageFlags.Ephemeral });
            }
        }

        // Chequeo de roles de policía para comandos de policía
        if (comandosRestringidosPorRol.includes(command.data.name)) {
            const member = interaction.member;
            const policeRoles = await getConfig('policeRoles') || [];

            const hasRequiredRole = policeRoles.some(roleId => member.roles.cache.has(roleId));

            if (!hasRequiredRole) {
                return await interaction.reply({ content: '❌ No tienes el rol necesario para ejecutar este comando. Solo el personal autorizado puede usarlo.', flags: MessageFlags.Ephemeral });
            }
        }

        try {
            // Deferir la respuesta para que el bot no muestre "La aplicación no responde"
            // Esto se hace AHORA de forma centralizada para TODOS los slash commands
            if (!interaction.deferred && !interaction.replied) {
                // Por defecto, deferimos efímeramente. Los comandos pueden editar esto a público si lo necesitan.
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            }

            await command.execute(interaction);

        } catch (error) {
            console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);
            // Manejo de errores genérico. Intenta editar o hacer followUp según el estado de la interacción.
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', flags: MessageFlags.Ephemeral });
            } else if (interaction.deferred) {
                await interaction.editReply({ content: 'Hubo un error al ejecutar este comando.', flags: MessageFlags.Ephemeral });
            } else if (interaction.replied) {
                await interaction.followUp({ content: 'Hubo un error al ejecutar este comando.', flags: MessageFlags.Ephemeral });
            }
        }
    }
    // 2. Manejo de interacciones de componentes (botones, select menus) y modales
    else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        // Pasa la interacción y el cliente al manejador de interacciones
        await interactionHandler(interaction, client);
    }
});


// Sincronizar las bases de datos y luego iniciar el bot
Promise.all([
    cedulaSequelize.sync(),
    economySequelize.sync(),
    configSequelize.sync(),

])
.then(async () => {
    console.log('✅ Todas las bases de datos (Cédulas, Economía, Configuración, Votaciones, Arrestos, Multas) sincronizadas con éxito.');
    await initializeConfigs();
    client.login(token)
    .then(() => console.log('✅ Caborca Bot está en línea y conectado a Discord. ¡Listo para el rol! 🌵'))
    .catch(err => {
        console.error('❌ Error al conectar el bot a Discord:', err);
        process.exit(1);
    });
})
.catch(error => {
    console.error('❌ Error al sincronizar una o más bases de datos:', error);
    process.exit(1);
});

module.exports = client;