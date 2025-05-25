// handlers/eventHandler.js
const fs = require('node:fs');
const path = require('node:path');
const { Events } = require('discord.js'); // ✅ ¡Asegúrate siempre de importar Events!

module.exports = (client) => {
    const eventsPath = path.join(__dirname, '..', 'events');

    try {
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        if (eventFiles.length === 0) {
            console.warn('⚠️ No se encontraron archivos de eventos en la carpeta "events". ¿Está vacía?');
        }

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            try {
                const event = require(filePath);

                // ⛔️ Excluimos 'interactionCreate' si ya lo manejas en otro lugar (ej. index.js)
                // Si NO lo manejas en otro lugar, borra esta condición 'if'.
                if (event.name === Events.InteractionCreate) {
                    console.log(`⏭️ Evento "${event.name}" omitido: Se espera que sea manejado externamente.`);
                    continue; // Pasa al siguiente archivo
                }

                // ✅ Verificamos que el evento tenga un nombre y una función execute
                if (!event.name || typeof event.execute !== 'function') {
                    console.warn(`⚠️ Advertencia: El evento en "${filePath}" no tiene un nombre o una función "execute" válida. ¡Revisa tu código!`);
                    continue; // Pasa al siguiente archivo
                }

                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                    console.log(`✨ Evento cargado (once): "${event.name}"`);
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                    console.log(`🚀 Evento cargado: "${event.name}"`);
                }
            } catch (error) {
                console.error(`❌ Error al cargar el archivo de evento "${file}":\n`, error);
            }
        }
        console.log('--- 🎉 ¡Todos los eventos han sido cargados con éxito! 🎉 ---');
    } catch (error) {
        console.error(`💥 Error al leer la carpeta de eventos en "${eventsPath}":\n`, error);
        console.error('--- 🚨 ¡La carga de eventos ha fallado críticamente! 🚨 ---');
    }
};