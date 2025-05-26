
    
 // Roles por defecto (Estos serán cargados por `configManager` y pueden ser sobreescritos por la DB)
    defaultUnverifiedRole: null, // ID del rol para miembros no verificados. Ejemplo: '123456789012345678'
    defaultCitizenRole: null,    // ID del rol que se da al registrar cédula. Ejemplo: '123456789012345678'
    defaultStaffRoles: [], // Array de IDs de roles de staff. Ejemplo: ['123456789012345678', '987654321098765432']

    // --- Configuraciones Añadidas para Verificación y Logs ---
    logChannelId: null, // ID del canal de logs donde se enviarán las solicitudes de verificación. Inicialmente null.
    verifiedRoleId: null, // ID del rol que se asignará al usuario una vez verificado. Inicialmente null.
    // --- Fin de Configuraciones Añadidas ---

    // AÑADE ESTA LÍNEA PARA LOS ROLES DE POLICÍA/STAFF CON PERMISO
    // IMPORTANTE: REEMPLAZADO POR LA GESTIÓN DE CONFIGMANAGER.JS
    // Eliminamos ROLES_POLICIA_PERMITIDOS de aquí, ahora se gestionará en la DB a través de configManager.
    // Ya no necesitas esta línea aquí: ROLES_POLICIA_PERMITIDOS: [],

    // Roles por defecto (Estos serán cargados por `configManager` y pueden ser sobreescritos por la DB)
    // Nota: Aunque los roles de policía se gestionen desde el panel, si tu initializeConfigs
    // usa DEFAULT_CONFIG_VALUES, no necesitas duplicarlos aquí.
    defaultUnverifiedRole: null, // ID del rol para miembros no verificados.
    defaultCitizenRole: null,    // ID del rol que se da al registrar cédula.
    defaultStaffRoles: [],       // Array de IDs de roles de staff

    // Configuración por defecto para los comandos de economía (Pueden ser sobreescritos por la DB)
    defaultGiveCommandRoles: [], // Roles que pueden usar el comando /give (IDs de roles)
    defaultCollect: {
        amount: 10000,
        cooldown: 3600000, // 1 hora en milisegundos
        roles: [], // Roles que pueden usar el comando /collect (IDs de roles)
    },
    defaultWork: {
        minAmount: 500000,
        maxAmount: 200000000,
        cooldown: 14400000, // 4 horas en milisegundos
        roles: [], // Roles que pueden usar el comando /work (IDs de roles)
    },

    // Configuración para la Tienda y Roles por Item (estos ítems son estáticos y se quedan aquí)
    shop: {
        items: [
            // --- VEHÍCULOS CIVILES (¡Con más de 74 opciones para el camino! 🚗💨) ---
            // Asegúrate de rellenar los 'roleId' y 'imageUrl' con valores reales o placeholders si los necesitas para la lógica.
            { id: 'chevlon_antelope_1994', name: 'Chevlon Antelope 1994 👴🚗', price: 18000, category: 'Vehículos Civiles', description: 'Un clásico confiable para el día a día. ¡Ideal para empezar!', roleId: 'ID_ROL_VEHICULO_ANTELOPE', imageUrl: 'https://i.imgur.com/example_antelope.png' },
            { id: 'ford_raptor_2020', name: 'Ford Raptor 2020 🚚💪', price: 55000, category: 'Vehículos Civiles', description: 'Potente camioneta para el desierto y el trabajo pesado. ¡Nada la detiene!', roleId: 'ID_ROL_VEHICULO_RAPTOR', imageUrl: 'https://i.imgur.com/example_raptor.png' },
            { id: 'dodge_charger_srt_2022', name: 'Dodge Charger SRT 2022 🏎️💨', price: 85000, category: 'Vehículos Civiles', description: 'Deportivo muscular con gran velocidad y presencia. ¡Siente la adrenalina!', roleId: 'ID_ROL_VEHICULO_CHARGER', imageUrl: 'https://i.imgur.com/example_charger.png' },
            { id: 'honda_civic_hatchback_2021', name: 'Honda Civic Hatchback 2021 Hatchback', price: 28000, category: 'Vehículos Civiles', description: 'Compacto, eficiente y ágil para la ciudad. ¡Perfecto para moverte sin líos!', roleId: 'ID_ROL_VEHICULO_CIVIC', imageUrl: 'https://i.imgur.com/example_civic.png' },
            { id: 'gmc_sierra_3500hd', name: 'GMC Sierra 3500HD 🚜🏗️', price: 65000, category: 'Vehículos Civiles', description: 'Camioneta robusta para las tareas más exigentes. ¡Lleva lo que necesites!', roleId: 'ID_ROL_VEHICULO_SIERRA', imageUrl: 'https://i.imgur.com/example_sierra.png' },
            { id: 'tesla_model_x_2023', name: 'Tesla Model X 2023 ⚡🚘', price: 110000, category: 'Vehículos Civiles', description: 'SUV eléctrico de lujo con tecnología avanzada. ¡El futuro está aquí!', roleId: 'ID_ROL_VEHICULO_TESLA_X', imageUrl: 'https://i.imgur.com/example_teslax.png' },
            { id: 'strugatti_ettore_2020', name: 'Strugatti Ettore 2020 🌟🏎️', price: 150000, category: 'Vehículos Civiles', description: 'Exótico superdeportivo, máximo lujo y velocidad. ¡Para los más exigentes!', roleId: 'ID_ROL_VEHICULO_ETTORE', imageUrl: 'https://i.imgur.com/example_strugatti.png' },
            { id: 'toyota_camry_2019', name: 'Toyota Camry 2019 👨‍👩‍👧‍👦 Sedán', price: 32000, category: 'Vehículos Civiles', description: 'Sedán confiable y popular. ¡Un compañero fiel en la carretera!', roleId: 'ID_ROL_VEHICULO_CAMRY', imageUrl: 'https://i.imgur.com/example_camry.png' },
            { id: 'jeep_wrangler_unlimited_2021', name: 'Jeep Wrangler Unlimited 2021 ⛰️🚗', price: 45000, category: 'Vehículos Civiles', description: 'Todoterreno icónico para aventuras off-road. ¡Explora sin límites!', roleId: 'ID_ROL_VEHICULO_WRANGLER', imageUrl: 'https://i.imgur.com/example_wrangler.png' },
            { id: 'porsche_911_carrera_2023', name: 'Porsche 911 Carrera 2023 🏁🔥', price: 130000, category: 'Vehículos Civiles', description: 'Deportivo legendario con rendimiento y estilo inigualables. ¡Pura velocidad!', roleId: 'ID_ROL_VEHICULO_PORSCHE', imageUrl: 'https://i.imgur.com/example_porsche.png' },
            { id: 'mercedes_benz_c_class_2022', name: 'Mercedes-Benz C-Class 2022 💼🚘', price: 58000, category: 'Vehículos Civiles', description: 'Sedán de lujo con elegancia y tecnología alemana. ¡Viaja con confort!', roleId: 'ID_ROL_VEHICULO_MERCEDES_C', imageUrl: 'https://i.imgur.com/example_mercedesc.png' },
            { id: 'bmw_x5_2023', name: 'BMW X5 2023 🏞️SUV', price: 70000, category: 'Vehículos Civiles', description: 'SUV de lujo deportivo y versátil. ¡Espacio y potencia para toda la familia!', roleId: 'ID_ROL_VEHICULO_BMW_X5', imageUrl: 'https://i.imgur.com/example_bmwx5.png' },
            { id: 'audi_a4_2021', name: 'Audi A4 2021 ✒️🚘', price: 42000, category: 'Vehículos Civiles', description: 'Sedán premium con diseño sofisticado y gran manejo. ¡Disfruta cada viaje!', roleId: 'ID_ROL_VEHICULO_AUDI_A4', imageUrl: 'https://i.imgur.com/example_audia4.png' },
            { id: 'volkswagen_golf_gti_2022', name: 'Volkswagen Golf GTI 2022 🏎️💨', price: 35000, category: 'Vehículos Civiles', description: 'Hatchback deportivo y ágil. ¡Diversión garantizada en cada curva!', roleId: 'ID_ROL_VEHICULO_GOLF_GTI', imageUrl: 'https://i.imgur.com/example_golfgti.png' },
            { id: 'subaru_wrx_sti_2021', name: 'Subaru WRX STI 2021 랠리🏎️', price: 40000, category: 'Vehículos Civiles', description: 'Rally car de calle con tracción total. ¡Control total en cualquier terreno!', roleId: 'ID_ROL_VEHICULO_STI', imageUrl: 'https://i.imgur.com/example_sti.png' },
            { id: 'ford_mustang_gt_2022', name: 'Ford Mustang GT 2022 🐎🔥', price: 50000, category: 'Vehículos Civiles', description: 'Clásico muscle car americano con un potente motor V8. ¡El rugido del asfalto!', roleId: 'ID_ROL_VEHICULO_MUSTANG', imageUrl: 'https://i.imgur.com/example_mustang.png' },
            { id: 'chevrolet_camaro_ss_2022', name: 'Chevrolet Camaro SS 2022 🦁🏎️', price: 52000, category: 'Vehículos Civiles', description: 'Icono del muscle car, rendimiento y diseño agresivo. ¡Dominio en la calle!', roleId: 'ID_ROL_VEHICULO_CAMARO', imageUrl: 'https://i.imgur.com/example_camaross.png' },
            { id: 'nissan_gtr_r35_2023', name: 'Nissan GT-R R35 2023 🐉🏎️', price: 120000, category: 'Vehículos Civiles', description: 'Superdeportivo japonés con tecnología de vanguardia y velocidad extrema. ¡Godzilla!', roleId: 'ID_ROL_VEHICULO_GTR', imageUrl: 'https://i.imgur.com/example_gtr.png' },
            { id: 'mazda_mx5_miata_2022', name: 'Mazda MX-5 Miata 2022 🌸 convertible', price: 30000, category: 'Vehículos Civiles', description: 'Roadster ligero y divertido de conducir. ¡Perfecto para sentir el viento!', roleId: 'ID_ROL_VEHICULO_MIATA', imageUrl: 'https://i.imgur.com/example_miata.png' },
            { id: 'hyundai_elantra_n_2023', name: 'Hyundai Elantra N 2023 🏁💨', price: 33000, category: 'Vehículos Civiles', description: 'Sedán deportivo sorprendentemente potente y ágil. ¡No subestimes su tamaño!', roleId: 'ID_ROL_VEHICULO_ELANTRA_N', imageUrl: 'https://i.imgur.com/example_elantran.png' },
            { id: 'kia_stinger_gt_2022', name: 'Kia Stinger GT 2022 🐅💨', price: 48000, category: 'Vehículos Civiles', description: 'Sedán gran turismo con diseño elegante y motor potente. ¡Estilo y velocidad!', roleId: 'ID_ROL_VEHICULO_STINGER', imageUrl: 'https://i.imgur.com/example_stinger.png' },
            { id: 'polaris_slingshot', name: 'Polaris Slingshot 🏍️💨', price: 35000, category: 'Vehículos Civiles', description: 'Vehículo de tres ruedas para una experiencia de conducción única. ¡Atrévete!', roleId: 'ID_ROL_VEHICULO_SLINGSHOT', imageUrl: 'https://i.imgur.com/example_slingshot.png' },
            { id: 'can_am_ryker', name: 'Can-Am Ryker 🛵💨', price: 15000, category: 'Vehículos Civiles', description: 'Motocicleta de tres ruedas, ligera y fácil de manejar. ¡Libertad en dos ruedas (y una más)!', roleId: 'ID_ROL_VEHICULO_RYKER', imageUrl: 'https://i.imgur.com/example_ryker.png' },
            // ... (rest of your shop items)

            // --- ARMAS CIVILES ---
            { id: 'pistola_9mm_replica', name: 'Pistola 9mm (Réplica) 🔫', price: 1500, category: 'Armas Civiles', description: 'Réplica de pistola para defensa personal en rol. ¡Mantén la calma!', roleId: 'ID_ROL_LICENCIA_ARMA_B', imageUrl: 'https://i.imgur.com/example_pistol.png' },
            { id: 'escopeta_caza_replica', name: 'Escopeta de Caza (Réplica) 🏹', price: 3000, category: 'Armas Civiles', description: 'Ideal para la caza de coyotes en el desierto (en rol). ¡Puntería al máximo!', roleId: 'ID_ROL_LICENCIA_ARMA_B1', imageUrl: 'https://i.imgur.com/example_shotgun.png' },
            { id: 'ak47_replica', name: 'AK-47 (Réplica) 💣', price: 10000, category: 'Armas Civiles', description: 'Réplica de fusil de asalto para rol de combate civil o colección. ¡Imponente!', roleId: 'ID_ROL_LICENCIA_ARMA_A', imageUrl: 'https://i.imgur.com/example_ak47.png' },
            { id: 'revolver_357', name: 'Revólver .357 (Réplica) 🔫', price: 2500, category: 'Armas Civiles', description: 'Potente revólver para rol. ¡Impacto garantizado!', roleId: 'ID_ROL_LICENCIA_ARMA_B', imageUrl: 'https://i.imgur.com/example_revolver.png' },
            { id: 'mp5_replica', name: 'MP5 (Réplica) 🔫', price: 8000, category: 'Armas Civiles', description: 'Subfusil compacto, ideal para rol táctico. ¡Movilidad y fuego rápido!', roleId: 'ID_ROL_LICENCIA_ARMA_A', imageUrl: 'https://i.imgur.com/example_mp5.png' },
            { id: 'sniper_rifle_replica', name: 'Rifle de Francotirador (Réplica) 🎯', price: 12000, category: 'Armas Civiles', description: 'Para rol de tirador de élite. ¡Precisión a larga distancia!', roleId: 'ID_ROL_LICENCIA_ARMA_A', imageUrl: 'https://i.imgur.com/example_sniper.png' },

            // --- ARTÍCULOS VARIOS / CONSUMIBLES ---
            { id: 'kit_primeros_auxilios', name: 'Kit de Primeros Auxilios ⚕️', price: 200, category: 'Artículos Varios', description: 'Un kit esencial para emergencias menores. ¡Salva vidas en rol!', roleId: null, imageUrl: 'https://i.imgur.com/example_firstaid.png' },
            { id: 'radiocomunicador_civil', name: 'Radiocomunicador Civil 📻', price: 800, category: 'Artículos Varios', description: 'Para comunicarte en la frecuencia civil del condado. ¡Mantente conectado!', roleId: 'ID_ROL_CIVIL_ITEM', imageUrl: 'https://i.imgur.com/example_radio.png' },
            { id: 'kit_reparacion_vehiculo', name: 'Kit de Reparación de Vehículo 🛠️', price: 500, category: 'Artículos Varios', description: 'Permite reparaciones básicas en vehículos. ¡No te quedes tirado!', roleId: 'ID_ROL_CIVIL_ITEM', imageUrl: 'https://i.imgur.com/example_repairkit.png' },
            { id: 'mochila_mediana', name: 'Mochila Mediana 🎒', price: 300, category: 'Artículos Varios', description: 'Aumenta tu capacidad de carga en rol. ¡Lleva más cosas contigo!', roleId: null, imageUrl: 'https://i.imgur.com/example_backpack.png' },
            { id: 'linterna_tactica', name: 'Linterna Táctica 🔦', price: 150, category: 'Artículos Varios', description: 'Ilumina tu camino en la oscuridad. ¡Esencial para exploración nocturna!', roleId: null, imageUrl: 'https://i.imgur.com/example_flashlight.png' },
            { id: 'caja_herramientas', name: 'Caja de Herramientas 🧰', price: 750, category: 'Artículos Varios', description: 'Para reparaciones más complejas o trabajos manuales en rol. ¡Sé un manitas!', roleId: 'ID_ROL_CIVIL_ITEM', imageUrl: 'https://i.imgur.com/example_toolbox.png' },
            { id: 'kit_de_exploracion', name: 'Kit de Exploración 🗺️', price: 600, category: 'Artículos Varios', description: 'Brújula, mapa y cuerdas para tus aventuras. ¡No te pierdas en el desierto!', roleId: null, imageUrl: 'https://i.imgur.com/example_explorationkit.png' },
            { id: 'botella_agua_purificada', name: 'Botella de Agua Purificada 💧', price: 50, category: 'Artículos Varios', description: 'Hidratación esencial para el rol. ¡Mantente fresco en Caborca!', roleId: null, imageUrl: 'https://i.imgur.com/example_water.png' },
            { id: 'raciones_emergencia', name: 'Raciones de Emergencia 🥫', price: 75, category: 'Artículos Varios', description: 'Comida básica para sobrevivir en situaciones críticas. ¡Nunca te quedes sin energía!', roleId: null, imageUrl: 'https://i.imgur.com/example_rations.png' },

            // --- LICENCIAS ---
            { id: 'licencia_conduccion_b', name: 'Licencia de Conducción Tipo B 🚗📜', price: 1000, category: 'Licencias', description: 'Permite conducir vehículos civiles básicos (autos, camionetas). ¡A rodar!', roleId: 'ID_ROL_LICENCIA_CONDUCCION_B', imageUrl: 'https://i.imgur.com/example_licenseb.png' },
            { id: 'licencia_conduccion_c', name: 'Licencia de Conducción Tipo C 🚛📜', price: 2500, category: 'Licencias', description: 'Permite conducir vehículos comerciales y pesados (camiones, buses). ¡Para los más grandes!', roleId: 'ID_ROL_LICENCIA_CONDUCCION_C', imageUrl: 'https://i.imgur.com/example_licensec.png' },
            { id: 'licencia_arma_tipo_b', name: 'Licencia de Armas Tipo B 🔫📜', price: 5000, category: 'Licencias', description: 'Permite poseer armas de fuego cortas (réplicas) para defensa personal en rol. ¡Seguro y legal!', roleId: 'ID_ROL_LICENCIA_ARMA_B', imageUrl: 'https://i.imgur.com/example_arma_b.png' },
            { id: 'licencia_arma_tipo_b1', name: 'Licencia de Armas Tipo B1 🎯📜', price: 7500, category: 'Licencias', description: 'Permite poseer armas de fuego largas (réplicas) para caza o uso deportivo en rol. ¡Precisión garantizada!', roleId: 'ID_ROL_LICENCIA_ARMA_B1', imageUrl: 'https://i.imgur.com/example_arma_b1.png' },
            { id: 'licencia_arma_tipo_a', name: 'Licencia de Armas Tipo A 💥📜', price: 15000, category: 'Licencias', description: 'Permite poseer armas de fuego de asalto (réplicas) para colección o eventos especiales en rol. ¡Solo para expertos!', roleId: 'ID_ROL_LICENCIA_ARMA_A', imageUrl: 'https://i.imgur.com/example_arma_a.png' },
            { id: 'licencia_negocio', name: 'Licencia de Negocio 🏢📜', price: 20000, category: 'Licencias', description: 'Permite establecer y operar un negocio en el condado. ¡Crea tu imperio!', roleId: 'ID_ROL_LICENCIA_NEGOCIO', imageUrl: 'https://i.imgur.com/example_business.png' },
            { id: 'licencia_pesca', name: 'Licencia de Pesca 🎣📜', price: 500, category: 'Licencias', description: 'Autoriza la pesca recreativa en las aguas de Caborca. ¡Atrapa el más grande!', roleId: 'ID_ROL_LICENCIA_PESCA', imageUrl: 'https://i.imgur.com/example_fishing.png' },
            { id: 'licencia_caza', name: 'Licencia de Caza 🦌📜', price: 1000, category: 'Licencias', description: 'Necesaria para la caza legal en zonas designadas. ¡Sé un cazador responsable!', roleId: 'ID_ROL_LICENCIA_CAZA', imageUrl: 'https://i.imgur.com/example_hunting.png' },
        ],
        defaultUseItemAllowedRoles: [], // Roles que pueden usar items. Se configurará dinámicamente.
    },

    // Canal donde se crearán los tickets (puedes dejarlo aquí o pasarlo a DB si lo quieres configurar por comando)
    ticketCategoryChannelId: null, // ID de tu canal de categoría de tickets.
    
    // URLs de imágenes y color de embed
    botLogoUrl: 'https://media.discordapp.net/attachments/1143633568325697658/1375608418328383498/Captura_de_pantalla_2025-05-20_12-23-53.png?ex=68324eac&is=6830fd2c&hm=aa33b98eb26295483f4fb0e46f7236c696f8dffb103d4035b74d844886ac6b47&=&format=webp&quality=lossless',
    serverBannerUrl: 'https://images-ext-1.discordapp.net/external/HJGk8-nR_-EZTsLbTk4_lHlvvHu7lqML1on1XyEr-zM/%3Fsize%3D2048/https/cdn.discordapp.com/banners/1331832594463199333/d3413b04f1a78add6ab97c38d0e73fcc.png?format=webp&quality=lossless',
    embedColor: '#DEA150',


    
};

