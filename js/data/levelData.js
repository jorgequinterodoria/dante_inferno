/**
 * Level Data
 * Configuration data for each circle of hell
 * Requirements: 4.1, 4.2, 4.3 - Progressive difficulty and level themes
 */

export const LevelData = {
    1: {
        name: "Bosque Oscuro",
        description: "El comienzo del viaje de Dante",
        circle: "Antesala del Infierno",
        mazeSize: { width: 15, height: 15 },
        difficulty: 1,
        requiredFragments: 3,
        hasVirgilio: true,
        theme: {
            backgroundColor: "#2d1810",
            wallColor: "#8B4513",
            pathColor: "#DEB887",
            lightingColor: "#FFD700",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Te encuentras perdido en un bosque oscuro, donde la recta vía era perdida...",
            virgilioDialogue: "Yo soy Virgilio, el poeta que te guiará en este viaje a través del Infierno.",
            completion: "Has encontrado a tu guía. Ahora comienza el verdadero descenso al Infierno."
        }
    },
    2: {
        name: "Limbo",
        description: "Primer Círculo del Infierno",
        circle: "Primer Círculo",
        mazeSize: { width: 18, height: 18 },
        difficulty: 2,
        requiredFragments: 4,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#404040",
            wallColor: "#606060",
            pathColor: "#C0C0C0",
            lightingColor: "#E6E6FA",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Entras al Limbo, donde las almas virtuosas pero no bautizadas esperan eternamente.",
            completion: "Has atravesado el Limbo. Los verdaderos tormentos te esperan más adelante."
        }
    },
    3: {
        name: "Lujuria",
        description: "Segundo Círculo del Infierno",
        circle: "Segundo Círculo",
        mazeSize: { width: 21, height: 21 },
        difficulty: 3,
        requiredFragments: 5,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#4B0000",
            wallColor: "#8B0000",
            pathColor: "#CD5C5C",
            lightingColor: "#FF69B4",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Los vientos eternos arrastran a los lujuriosos en un torbellino sin fin.",
            completion: "Has resistido los vientos de la lujuria y continúas tu descenso."
        }
    },
    4: {
        name: "Gula",
        description: "Tercer Círculo del Infierno",
        circle: "Tercer Círculo",
        mazeSize: { width: 24, height: 24 },
        difficulty: 4,
        requiredFragments: 6,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#2F4F2F",
            wallColor: "#556B2F",
            pathColor: "#9ACD32",
            lightingColor: "#ADFF2F",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Cerbero, el guardián de tres cabezas, vigila a los glotones bajo la lluvia eterna.",
            completion: "Has superado la gula y sus tormentos. El camino se vuelve más traicionero."
        }
    },
    5: {
        name: "Avaricia e Ira",
        description: "Cuarto Círculo del Infierno",
        circle: "Cuarto Círculo",
        mazeSize: { width: 27, height: 27 },
        difficulty: 5,
        requiredFragments: 7,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#B8860B",
            wallColor: "#DAA520",
            pathColor: "#FFD700",
            lightingColor: "#FFFF00",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Los avaros y los pródigos chocan eternamente, empujando enormes pesos.",
            completion: "Has presenciado la futilidad de la avaricia. La laguna Estigia te espera."
        }
    },
    6: {
        name: "Ciudad de Dite",
        description: "Quinto y Sexto Círculo del Infierno",
        circle: "Quinto y Sexto Círculo",
        mazeSize: { width: 30, height: 30 },
        difficulty: 6,
        requiredFragments: 8,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#8B0000",
            wallColor: "#A0522D",
            pathColor: "#CD853F",
            lightingColor: "#FF4500",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Las murallas ardientes de la Ciudad de Dite se alzan ante ti, guardando a los herejes.",
            completion: "Has atravesado la Ciudad de Dite. Los círculos más profundos te aguardan."
        }
    },
    7: {
        name: "Violencia",
        description: "Séptimo Círculo del Infierno",
        circle: "Séptimo Círculo",
        mazeSize: { width: 33, height: 33 },
        difficulty: 7,
        requiredFragments: 9,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#800000",
            wallColor: "#A52A2A",
            pathColor: "#DC143C",
            lightingColor: "#FF0000",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "El río de sangre hirviente castiga a los violentos, vigilados por centauros.",
            completion: "Has superado los tres anillos de la violencia. El abismo final se acerca."
        }
    },
    8: {
        name: "Fraude",
        description: "Octavo Círculo del Infierno - Malebolge",
        circle: "Octavo Círculo",
        mazeSize: { width: 36, height: 36 },
        difficulty: 8,
        requiredFragments: 10,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#2F2F2F",
            wallColor: "#696969",
            pathColor: "#A9A9A9",
            lightingColor: "#FF6347",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "Malebolge se extiende ante ti: diez fosas concéntricas donde sufren los fraudulentos.",
            completion: "Has atravesado las diez fosas del fraude. Solo queda el círculo final."
        }
    },
    9: {
        name: "Traición",
        description: "Noveno Círculo del Infierno - El Cocito",
        circle: "Noveno Círculo",
        mazeSize: { width: 39, height: 39 },
        difficulty: 9,
        requiredFragments: 12,
        hasVirgilio: false,
        theme: {
            backgroundColor: "#191970",
            wallColor: "#4169E1",
            pathColor: "#87CEEB",
            lightingColor: "#00BFFF",
            playerColor: "#FF0000",
            virgilioColor: "#800080",
            fragmentColor: "#0000FF",
            exitColor: "#FFA500"
        },
        narrative: {
            intro: "El lago helado del Cocito se extiende ante ti. Aquí yacen los traidores, congelados para la eternidad.",
            completion: "Has completado tu viaje a través del Infierno. La redención te espera."
        }
    }
};

/**
 * Get level configuration by number
 * @param {number} levelNumber - Level number (1-9)
 * @returns {Object|null} - Level configuration or null if not found
 */
export function getLevelConfig(levelNumber) {
    return LevelData[levelNumber] || null;
}

/**
 * Get maximum level number
 * @returns {number} - Maximum available level
 */
export function getMaxLevel() {
    return Math.max(...Object.keys(LevelData).map(Number));
}

/**
 * Check if level exists
 * @param {number} levelNumber - Level number to check
 * @returns {boolean} - True if level exists
 */
export function levelExists(levelNumber) {
    return LevelData.hasOwnProperty(levelNumber);
}

/**
 * Get all level names for UI display
 * @returns {Array} - Array of level objects with number and name
 */
export function getAllLevelNames() {
    return Object.entries(LevelData).map(([number, data]) => ({
        number: parseInt(number),
        name: data.name,
        circle: data.circle,
        description: data.description
    }));
}

export default LevelData;