/**
 * Color System for Inferno Pixelado
 * Defines all colors used in the game with pixel art styling
 */

// Game element colors as specified in requirements 7.4
export const GAME_COLORS = {
    // Player and entities
    PLAYER: '#FF0000',           // 🔴 Red for Dante (player)
    VIRGILIO: '#800080',         // 🟪 Purple for Virgilio
    FRAGMENT: '#0000FF',         // 🟦 Blue for fragments
    START: '#00FF00',            // 🟩 Green for start position
    EXIT: '#FFA500',             // 🟧 Orange for exit
    
    // Maze elements
    WALL: '#8B4513',             // Brown walls
    WALL_BORDER: '#654321',      // Darker brown for wall borders
    PATH: '#DEB887',             // Light brown for walkable paths
    
    // UI colors
    UI_TEXT: '#FFD700',          // Gold for UI text
    UI_BACKGROUND: '#2d1810',    // Dark brown background
    UI_ACCENT: '#8B0000',        // Dark red for accents
    
    // Status colors
    STATUS_PENDING: '#FFFF00',   // Yellow for pending objectives
    STATUS_COMPLETE: '#00FF00',  // Green for completed objectives
    STATUS_BLOCKED: '#FF0000',   // Red for blocked/locked items
    
    // Lighting and effects
    LIGHT_GOLD: '#FFD700',       // Golden light around player
    LIGHT_WARM: '#FFA500',       // Warm ambient light
    SHADOW: '#1a0f08',           // Dark shadows
    
    // Level themes (for different circles of hell)
    THEME_FOREST: {
        background: '#2d1810',
        wall: '#8B4513',
        path: '#DEB887',
        accent: '#228B22'
    },
    THEME_LIMBO: {
        background: '#2F2F2F',
        wall: '#696969',
        path: '#D3D3D3',
        accent: '#4169E1'
    },
    THEME_LUST: {
        background: '#4B0000',
        wall: '#8B0000',
        path: '#CD5C5C',
        accent: '#FF1493'
    },
    THEME_GLUTTONY: {
        background: '#2F4F2F',
        wall: '#556B2F',
        path: '#9ACD32',
        accent: '#ADFF2F'
    }
};

// Color utility functions
export class ColorUtils {
    /**
     * Convert hex color to RGB values
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert RGB to hex color
     */
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Create RGBA color string with alpha
     */
    static withAlpha(hexColor, alpha) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return hexColor;
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    /**
     * Darken a color by a percentage
     */
    static darken(hexColor, percent) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return hexColor;
        
        const factor = 1 - (percent / 100);
        return this.rgbToHex(
            Math.floor(rgb.r * factor),
            Math.floor(rgb.g * factor),
            Math.floor(rgb.b * factor)
        );
    }

    /**
     * Lighten a color by a percentage
     */
    static lighten(hexColor, percent) {
        const rgb = this.hexToRgb(hexColor);
        if (!rgb) return hexColor;
        
        const factor = percent / 100;
        return this.rgbToHex(
            Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * factor)),
            Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * factor)),
            Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * factor))
        );
    }

    /**
     * Get theme colors for a specific level
     */
    static getThemeColors(levelNumber) {
        switch (levelNumber) {
            case 1:
                return GAME_COLORS.THEME_FOREST;
            case 2:
                return GAME_COLORS.THEME_LIMBO;
            case 3:
                return GAME_COLORS.THEME_LUST;
            case 4:
                return GAME_COLORS.THEME_GLUTTONY;
            default:
                return GAME_COLORS.THEME_FOREST;
        }
    }
}