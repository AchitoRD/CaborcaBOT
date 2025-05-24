// utils/cooldownManager.js
const cooldowns = new Map();

// Función para obtener el cooldown restante
function getRemainingCooldown(userId, commandName, cooldownTime) {
    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
    }

    const userCooldowns = cooldowns.get(commandName);
    const now = Date.now();

    if (userCooldowns.has(userId)) {
        const expirationTime = userCooldowns.get(userId) + cooldownTime;
        if (now < expirationTime) {
            return expirationTime - now; // Retorna tiempo restante
        }
    }
    return 0; // No hay cooldown o ya expiró
}

// Función para establecer un cooldown
function setCooldown(userId, commandName, cooldownTime) {
    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
    }
    const userCooldowns = cooldowns.get(commandName);
    userCooldowns.set(userId, Date.now());
    // Limpia el cooldown después de que expire para no acumular datos
    setTimeout(() => userCooldowns.delete(userId), cooldownTime);
}

module.exports = {
    getRemainingCooldown,
    setCooldown,
};