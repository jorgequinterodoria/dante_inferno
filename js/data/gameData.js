/**
 * Game Data
 * Static game data, text content, and configuration in Spanish
 */

export const GameData = {
    // Spanish text content
    text: {
        title: "Inferno Pixelado: La Redención de Dante",
        menu: {
            newGame: "Nuevo Juego",
            continue: "Continuar",
            settings: "Configuración",
            reset: "Reiniciar desde cero"
        },
        objectives: {
            virgilio: "Virgilio:",
            fragments: "Fragmentos:",
            exit: "Salida:",
            pending: "Pendiente",
            found: "Encontrado",
            blocked: "Bloqueada",
            unlocked: "Desbloqueada"
        },
        levels: {
            circle: "Círculo:",
            name: "Nombre:"
        }
    },

    // Game configuration
    config: {
        canvas: {
            width: 800,
            height: 600
        },
        colors: {
            start: "#00FF00",      // Green for start position
            player: "#FF0000",     // Red for Dante
            virgilio: "#800080",   // Purple for Virgilio
            fragment: "#0000FF",   // Blue for fragments
            exit: "#FFA500",       // Orange for exit
            wall: "#8B4513",       // Brown for walls
            path: "#DEB887",       // Beige for paths
            lighting: "#FFD700"    // Gold for lighting effects
        },
        gameplay: {
            defaultFragments: 3,
            startingLevel: 1
        }
    },

    // Level themes and names
    levels: [
        {
            number: 1,
            name: "Bosque Oscuro",
            description: "El comienzo del viaje de Dante"
        }
        // Additional levels will be added in later tasks
    ]
};

export default GameData;