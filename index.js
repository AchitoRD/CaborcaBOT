const {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
    EmbedBuilder, // Necesario si creas embeds directamente aquí
    ActionRowBuilder, // Necesario si creas ActionRows directamente aquí
    ButtonBuilder, // Necesario si creas botones directamente aquí
    ButtonStyle, // Necesario si creas estilos de botones directamente aquí
    MessageFlags,
    ActivityType,
    PermissionFlagsBits
} = require('discord.js');

const { token, botLogoUrl, serverBannerUrl, embedColor, minVotesToOpenServer, serverOpenChannelId } = require('./config');

const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const interactionHandler = require('./handlers/interactionHandler'); // Manejador centralizado de interacciones

// Bases de datos y modelos
const cedulaSequelize = require('./database/database');
require('./models/Cedula');

const { economySequelize, UserEconomy, Arresto, Multa } = require('./database/economyDatabase');
require('./models/UserEconomy'); // Asegurarse de que el modelo se cargue
require('./models/Arresto'); // Asegurarse de que el modelo se cargue
require('./models/Multa'); // Asegurarse de que el modelo se cargue


const configSequelize = require('./database/configDatabase');
require('./models/Config');
const { initializeConfigs, getConfig } = require('./utils/configManager');

// --- DECLARACIÓN E INICIALIZACIÓN DEL CLIENTE ---
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

// --- INICIALIZACIÓN DE PROPIEDADES DEL CLIENTE ---
// Se inicializan DESPUÉS de que la instancia 'client' ha sido creada.
client.commands = new Collection(); // Para almacenar los comandos de barra
client.config = require('./config'); // La configuración estática del bot
client.activePolls = new Map(); // <-- ¡AHORA SÍ! Se inicializa después de 'client' y es un Map
client.cooldowns = new Collection(); // Para la gestión de cooldowns de comandos

// Carga los manejadores principales
commandHandler(client); // Carga todos los comandos del directorio 'commands'
eventHandler(client);   // Carga todos los eventos del directorio 'events'

// --- Lógica para los estados de presencia rotativos del bot ---
const botStatuses = [
    { type: ActivityType.Playing, name: '🕹️ CABORPLAY' },
    { type: ActivityType.Custom, name: '✨ ➜ Configurado por ʿ　♡ ﹒ Achitodev　⏇' },
    { type: ActivityType.Watching, name: '⚙️ Mi Update 1.0' },
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

// Una vez que el bot esté listo, establece la presencia y sincroniza bases de datos.
client.once(Events.ClientReady, c => {
    console.log(`✅ ¡Bot listo! Logueado como ${c.user.tag}`);
    setRandomStatus(); // Establece el primer estado al arrancar
    setInterval(setRandomStatus, 5000); // Cambia el estado cada 5 segundos
});


// --- Manejo centralizado de TODAS las interacciones de Discord ---
// Este es el punto de entrada para slash commands, botones, select menus y modales.
client.on(Events.InteractionCreate, async interaction => {
    // 1. Manejo de comandos de barra (Slash Commands)
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No se encontró un comando que coincida con ${interaction.commandName}.`);
            return await interaction.reply({ content: 'Oops! No pude encontrar ese comando. ¿Está bien escrito? 🤔', flags: MessageFlags.Ephemeral });
        }

        // --- Lógica de verificación de rol para comandos restringidos ---
        // Estos comandos requieren roles o permisos específicos.
        const comandosPolicia = ['arresto', 'multa', 'consultarantecedentes'];
        // Asegúrate de que todos los comandos de administración estén aquí.
        const comandosAdmin = ['abrir', 'cerrar', 'configurar', 'testadmin', 'pruebascomandos']; 

        // Pre-chequeo de permisos de administrador para comandos de admin
        if (comandosAdmin.includes(command.data.name)) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                // Si el usuario no es admin, responde de inmediato y efímeramente.
                return await interaction.reply({ content: '❌ No tienes permisos de administrador para ejecutar este comando.', flags: MessageFlags.Ephemeral });
            }
        }

        // Chequeo de roles de policía para comandos de policía
        if (comandosPolicia.includes(command.data.name)) {
            const member = interaction.member;
            const policeRoles = await getConfig('policeRoles') || []; // Obtiene los IDs de roles de policía configurados.

            const hasRequiredRole = policeRoles.some(roleId => member.roles.cache.has(roleId));

            if (!hasRequiredRole) {
                // Si el usuario no tiene el rol de policía requerido, responde de inmediato.
                return await interaction.reply({ content: '❌ No tienes el rol necesario para ejecutar este comando. Solo el personal autorizado puede usarlo.', flags: MessageFlags.Ephemeral });
            }
        }

        try {
            // --- Sistema de Deferencia de Interacciones Centralizado ---
            // Esto es crucial para evitar el mensaje "La aplicación no responde".
            // Por defecto, se diferirá la interacción efímeramente para la mayoría de comandos.
            // Los comandos individuales NO deben llamar a deferReply().
            // EXCEPCIÓN: Si un comando necesita una respuesta PÚBLICA inicial (ej. /abrir, /cerrar),
            // lo indicamos aquí para que él mismo maneje su deferencia/respuesta.
            if (!interaction.deferred && !interaction.replied) {
                // CAMBIO: Incluye /cerrar para que también gestione su propia deferencia pública.
                if (command.data.name === 'abrir' || command.data.name === 'cerrar') { 
                    // Estos comandos gestionarán su propia deferencia/respuesta para que sea PÚBLICA.
                    // No hacemos deferReply aquí.
                } else {
                    // Para el resto de comandos, deferimos efímeramente de forma predeterminada.
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                }
            }

            // Ejecuta la lógica del comando.
            await command.execute(interaction);

        } catch (error) {
            // Manejo de errores genérico para cualquier fallo durante la ejecución de un comando.
            console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);
            // Intenta responder al usuario de la mejor manera posible según el estado actual de la interacción.
            if (!interaction.replied && !interaction.deferred) {
                // Si aún no se ha respondido ni diferido, envía una respuesta inicial.
                await interaction.reply({ content: 'Hubo un error al ejecutar este comando. Por favor, inténtalo de nuevo más tarde.', flags: MessageFlags.Ephemeral });
            } else if (interaction.deferred) {
                // Si la interacción ya fue diferida, edita la respuesta diferida.
                await interaction.editReply({ content: 'Hubo un error al ejecutar este comando. Por favor, inténtalo de nuevo más tarde.', flags: MessageFlags.Ephemeral });
            } else if (interaction.replied) {
                // Si la interacción ya fue respondida, envía un mensaje de seguimiento.
                await interaction.followUp({ content: 'Hubo un error al ejecutar este comando. Por favor, inténtalo de nuevo más tarde.', flags: MessageFlags.Ephemeral });
            }
        }
    }
    // 2. Manejo de interacciones de componentes (botones, select menus) y modales
    // Si la interacción no es un slash command, la pasamos al manejador de interacciones.
    else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        await interactionHandler(interaction, client);
    }
});


// Sincronizar todas las bases de datos al inicio del bot
// Y luego, iniciar sesión del bot en Discord.
Promise.all([
    cedulaSequelize.sync(),      // Sincroniza la DB de cédulas
    economySequelize.sync(),     // Sincroniza la DB de economía (incluye Arrestos y Multas)
    configSequelize.sync(),      // Sincroniza la DB de configuración
])
.then(async () => {
    console.log('✅ Todas las bases de datos (Cédulas, Economía, Configuración, Arrestos, Multas) sincronizadas con éxito.');
    await initializeConfigs(); // Carga las configuraciones iniciales o por defecto del bot desde la DB.
    client.login(token) // Inicia sesión del bot en Discord.
    .then(() => console.log('✅ Caborca Bot está en línea y conectado a Discord. ¡Listo para el rol! 🌵'))
    .catch(err => {
        console.error('❌ Error al conectar el bot a Discord:', err);
        process.exit(1); // Si hay un error al conectar a Discord, el proceso se detiene.
    });
})
.catch(error => {
    console.error('❌ Error al sincronizar una o más bases de datos:', error);
    process.exit(1); // Si hay un error al sincronizar las DBs, el proceso se detiene.
});

module.exports = client;