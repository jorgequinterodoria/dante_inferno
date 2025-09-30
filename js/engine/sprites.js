/**
 * Sprite Rendering System
 * Handles pixel art sprite rendering for game entities
 */

import { GAME_COLORS } from './colors.js';

export class SpriteRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.gridSize = renderer.gridSize;
        
        // Sprite definitions (pixel art patterns)
        this.sprites = this.initializeSprites();
    }

    /**
     * Initialize sprite definitions
     */
    initializeSprites() {
        return {
            // Player sprite (Dante) - 8x8 pixel art
            player: {
                width: 8,
                height: 8,
                pixels: [
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 2, 2, 1, 1, 0],
                    [1, 1, 2, 1, 1, 2, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 1, 3, 1, 1, 3, 1, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 0, 1, 0, 0, 1, 0, 0],
                    [0, 1, 1, 0, 0, 1, 1, 0]
                ],
                colors: [
                    null,                    // 0: transparent
                    GAME_COLORS.PLAYER,      // 1: red (main body)
                    '#FFDDDD',               // 2: light red (face)
                    '#000000'                // 3: black (eyes)
                ]
            },

            // Virgilio sprite - 8x8 pixel art
            virgilio: {
                width: 8,
                height: 8,
                pixels: [
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 1, 2, 2, 1, 1, 0],
                    [1, 1, 2, 3, 3, 2, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1],
                    [0, 1, 4, 1, 1, 4, 1, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 0, 1, 0, 0, 1, 0, 0],
                    [0, 1, 1, 0, 0, 1, 1, 0]
                ],
                colors: [
                    null,                    // 0: transparent
                    GAME_COLORS.VIRGILIO,    // 1: purple (main body)
                    '#E6E6FA',               // 2: light purple (face)
                    '#4B0082',               // 3: indigo (beard)
                    '#000000'                // 4: black (eyes)
                ]
            },

            // Fragment sprite - 6x6 pixel art
            fragment: {
                width: 6,
                height: 6,
                pixels: [
                    [0, 1, 1, 1, 1, 0],
                    [1, 2, 2, 2, 2, 1],
                    [1, 2, 3, 3, 2, 1],
                    [1, 2, 3, 3, 2, 1],
                    [1, 2, 2, 2, 2, 1],
                    [0, 1, 1, 1, 1, 0]
                ],
                colors: [
                    null,                    // 0: transparent
                    GAME_COLORS.FRAGMENT,    // 1: blue (border)
                    '#4169E1',               // 2: royal blue (main)
                    '#87CEEB'                // 3: sky blue (highlight)
                ]
            },

            // Exit portal sprite - 10x10 pixel art
            exit: {
                width: 10,
                height: 10,
                pixels: [
                    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
                    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
                    [1, 2, 3, 3, 3, 3, 3, 3, 2, 1],
                    [1, 2, 3, 4, 4, 4, 4, 3, 2, 1],
                    [1, 2, 3, 4, 0, 0, 4, 3, 2, 1],
                    [1, 2, 3, 4, 0, 0, 4, 3, 2, 1],
                    [1, 2, 3, 4, 4, 4, 4, 3, 2, 1],
                    [1, 2, 3, 3, 3, 3, 3, 3, 2, 1],
                    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
                    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0]
                ],
                colors: [
                    null,                    // 0: transparent/portal center
                    GAME_COLORS.EXIT,        // 1: orange (outer ring)
                    '#FF8C00',               // 2: dark orange
                    '#FFD700',               // 3: gold
                    '#FFA500'                // 4: orange
                ]
            },

            // Start position marker - 8x8 pixel art
            start: {
                width: 8,
                height: 8,
                pixels: [
                    [0, 0, 1, 1, 1, 1, 0, 0],
                    [0, 1, 2, 2, 2, 2, 1, 0],
                    [1, 2, 2, 2, 2, 2, 2, 1],
                    [1, 2, 2, 3, 3, 2, 2, 1],
                    [1, 2, 2, 3, 3, 2, 2, 1],
                    [1, 2, 2, 2, 2, 2, 2, 1],
                    [0, 1, 2, 2, 2, 2, 1, 0],
                    [0, 0, 1, 1, 1, 1, 0, 0]
                ],
                colors: [
                    null,                    // 0: transparent
                    GAME_COLORS.START,       // 1: green (border)
                    '#90EE90',               // 2: light green
                    '#228B22'                // 3: forest green (center)
                ]
            }
        };
    }

    /**
     * Render a sprite at world coordinates
     */
    drawSprite(spriteName, worldX, worldY, scale = 1) {
        const sprite = this.sprites[spriteName];
        if (!sprite) {
            console.warn(`Sprite '${spriteName}' not found`);
            return;
        }

        const screenPos = this.renderer.worldToScreen(worldX, worldY);
        const pixelSize = Math.max(1, Math.floor((this.gridSize / 8) * scale)); // Scale based on grid size
        
        // Center the sprite in the grid cell
        const offsetX = (this.gridSize - sprite.width * pixelSize) / 2;
        const offsetY = (this.gridSize - sprite.height * pixelSize) / 2;

        for (let y = 0; y < sprite.height; y++) {
            for (let x = 0; x < sprite.width; x++) {
                const colorIndex = sprite.pixels[y][x];
                const color = sprite.colors[colorIndex];
                
                if (color) { // Skip transparent pixels
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(
                        Math.floor(screenPos.x + offsetX + x * pixelSize),
                        Math.floor(screenPos.y + offsetY + y * pixelSize),
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }

    /**
     * Draw animated sprite with frame animation
     */
    drawAnimatedSprite(spriteName, worldX, worldY, frame = 0, scale = 1) {
        // For now, just draw the static sprite
        // Animation system can be expanded later
        this.drawSprite(spriteName, worldX, worldY, scale);
    }

    /**
     * Draw sprite with color tinting
     */
    drawTintedSprite(spriteName, worldX, worldY, tintColor, scale = 1) {
        const sprite = this.sprites[spriteName];
        if (!sprite) return;

        // Save current composite operation
        const oldCompositeOp = this.ctx.globalCompositeOperation;
        
        // Draw sprite normally first
        this.drawSprite(spriteName, worldX, worldY, scale);
        
        // Apply tint using multiply blend mode
        this.ctx.globalCompositeOperation = 'multiply';
        const screenPos = this.renderer.worldToScreen(worldX, worldY);
        this.ctx.fillStyle = tintColor;
        this.ctx.fillRect(
            Math.floor(screenPos.x),
            Math.floor(screenPos.y),
            this.gridSize,
            this.gridSize
        );
        
        // Restore composite operation
        this.ctx.globalCompositeOperation = oldCompositeOp;
    }

    /**
     * Check if sprite exists
     */
    hasSprite(spriteName) {
        return spriteName in this.sprites;
    }

    /**
     * Get sprite dimensions
     */
    getSpriteSize(spriteName) {
        const sprite = this.sprites[spriteName];
        return sprite ? { width: sprite.width, height: sprite.height } : null;
    }
}