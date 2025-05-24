// handlers/eventHandler.js
const fs = require('node:fs');
const path = require('node:path');
const { Events } = require('discord.js'); // Asegúrate de que Events esté importado

module.exports = (client) => {
    const eventsPath = path.join(__dirname, '..', 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        // Solo carga eventos que no sean 'interactionCreate', ya que este se maneja en index.js
        if (event.name !== Events.InteractionCreate) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
                console.log(`[Cargado] Evento: ${event.name} (once)`);
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
                console.log(`[Cargado] Evento: ${event.name}`);
            }
        }
    }
    console.log('--- Eventos cargados con éxito ---');
};