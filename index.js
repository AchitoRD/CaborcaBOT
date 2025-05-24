// index.js (Contenido FINAL Y OPTIMIZADO - Refactorizado para usar interactionHandler)

const {

Client,

GatewayIntentBits,

Collection,

Events,

EmbedBuilder, // Todavía necesario si generateConfigPanelEmbedAndComponents está aquí

ActionRowBuilder, // Todavía necesario

ButtonBuilder, // Todavía necesario

ButtonStyle, // Todavía necesario

MessageFlags // <-- Importado para el warning de ephemeral y flags

} = require('discord.js');


const { token } = require('./config');

const commandHandler = require('./handlers/commandHandler');

const eventHandler = require('./handlers/eventHandler');

const buttonHandler = require('./handlers/buttonHandler'); // Para 'verify_'

const interactionHandler = require('./handlers/interactionHandler'); // <-- ¡NUEVO!


// Bases de datos

const cedulaSequelize = require('./database/database');

require('./models/Cedula');


const economySequelize = require('./database/economyDatabase');

require('./models/UserEconomy');


const configSequelize = require('./database/configDatabase');

const Config = require('./models/Config');

const { initializeConfigs, getConfig, saveConfig, clearAllConfigs } = require('./utils/configManager');


const Verification = require('./models/Verification');

const ServerVote = require('./models/ServerVote'); // Asegúrate de que ServerVote esté importado


const { shop, serverBannerUrl, embedColor } = require('./config'); // Asegúrate de que esto esté importado


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


// Carga los manejadores de comandos y eventos

commandHandler(client);

eventHandler(client);


// --- Manejo centralizado de TODAS las interacciones de Discord ---

client.on(Events.InteractionCreate, async interaction => {

// 1. Manejo de comandos de barra (Slash Commands)

if (interaction.isChatInputCommand()) {

const command = client.commands.get(interaction.commandName);


if (!command) {

console.error(`No se encontró un comando que coincida con ${interaction.commandName}.`);

return await interaction.reply({ content: 'Oops! No pude encontrar ese comando. ¿Está bien escrito? 🤔', flags: MessageFlags.Ephemeral });

}


try {

// Deferir la respuesta para que el bot no muestre "La aplicación no responde"

if (!interaction.deferred && !interaction.replied) {

await interaction.deferReply({ flags: MessageFlags.Ephemeral });

}

await command.execute(interaction);


} catch (error) {

console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);

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

// ¡Toda la lógica de customId se mueve a interactionHandler.js!

else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {

// Pasa la interacción y el cliente al manejador de interacciones

await interactionHandler(interaction, client);

}

});


// --- Función para generar el Embed y los componentes del panel de configuración ---

// Mantenemos esta función aquí porque el comando /configurar la usa

// y si config.js no está en el interactionHandler, sería un problema.

// Podrías moverla a utils/ si la usas en muchos sitios, pero por ahora está bien.

async function generateConfigPanelEmbedAndComponents(client, user) {

const configEmbed = new EmbedBuilder()

.setColor(0x3498DB)

.setTitle('⚙️ Panel de Configuración de Caborca Bot')

.setDescription('Aquí puedes ajustar varias configuraciones de tu bot. Selecciona una opción para comenzar.')

.setThumbnail(client.user.displayAvatarURL())

.addFields(

{ name: 'Opciones Principales:', value: 'Usa los botones o el menú para configurar:' },

{ name: '💰 Economía', value: 'Configura roles y montos para comandos de economía como `/give`, `/collect`, `/work`.', inline: true },

{ name: '👥 Roles de Usuario', value: 'Define roles para `No Verificado`, `Ciudadano`, y `Staff`.', inline: true },

{ name: '📝 Canal de Logs', value: 'Establece el canal donde el bot enviará registros.', inline: true },

{ name: '👋 Mensajes de Bienvenida', value: 'Configura mensajes automáticos para nuevos miembros.', inline: true },

{ name: '🎟️ Tickets', value: 'Define la categoría para los canales de tickets.', inline: true },

{ name: '✨ Roles por Uso de Ítem', value: 'Configura qué roles pueden usar ítems de tu tienda.', inline: true },

{ name: '🗑️ Vaciar Configuración', value: 'Borra todas las configuraciones guardadas. ¡Úsalo con precaución!', inline: true },

{ name: '❌ Cerrar Panel', value: 'Cierra esta ventana de configuración.', inline: true },

)

.setTimestamp()

.setFooter({ text: `Solicitado por ${user.tag}`, iconURL: user.displayAvatarURL() });


const rowButtons1 = new ActionRowBuilder()

.addComponents(

new ButtonBuilder().setCustomId('config_economy_btn').setLabel('Economía').setStyle(ButtonStyle.Success),

new ButtonBuilder().setCustomId('config_user_roles_btn').setLabel('Roles de Usuario').setStyle(ButtonStyle.Primary),

new ButtonBuilder().setCustomId('config_logs_channel_btn').setLabel('Canal de Logs').setStyle(ButtonStyle.Primary),

);


const rowButtons2 = new ActionRowBuilder()

.addComponents(

new ButtonBuilder().setCustomId('config_welcome_messages_btn').setLabel('Bienvenida').setStyle(ButtonStyle.Primary),

new ButtonBuilder().setCustomId('config_ticket_channel_btn').setLabel('Tickets').setStyle(ButtonStyle.Primary),

new ButtonBuilder().setCustomId('config_use_item_roles_btn').setLabel('Roles de Ítems').setStyle(ButtonStyle.Primary),

);


const rowButtons3 = new ActionRowBuilder()

.addComponents(

new ButtonBuilder().setCustomId('config_clear_db_btn').setLabel('Vaciar Configuración').setStyle(ButtonStyle.Danger),

new ButtonBuilder().setCustomId('config_exit_btn').setLabel('Cerrar Panel').setStyle(ButtonStyle.Secondary),

);


return {

embeds: [configEmbed],

components: [rowButtons1, rowButtons2, rowButtons3]

};

}



// Sincronizar las bases de datos y luego iniciar el bot

Promise.all([

cedulaSequelize.sync(),

economySequelize.sync(),

configSequelize.sync(),

ServerVote.sync()

])

.then(async () => {

console.log('✅ Todas las bases de datos (Cédulas, Economía, Configuración, Votaciones) sincronizadas con éxito.');

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