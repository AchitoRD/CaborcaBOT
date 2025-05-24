// utils/configManager.js
const Config = require('../models/Config'); // Importa tu modelo de configuración

// Valores por defecto para la configuración. ¡Definiremos TODOS aquí!
const DEFAULT_CONFIG_VALUES = {
    defaultGiveCommandRoles: [],
    collectConfig: { amount: 15000, cooldown: 3600000, roles: [] }, // 1 hora
    workConfig: { minAmount: 500000, maxAmount: 200000000, cooldown: 14400000, roles: [] }, // 4 horas
    unverifiedRole: '', // ID del rol "No Verificado". ¡Cambiado de null a cadena vacía!
    citizenRole: '',    // ID del rol "Ciudadano". ¡Cambiado de null a cadena vacía!
    staffRoles: [],     // Array de IDs de roles de staff (ya estaba bien)
    logChannelId: '',   // ID del canal de logs. ¡Cambiado de null a cadena vacía!
    welcomeMessagesEnabled: false,
    welcomeChannelId: '', // ID del canal de bienvenida. ¡Cambiado de null a cadena vacía!
    welcomeMessageText: '¡Bienvenido {member} a nuestro servidor!',
    ticketCategoryChannelId: '', // ID de la categoría de tickets. ¡Cambiado de null a cadena vacía!
    useItemAllowedRoles: [],    // Roles permitidos para usar ítems (ya estaba bien)
};

// Caché para las configuraciones cargadas
const configCache = new Map();

/**
 * Carga o recarga una configuración específica desde la DB.
 * @param {string} key La clave de la configuración a cargar.
 * @returns {Promise<any | undefined>} El valor de la configuración o undefined si no se encuentra.
 */
async function loadConfigFromDb(key) {
    try {
        const configEntry = await Config.findByPk(key);
        if (configEntry) {
            configCache.set(key, configEntry.value);
            return configEntry.value;
        }
    } catch (error) {
        console.error(`Error al cargar configuración "${key}" desde la DB:`, error);
    }
    return undefined; // Retorna undefined si no se encuentra o hay error
}

/**
 * Guarda un valor de configuración en la DB.
 * @param {string} key La clave de la configuración a guardar.
 * @param {any} value El valor a guardar.
 * @returns {Promise<boolean>} True si se guardó correctamente, false en caso de error.
 */
async function saveConfig(key, value) {
    try {
        // Asegúrate de que el valor no sea `undefined` si estás guardando una nueva configuración
        const valueToSave = value !== undefined ? value : DEFAULT_CONFIG_VALUES[key];

        const [configEntry, created] = await Config.findOrCreate({
            where: { key: key },
            defaults: { value: valueToSave }
        });
        if (!created) {
            configEntry.value = valueToSave;
            await configEntry.save();
        }
        configCache.set(key, valueToSave); // Actualiza la caché
        return true;
    } catch (error) {
        console.error(`Error al guardar configuración "${key}" en la DB:`, error);
        return false;
    }
}

/**
 * Obtiene un valor de configuración. Prioriza la caché, luego la DB, y finalmente los valores por defecto.
 * @param {string} key La clave de la configuración a obtener.
 * @returns {Promise<any>} El valor de la configuración.
 */
async function getConfig(key) {
    // Si la clave no está en la caché, intenta cargarla desde la DB
    if (!configCache.has(key)) {
        await loadConfigFromDb(key);
    }

    // Si aún no está en caché (no se encontró en DB), usa el valor por defecto
    const value = configCache.has(key) ? configCache.get(key) : DEFAULT_CONFIG_VALUES[key];

    return value;
}


/**
 * Inicializa las configuraciones por defecto en la base de datos si no existen.
 * Esto asegura que haya un registro para cada valor por defecto al iniciar el bot.
 */
async function initializeConfigs() {
    console.log('Iniciando verificación e inicialización de configuraciones por defecto...');
    for (const key in DEFAULT_CONFIG_VALUES) {
        if (DEFAULT_CONFIG_VALUES.hasOwnProperty(key)) {
            // Asegúrate de que el valor a guardar no sea `null` o `undefined`
            let defaultValue = DEFAULT_CONFIG_VALUES[key];
            if (defaultValue === null || defaultValue === undefined) {
                // Decide qué valor predeterminado usar si es null o undefined,
                // por ejemplo, una cadena vacía para IDs de canales/roles, o un array vacío.
                if (key.includes('Role') || key.includes('ChannelId')) {
                    defaultValue = '';
                } else if (Array.isArray(defaultValue)) {
                    defaultValue = [];
                } else {
                    defaultValue = ''; // Valor por defecto general si no es un tipo específico
                }
            }
            // Intenta encontrar o crear el registro.
            // Si ya existe, su 'value' no se actualizará a menos que no exista.
            const [config, created] = await Config.findOrCreate({
                where: { key: key },
                defaults: { value: defaultValue }, // Usamos el valor por defecto ya "sanitizado"
            });
            if (created) {
                console.log(`Configuración '${key}' inicializada con valor por defecto.`);
            } else {
                // Si no fue creado, cárgalo en la caché para asegurar que esté disponible
                configCache.set(key, config.value);
            }
        }
    }
    console.log('Verificación e inicialización de configuraciones por defecto completada.');
}

/**
 * Borra todas las configuraciones de la base de datos y resetea la caché.
 * @returns {Promise<void>}
 */
async function clearAllConfigs() {
    try {
        await Config.destroy({ truncate: true }); // Borra todos los registros y resetea auto-incrementos
        configCache.clear(); // Limpia la caché también
        console.log('✅ Todas las configuraciones de la base de datos han sido borradas y la caché limpiada.');
    } catch (error) {
        console.error('❌ Error al borrar todas las configuraciones:', error);
        throw error; // Re-lanza el error para que pueda ser manejado por el llamador
    }
}

module.exports = {
    getConfig,
    saveConfig,
    initializeConfigs,
    clearAllConfigs,
};