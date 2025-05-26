// events/ready.js
const { Events } = require('discord.js');
const { REST, Routes } = require('discord.js'); // Necesitarás esto si quieres registrar aquí
const { clientId, token } = require('../config'); // Asegúrate de tener clientId y token

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) { // Marca como async para usar await
        console.log(`✅ ¡Bot listo! Logueado como ${client.user.tag}`);

        // --- Lógica de despliegue de comandos (si la necesitas aquí) ---
        // ESTO SOLO SI NO USAS deploy-commands.js APARTE O QUIERES HACERLO AQUÍ
        /*
        try {
            console.log(`🚀 Intentando desplegar ${client.commands.size} comandos globales desde ready.js.`);
            const rest = new REST().setToken(token);
            const commandsJSON = client.commands.map(command => command.data.toJSON()); // Ahora sí, funciona porque client.commands es Collection
            const data = await rest.put(
                Routes.applicationCommands(clientId), // applicationCommands para comandos globales
                { body: commandsJSON },
            );
            console.log(`✅ Se recargaron con éxito ${data.length} comandos globales.`);
        } catch (error) {
            console.error('❌ Error al registrar comandos globales en ready.js:', error);
        }
        */
        // --- FIN de la lógica de despliegue ---

        // Tu lógica de estado rotativo
        function setRandomStatus() {
            const botStatuses = [
                { type: client.ActivityType.Playing, name: '🎮 Caborca RolePlay' },
                { type: client.ActivityType.Watching, name: '👀 Configurado por Achitodev' },
                { type: client.ActivityType.Listening, name: '🎧 Update 1.0' },
                { type: client.ActivityType.Custom, name: '🌐 https://discord.gg/qnps457Uzk' }
            ];
            let currentStatusIndex = 0; // O si ya lo tienes definido globalmente, úsalo

            const status = botStatuses[currentStatusIndex];
            if (status.type === client.ActivityType.Custom) {
                client.user.setPresence({ activities: [{ name: status.name, type: client.ActivityType.Custom }], status: 'online' });
            } else {
                client.user.setPresence({ activities: [{ name: status.name, type: status.type }], status: 'online' });
            }
            currentStatusIndex = (currentStatusIndex + 1) % botStatuses.length;
        }

        // Ya tienes esta parte en index.js, asegúrate de no duplicarla
        // setRandomStatus();
        // setInterval(setRandomStatus, 10000);
    },
};