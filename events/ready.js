// events/ready.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true, // Esto asegura que solo se ejecute una vez al inicio
    async execute(client) {
        console.log(`🚀 ¡Listo! Conectado como ${client.user.tag}!`);

        // Establecer el estado del bot (opcional pero bueno para la UX)
        client.user.setActivity('tus comandos', { type: 'LISTENING' });

        // ✅ Optimización: Registrar comandos globales si no lo haces en otro lado
        // Esto solo es necesario si tienes comandos globales que deben actualizarse.
        // Si usas un script separado para el despliegue de comandos, puedes omitir esto.
        try {
            // Ejemplo de cómo obtener y registrar comandos de tu colección
            const commandsData = client.commands.map(command => command.data.toJSON());
            await client.application.commands.set(commandsData);
            console.log('✨ Comandos de barra (/) registrados globalmente.');
        } catch (error) {
            console.error('❌ Error al registrar comandos globales:', error);
        }

        console.log('✅ Bot inicializado y listo para recibir interacciones.');
    },
};