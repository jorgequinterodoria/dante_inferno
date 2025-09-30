/**
 * Renderer System
 * Handles all Canvas rendering operations with pixel art styling
 */

import { GAME_COLORS, ColorUtils } from './colors.js';
import { SpriteRenderer } from './sprites.js';

export class Renderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        
        // Viewport and coordinate system
        this.viewport = {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height,
            scale: 1
        };
        
        // Camera system for following player
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothing: 0.1
        };
        
        // Grid system for maze rendering
        this.gridSize = 32; // 32x32 pixel tiles
        this.pixelScale = 1; // For pixel art scaling
        
        // Configure pixel art rendering
        this.setupPixelArtRendering();
        
        // Initialize sprite renderer
        this.spriteRenderer = new SpriteRenderer(this);
        
        // Current theme colors
        this.currentTheme = GAME_COLORS.THEME_FOREST;
        
        // Game state reference for dynamic lighting
        this.gameState = null;
        
        // Visual effects system
        this.activeEffects = [];
        this.highlightedElements = new Map();
        this.animationTime = 0;
        
        // Rendering statistics
        this.drawCalls = 0;
        this.lastFrameDrawCalls = 0;
        
        // Performance optimization features
        this.performanceMode = 'auto'; // 'high', 'balanced', 'performance', 'auto'
        this.frameTimeTarget = 16.67; // 60fps target
        this.lastFrameTime = 0;
        this.frameTimeHistory = [];
        this.frameTimeHistorySize = 60; // Track last 60 frames
        
        // Culling and optimization
        this.frustumCulling = true;
        this.visibleCells = new Set();
        this.lastCameraPosition = { x: -1, y: -1 };
        this.cullingMargin = 2; // Extra cells to render outside viewport
        
        // Dirty region tracking for minimal redraws
        this.dirtyRegions = [];
        this.fullRedrawRequired = true;
        this.lastMazeHash = null;
        
        // Rendering batching
        this.batchedDrawCalls = [];
        this.maxBatchSize = 100;
        
        // Canvas optimization
        this.offscreenCanvas = null;
        this.offscreenCtx = null;
        this.useOffscreenRendering = false;
        
        // Performance monitoring
        this.performanceStats = {
            avgFrameTime: 0,
            minFrameTime: Infinity,
            maxFrameTime: 0,
            droppedFrames: 0,
            totalFrames: 0,
            culledCells: 0,
            visibleCells: 0
        };
    }

    /**
     * Configure canvas for pixel art rendering
     */
    setupPixelArtRendering() {
        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Set canvas CSS for pixel perfect rendering
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        console.log('Pixel art rendering configured');
    }

    /**
     * Initialize renderer with performance optimizations
     */
    init() {
        // Set up initial viewport
        this.updateViewport();
        
        // Set default rendering properties
        this.ctx.textBaseline = 'top';
        this.ctx.font = '16px monospace';
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        // Set up offscreen canvas for complex rendering
        this.initializeOffscreenCanvas();
        
        // Detect device capabilities and set performance mode
        this.detectDeviceCapabilities();
        
        console.log('Renderer initialized');
        console.log(`Viewport: ${this.viewport.width}x${this.viewport.height}`);
        console.log(`Grid size: ${this.gridSize}px`);
        console.log(`Performance mode: ${this.performanceMode}`);
        console.log(`Frustum culling: ${this.frustumCulling}`);
    }

    /**
     * Initialize performance monitoring system
     */
    initializePerformanceMonitoring() {
        this.frameTimeHistory = new Array(this.frameTimeHistorySize).fill(16.67);
        this.performanceStats.totalFrames = 0;
        this.performanceStats.droppedFrames = 0;
        
        // Set up performance monitoring interval
        setInterval(() => {
            this.updatePerformanceMode();
        }, 1000); // Check every second
    }

    /**
     * Initialize offscreen canvas for complex rendering operations
     */
    initializeOffscreenCanvas() {
        try {
            if (typeof OffscreenCanvas !== 'undefined') {
                this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
                this.offscreenCtx = this.offscreenCanvas.getContext('2d');
                this.useOffscreenRendering = true;
                console.log('Offscreen canvas initialized');
            } else {
                // Fallback to regular canvas
                this.offscreenCanvas = document.createElement('canvas');
                this.offscreenCanvas.width = this.canvas.width;
                this.offscreenCanvas.height = this.canvas.height;
                this.offscreenCtx = this.offscreenCanvas.getContext('2d');
                this.useOffscreenRendering = true;
                console.log('Fallback offscreen canvas initialized');
            }
            
            // Configure offscreen canvas for pixel art
            if (this.offscreenCtx) {
                this.offscreenCtx.imageSmoothingEnabled = false;
                this.offscreenCtx.webkitImageSmoothingEnabled = false;
                this.offscreenCtx.mozImageSmoothingEnabled = false;
                this.offscreenCtx.msImageSmoothingEnabled = false;
            }
        } catch (error) {
            console.warn('Failed to initialize offscreen canvas:', error);
            this.useOffscreenRendering = false;
        }
    }

    /**
     * Detect device capabilities and set appropriate performance mode
     */
    detectDeviceCapabilities() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        let deviceScore = 0;
        
        // Check for WebGL support
        if (gl) {
            deviceScore += 20;
            
            // Check GPU renderer
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (renderer.includes('Intel') || renderer.includes('AMD') || renderer.includes('NVIDIA')) {
                    deviceScore += 30;
                }
            }
        }
        
        // Check for hardware concurrency (CPU cores)
        if (navigator.hardwareConcurrency) {
            deviceScore += Math.min(navigator.hardwareConcurrency * 5, 20);
        }
        
        // Check memory (if available)
        if (navigator.deviceMemory) {
            deviceScore += Math.min(navigator.deviceMemory * 5, 20);
        }
        
        // Check screen size (larger screens need more performance)
        const screenArea = window.screen.width * window.screen.height;
        if (screenArea > 2073600) { // > 1920x1080
            deviceScore -= 10;
        }
        
        // Set performance mode based on device score
        if (deviceScore >= 70) {
            this.performanceMode = 'high';
        } else if (deviceScore >= 40) {
            this.performanceMode = 'balanced';
        } else {
            this.performanceMode = 'performance';
        }
        
        console.log(`Device capability score: ${deviceScore}, Performance mode: ${this.performanceMode}`);
    }

    /**
     * Update performance mode based on current frame rate
     */
    updatePerformanceMode() {
        if (this.performanceMode !== 'auto') return;
        
        const avgFrameTime = this.getAverageFrameTime();
        const targetFrameTime = this.frameTimeTarget;
        
        if (avgFrameTime > targetFrameTime * 1.5) {
            // Frame rate too low, reduce quality
            if (this.performanceMode !== 'performance') {
                this.performanceMode = 'performance';
                console.log('Switched to performance mode due to low frame rate');
            }
        } else if (avgFrameTime < targetFrameTime * 0.8) {
            // Frame rate good, can increase quality
            if (this.performanceMode === 'performance') {
                this.performanceMode = 'balanced';
                console.log('Switched to balanced mode due to good frame rate');
            } else if (this.performanceMode === 'balanced' && avgFrameTime < targetFrameTime * 0.6) {
                this.performanceMode = 'high';
                console.log('Switched to high quality mode due to excellent frame rate');
            }
        }
    }

    /**
     * Get average frame time from recent history
     */
    getAverageFrameTime() {
        if (this.frameTimeHistory.length === 0) return this.frameTimeTarget;
        
        const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
        return sum / this.frameTimeHistory.length;
    }

    /**
     * Update viewport dimensions
     */
    updateViewport() {
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
    }

    /**
     * Set camera position
     */
    setCamera(x, y) {
        this.camera.targetX = x;
        this.camera.targetY = y;
    }

    /**
     * Update camera with smooth following
     */
    updateCamera() {
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.gridSize + this.viewport.width / 2,
            y: (worldY - this.camera.y) * this.gridSize + this.viewport.height / 2
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.viewport.width / 2) / this.gridSize + this.camera.x,
            y: (screenY - this.viewport.height / 2) / this.gridSize + this.camera.y
        };
    }

    /**
     * Set theme colors for current level
     */
    setTheme(levelNumber) {
        this.currentTheme = ColorUtils.getThemeColors(levelNumber);
        console.log(`Theme set for level ${levelNumber}`);
    }

    /**
     * Set game state reference for dynamic lighting
     */
    setGameState(gameState) {
        this.gameState = gameState;
    }

    /**
     * Trigger fragment collection visual effect
     */
    triggerFragmentCollection(worldX, worldY) {
        this.addFragmentCollectionEffect(worldX, worldY);
    }

    /**
     * Trigger objective completion visual effect
     */
    triggerObjectiveCompletion(worldX, worldY, objectiveType) {
        this.addObjectiveCompletionEffect(worldX, worldY, objectiveType);
    }

    /**
     * Trigger smooth transition effect
     */
    triggerTransition(fromX, fromY, toX, toY, duration = 500, effectType = 'fade') {
        this.addTransitionEffect(fromX, fromY, toX, toY, duration, effectType);
    }

    /**
     * Clear all visual effects
     */
    clearAllEffects() {
        this.activeEffects = [];
        this.highlightedElements.clear();
    }

    /**
     * Clear the canvas with theme background color
     */
    clear(backgroundColor = null) {
        const bgColor = backgroundColor || this.currentTheme.background;
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCalls = 0;
    }

    /**
     * Draw a rectangle at world coordinates
     */
    drawRect(worldX, worldY, width, height, color, filled = true) {
        const screenPos = this.worldToScreen(worldX, worldY);
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        
        if (filled) {
            this.ctx.fillRect(
                Math.floor(screenPos.x), 
                Math.floor(screenPos.y), 
                width * this.gridSize, 
                height * this.gridSize
            );
        } else {
            this.ctx.strokeRect(
                Math.floor(screenPos.x), 
                Math.floor(screenPos.y), 
                width * this.gridSize, 
                height * this.gridSize
            );
        }
        
        this.drawCalls++;
    }

    /**
     * Draw a circle at world coordinates
     */
    drawCircle(worldX, worldY, radius, color, filled = true) {
        const screenPos = this.worldToScreen(worldX + 0.5, worldY + 0.5); // Center in grid cell
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            Math.floor(screenPos.x), 
            Math.floor(screenPos.y), 
            radius * this.gridSize, 
            0, 
            2 * Math.PI
        );
        
        if (filled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
        
        this.drawCalls++;
    }

    /**
     * Draw text at world coordinates
     */
    drawText(text, worldX, worldY, color = '#FFFFFF', fontSize = 16, font = 'monospace') {
        const screenPos = this.worldToScreen(worldX, worldY);
        
        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.fillText(
            text, 
            Math.floor(screenPos.x), 
            Math.floor(screenPos.y)
        );
        
        this.drawCalls++;
    }

    /**
     * Draw text at screen coordinates (for UI)
     */
    drawUIText(text, screenX, screenY, color = '#FFFFFF', fontSize = 16, font = 'monospace', align = 'left') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px ${font}`;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, screenX, screenY);
        
        this.drawCalls++;
    }

    /**
     * Draw a line between two world coordinates
     */
    drawLine(worldX1, worldY1, worldX2, worldY2, color = '#FFFFFF', width = 1) {
        const screenPos1 = this.worldToScreen(worldX1, worldY1);
        const screenPos2 = this.worldToScreen(worldX2, worldY2);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(Math.floor(screenPos1.x), Math.floor(screenPos1.y));
        this.ctx.lineTo(Math.floor(screenPos2.x), Math.floor(screenPos2.y));
        this.ctx.stroke();
        
        this.drawCalls++;
    }

    /**
     * Draw a grid cell (for maze tiles) with pixel-perfect rendering
     */
    drawGridCell(gridX, gridY, color, borderColor = null, pattern = null) {
        const screenPos = this.worldToScreen(gridX, gridY);
        
        // Draw main cell
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            Math.floor(screenPos.x), 
            Math.floor(screenPos.y), 
            this.gridSize, 
            this.gridSize
        );
        
        // Draw border if specified
        if (borderColor) {
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                Math.floor(screenPos.x) + 0.5, 
                Math.floor(screenPos.y) + 0.5, 
                this.gridSize - 1, 
                this.gridSize - 1
            );
        }
        
        // Draw pattern if specified (for textured walls)
        if (pattern) {
            this.drawCellPattern(screenPos.x, screenPos.y, pattern);
        }
        
        this.drawCalls++;
    }

    /**
     * Draw texture pattern within a cell
     */
    drawCellPattern(screenX, screenY, pattern) {
        const patternSize = 4; // 4x4 pixel patterns
        
        switch (pattern) {
            case 'brick':
                this.drawBrickPattern(screenX, screenY);
                break;
            case 'stone':
                this.drawStonePattern(screenX, screenY);
                break;
        }
    }

    /**
     * Draw brick pattern for walls
     */
    drawBrickPattern(screenX, screenY) {
        const brickColor = ColorUtils.darken(this.currentTheme.wall, 20);
        this.ctx.fillStyle = brickColor;
        
        // Draw brick lines
        for (let y = 0; y < this.gridSize; y += 8) {
            this.ctx.fillRect(screenX, screenY + y, this.gridSize, 1);
        }
        
        for (let x = 0; x < this.gridSize; x += 16) {
            this.ctx.fillRect(screenX + x, screenY, 1, this.gridSize);
        }
    }

    /**
     * Draw stone pattern for walls
     */
    drawStonePattern(screenX, screenY) {
        const stoneColor = ColorUtils.lighten(this.currentTheme.wall, 10);
        this.ctx.fillStyle = stoneColor;
        
        // Draw random stone texture dots
        for (let i = 0; i < 8; i++) {
            const x = screenX + Math.floor(Math.random() * this.gridSize);
            const y = screenY + Math.floor(Math.random() * this.gridSize);
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    /**
     * Render maze structure with performance optimizations
     */
    drawMaze(maze) {
        if (!maze || !maze.cells) return;
        
        const startTime = performance.now();
        
        // Check if we need full redraw or can use dirty regions
        const mazeHash = this.calculateMazeHash(maze);
        const cameraChanged = this.hasCameraMoved();
        
        if (this.fullRedrawRequired || mazeHash !== this.lastMazeHash || cameraChanged) {
            this.drawMazeOptimized(maze);
            this.lastMazeHash = mazeHash;
            this.fullRedrawRequired = false;
            this.lastCameraPosition = { x: this.camera.x, y: this.camera.y };
        } else {
            // Only redraw dirty regions
            this.drawMazeDirtyRegions(maze);
        }
        
        const renderTime = performance.now() - startTime;
        this.updateFrameTimeStats(renderTime);
    }

    /**
     * Optimized maze rendering with frustum culling
     */
    drawMazeOptimized(maze) {
        // Calculate visible region based on camera position
        const visibleRegion = this.calculateVisibleRegion(maze);
        this.visibleCells.clear();
        
        let cellsRendered = 0;
        let cellsCulled = 0;
        
        // Use different rendering strategies based on performance mode
        switch (this.performanceMode) {
            case 'high':
                this.drawMazeHighQuality(maze, visibleRegion);
                break;
            case 'balanced':
                this.drawMazeBalanced(maze, visibleRegion);
                break;
            case 'performance':
                this.drawMazePerformance(maze, visibleRegion);
                break;
        }
        
        // Update performance stats
        this.performanceStats.visibleCells = cellsRendered;
        this.performanceStats.culledCells = cellsCulled;
    }

    /**
     * High quality maze rendering with all effects
     */
    drawMazeHighQuality(maze, visibleRegion) {
        for (let y = visibleRegion.minY; y <= visibleRegion.maxY; y++) {
            for (let x = visibleRegion.minX; x <= visibleRegion.maxX; x++) {
                if (!this.isCellVisible(x, y, visibleRegion)) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                this.visibleCells.add(`${x},${y}`);
                
                switch (cellType) {
                    case 0: // Wall
                        this.drawGridCell(
                            x, y, 
                            this.currentTheme.wall, 
                            ColorUtils.darken(this.currentTheme.wall, 30),
                            'brick'
                        );
                        break;
                    case 1: // Path
                        this.drawGridCell(x, y, this.currentTheme.path);
                        break;
                    case 2: // Start
                        this.drawGridCell(x, y, this.currentTheme.path);
                        this.spriteRenderer.drawSprite('start', x, y);
                        break;
                    case 3: // Exit
                        this.drawGridCell(x, y, this.currentTheme.path);
                        this.spriteRenderer.drawSprite('exit', x, y);
                        break;
                }
            }
        }
    }

    /**
     * Balanced quality maze rendering
     */
    drawMazeBalanced(maze, visibleRegion) {
        // Batch similar draw calls together
        const wallCells = [];
        const pathCells = [];
        const specialCells = [];
        
        for (let y = visibleRegion.minY; y <= visibleRegion.maxY; y++) {
            for (let x = visibleRegion.minX; x <= visibleRegion.maxX; x++) {
                if (!this.isCellVisible(x, y, visibleRegion)) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                this.visibleCells.add(`${x},${y}`);
                
                switch (cellType) {
                    case 0: // Wall
                        wallCells.push({ x, y });
                        break;
                    case 1: // Path
                        pathCells.push({ x, y });
                        break;
                    case 2: // Start
                    case 3: // Exit
                        specialCells.push({ x, y, type: cellType });
                        break;
                }
            }
        }
        
        // Batch render walls
        this.batchRenderCells(wallCells, this.currentTheme.wall, 'wall');
        
        // Batch render paths
        this.batchRenderCells(pathCells, this.currentTheme.path, 'path');
        
        // Render special cells individually
        specialCells.forEach(cell => {
            this.drawGridCell(cell.x, cell.y, this.currentTheme.path);
            if (cell.type === 2) {
                this.spriteRenderer.drawSprite('start', cell.x, cell.y);
            } else if (cell.type === 3) {
                this.spriteRenderer.drawSprite('exit', cell.x, cell.y);
            }
        });
    }

    /**
     * Performance-focused maze rendering
     */
    drawMazePerformance(maze, visibleRegion) {
        // Simplified rendering with minimal effects
        this.ctx.fillStyle = this.currentTheme.wall;
        
        // Render walls as single large rectangles where possible
        const wallRegions = this.findWallRegions(maze, visibleRegion);
        wallRegions.forEach(region => {
            const screenPos = this.worldToScreen(region.x, region.y);
            this.ctx.fillRect(
                Math.floor(screenPos.x),
                Math.floor(screenPos.y),
                region.width * this.gridSize,
                region.height * this.gridSize
            );
        });
        
        // Render paths as background
        this.ctx.fillStyle = this.currentTheme.path;
        const pathRegions = this.findPathRegions(maze, visibleRegion);
        pathRegions.forEach(region => {
            const screenPos = this.worldToScreen(region.x, region.y);
            this.ctx.fillRect(
                Math.floor(screenPos.x),
                Math.floor(screenPos.y),
                region.width * this.gridSize,
                region.height * this.gridSize
            );
        });
        
        // Only render essential sprites
        for (let y = visibleRegion.minY; y <= visibleRegion.maxY; y++) {
            for (let x = visibleRegion.minX; x <= visibleRegion.maxX; x++) {
                if (!this.isCellVisible(x, y, visibleRegion)) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                if (cellType === 2 || cellType === 3) {
                    this.spriteRenderer.drawSprite(cellType === 2 ? 'start' : 'exit', x, y);
                }
            }
        }
    }

    /**
     * Calculate visible region based on camera position and viewport
     */
    calculateVisibleRegion(maze) {
        const cellsX = Math.ceil(this.viewport.width / this.gridSize) + this.cullingMargin * 2;
        const cellsY = Math.ceil(this.viewport.height / this.gridSize) + this.cullingMargin * 2;
        
        const centerX = Math.floor(this.camera.x);
        const centerY = Math.floor(this.camera.y);
        
        return {
            minX: Math.max(0, centerX - Math.floor(cellsX / 2)),
            maxX: Math.min(maze.width - 1, centerX + Math.floor(cellsX / 2)),
            minY: Math.max(0, centerY - Math.floor(cellsY / 2)),
            maxY: Math.min(maze.height - 1, centerY + Math.floor(cellsY / 2)),
            centerX,
            centerY
        };
    }

    /**
     * Check if a cell is visible within the current viewport
     */
    isCellVisible(x, y, visibleRegion) {
        return x >= visibleRegion.minX && x <= visibleRegion.maxX &&
               y >= visibleRegion.minY && y <= visibleRegion.maxY;
    }

    /**
     * Check if camera has moved significantly
     */
    hasCameraMoved() {
        const threshold = 0.1; // Minimum movement to trigger redraw
        return Math.abs(this.camera.x - this.lastCameraPosition.x) > threshold ||
               Math.abs(this.camera.y - this.lastCameraPosition.y) > threshold;
    }

    /**
     * Calculate hash of maze for change detection
     */
    calculateMazeHash(maze) {
        if (!maze || !maze.cells) return 0;
        
        let hash = 0;
        const visibleRegion = this.calculateVisibleRegion(maze);
        
        for (let y = visibleRegion.minY; y <= visibleRegion.maxY; y++) {
            for (let x = visibleRegion.minX; x <= visibleRegion.maxX; x++) {
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                hash = ((hash << 5) - hash + cellType) & 0xffffffff;
            }
        }
        
        return hash;
    }

    /**
     * Batch render similar cells for better performance
     */
    batchRenderCells(cells, color, type) {
        if (cells.length === 0) return;
        
        this.ctx.fillStyle = color;
        
        // Group adjacent cells for more efficient rendering
        const groups = this.groupAdjacentCells(cells);
        
        groups.forEach(group => {
            const screenPos = this.worldToScreen(group.x, group.y);
            this.ctx.fillRect(
                Math.floor(screenPos.x),
                Math.floor(screenPos.y),
                group.width * this.gridSize,
                group.height * this.gridSize
            );
            
            // Add borders for walls in balanced mode
            if (type === 'wall' && this.performanceMode === 'balanced') {
                this.ctx.strokeStyle = ColorUtils.darken(color, 30);
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    Math.floor(screenPos.x) + 0.5,
                    Math.floor(screenPos.y) + 0.5,
                    group.width * this.gridSize - 1,
                    group.height * this.gridSize - 1
                );
            }
        });
    }

    /**
     * Group adjacent cells for batch rendering
     */
    groupAdjacentCells(cells) {
        if (cells.length === 0) return [];
        
        const groups = [];
        const processed = new Set();
        
        cells.forEach(cell => {
            const key = `${cell.x},${cell.y}`;
            if (processed.has(key)) return;
            
            // Find rectangular region starting from this cell
            const group = this.findRectangularRegion(cells, cell, processed);
            if (group) {
                groups.push(group);
            }
        });
        
        return groups;
    }

    /**
     * Find rectangular region of similar cells
     */
    findRectangularRegion(cells, startCell, processed) {
        const cellMap = new Map();
        cells.forEach(cell => {
            cellMap.set(`${cell.x},${cell.y}`, cell);
        });
        
        let width = 1;
        let height = 1;
        
        // Expand horizontally
        while (cellMap.has(`${startCell.x + width},${startCell.y}`) &&
               !processed.has(`${startCell.x + width},${startCell.y}`)) {
            width++;
        }
        
        // Expand vertically
        let canExpandVertically = true;
        while (canExpandVertically) {
            for (let x = 0; x < width; x++) {
                if (!cellMap.has(`${startCell.x + x},${startCell.y + height}`) ||
                    processed.has(`${startCell.x + x},${startCell.y + height}`)) {
                    canExpandVertically = false;
                    break;
                }
            }
            if (canExpandVertically) {
                height++;
            }
        }
        
        // Mark cells as processed
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                processed.add(`${startCell.x + x},${startCell.y + y}`);
            }
        }
        
        return {
            x: startCell.x,
            y: startCell.y,
            width,
            height
        };
    }

    /**
     * Find wall regions for performance rendering
     */
    findWallRegions(maze, visibleRegion) {
        const regions = [];
        const processed = new Set();
        
        for (let y = visibleRegion.minY; y <= visibleRegion.maxY; y++) {
            for (let x = visibleRegion.minX; x <= visibleRegion.maxX; x++) {
                const key = `${x},${y}`;
                if (processed.has(key)) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                if (cellType === 0) { // Wall
                    const region = this.findConnectedRegion(maze, x, y, 0, visibleRegion, processed);
                    if (region) {
                        regions.push(region);
                    }
                }
            }
        }
        
        return regions;
    }

    /**
     * Find path regions for performance rendering
     */
    findPathRegions(maze, visibleRegion) {
        const regions = [];
        const processed = new Set();
        
        for (let y = visibleRegion.minY; y <= visibleRegion.maxY; y++) {
            for (let x = visibleRegion.minX; x <= visibleRegion.maxX; x++) {
                const key = `${x},${y}`;
                if (processed.has(key)) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                if (cellType === 1) { // Path
                    const region = this.findConnectedRegion(maze, x, y, 1, visibleRegion, processed);
                    if (region) {
                        regions.push(region);
                    }
                }
            }
        }
        
        return regions;
    }

    /**
     * Find connected rectangular region of same cell type
     */
    findConnectedRegion(maze, startX, startY, cellType, visibleRegion, processed) {
        let width = 1;
        let height = 1;
        
        // Expand horizontally
        while (startX + width <= visibleRegion.maxX) {
            const checkY = startY;
            const checkCellType = maze.cells[checkY] ? maze.cells[checkY][startX + width] : 0;
            if (checkCellType === cellType && !processed.has(`${startX + width},${checkY}`)) {
                width++;
            } else {
                break;
            }
        }
        
        // Expand vertically
        let canExpandVertically = true;
        while (canExpandVertically && startY + height <= visibleRegion.maxY) {
            for (let x = 0; x < width; x++) {
                const checkX = startX + x;
                const checkY = startY + height;
                const checkCellType = maze.cells[checkY] ? maze.cells[checkY][checkX] : 0;
                if (checkCellType !== cellType || processed.has(`${checkX},${checkY}`)) {
                    canExpandVertically = false;
                    break;
                }
            }
            if (canExpandVertically) {
                height++;
            }
        }
        
        // Mark cells as processed
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                processed.add(`${startX + x},${startY + y}`);
            }
        }
        
        return {
            x: startX,
            y: startY,
            width,
            height
        };
    }

    /**
     * Render player (Dante) with pixel art sprite and dynamic lighting
     */
    drawPlayer(player, maze = null) {
        if (!player) return;
        
        const position = player.getPosition ? player.getPosition() : player.position;
        if (!position) return;
        
        // Draw path background first
        this.drawGridCell(Math.floor(position.x), Math.floor(position.y), this.currentTheme.path);
        
        // Apply shadow effects from surrounding walls
        if (maze) {
            this.applyShadowEffects(maze, position);
        }
        
        // Apply dynamic lighting around player
        const lightingIntensity = this.calculateLightingIntensity(player);
        this.applyLighting(position, lightingIntensity);
        
        // Apply directional lighting if player is moving
        if (player.getIsMoving && player.getIsMoving()) {
            const direction = this.getPlayerMovementDirection(player);
            if (direction) {
                this.applyDirectionalLighting(position, direction, lightingIntensity * 0.7);
            }
        }
        
        // Draw player sprite
        this.spriteRenderer.drawSprite('player', Math.floor(position.x), Math.floor(position.y));
        
        // Add enhanced glow effect around player
        this.drawEnhancedPlayerGlow(position, lightingIntensity);
    }

    /**
     * Calculate dynamic lighting intensity based on game state
     */
    calculateLightingIntensity(player) {
        let baseIntensity = 1.0;
        
        // Increase intensity if player is moving
        if (player.getIsMoving && player.getIsMoving()) {
            baseIntensity *= 1.2;
        }
        
        // Vary intensity based on current level theme
        const theme = this.getLightingTheme();
        baseIntensity *= theme.intensity;
        
        // Add subtle random variation for more dynamic feel
        const time = Date.now() * 0.003;
        const variation = 0.9 + 0.1 * Math.sin(time);
        
        return baseIntensity * variation;
    }

    /**
     * Get player movement direction for directional lighting
     */
    getPlayerMovementDirection(player) {
        if (!player.getPosition || !player.getPreviousPosition) return null;
        
        const current = player.getPosition();
        const previous = player.getPreviousPosition();
        
        const dx = current.x - previous.x;
        const dy = current.y - previous.y;
        
        // Determine primary direction
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > 0.1) {
            return dy > 0 ? 'down' : 'up';
        }
        
        return null;
    }

    /**
     * Draw enhanced glow effect around player with theme colors
     */
    drawEnhancedPlayerGlow(position, intensity) {
        const screenPos = this.worldToScreen(position.x + 0.5, position.y + 0.5);
        const theme = this.getLightingTheme();
        
        // Inner bright glow
        const innerGradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, this.gridSize * 0.8 * intensity
        );
        innerGradient.addColorStop(0, ColorUtils.withAlpha(theme.primary, 0.6 * intensity));
        innerGradient.addColorStop(0.5, ColorUtils.withAlpha(theme.primary, 0.3 * intensity));
        innerGradient.addColorStop(1, ColorUtils.withAlpha(theme.primary, 0));
        
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(
            screenPos.x - this.gridSize * 0.8 * intensity,
            screenPos.y - this.gridSize * 0.8 * intensity,
            this.gridSize * 1.6 * intensity,
            this.gridSize * 1.6 * intensity
        );
        
        // Outer soft glow
        const outerGradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, this.gridSize * 0.8 * intensity,
            screenPos.x, screenPos.y, this.gridSize * 1.5 * intensity
        );
        outerGradient.addColorStop(0, ColorUtils.withAlpha(theme.secondary, 0.2 * intensity));
        outerGradient.addColorStop(1, ColorUtils.withAlpha(theme.secondary, 0));
        
        this.ctx.fillStyle = outerGradient;
        this.ctx.fillRect(
            screenPos.x - this.gridSize * 1.5 * intensity,
            screenPos.y - this.gridSize * 1.5 * intensity,
            this.gridSize * 3 * intensity,
            this.gridSize * 3 * intensity
        );
    }

    /**
     * Draw glow effect around player
     */
    drawPlayerGlow(worldX, worldY) {
        const screenPos = this.worldToScreen(worldX + 0.5, worldY + 0.5);
        
        // Create radial gradient for glow
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, this.gridSize * 1.5
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(GAME_COLORS.LIGHT_GOLD, 0.3));
        gradient.addColorStop(0.5, ColorUtils.withAlpha(GAME_COLORS.LIGHT_GOLD, 0.1));
        gradient.addColorStop(1, ColorUtils.withAlpha(GAME_COLORS.LIGHT_GOLD, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            screenPos.x - this.gridSize * 1.5,
            screenPos.y - this.gridSize * 1.5,
            this.gridSize * 3,
            this.gridSize * 3
        );
    }

    /**
     * Render objectives with pixel art sprites
     */
    drawObjectives(objectives) {
        if (!objectives) return;
        
        // Draw Virgilio if not found
        if (objectives.virgilio && !objectives.virgilio.found) {
            // Draw path background first
            this.drawGridCell(objectives.virgilio.x, objectives.virgilio.y, this.currentTheme.path);
            // Draw Virgilio sprite
            this.spriteRenderer.drawSprite('virgilio', objectives.virgilio.x, objectives.virgilio.y);
            // Add subtle purple glow
            this.drawObjectiveGlow(objectives.virgilio.x, objectives.virgilio.y, GAME_COLORS.VIRGILIO);
        }
        
        // Draw fragments
        if (objectives.fragments) {
            objectives.fragments.forEach(fragment => {
                if (!fragment.collected) {
                    // Draw path background first
                    this.drawGridCell(fragment.x, fragment.y, this.currentTheme.path);
                    // Draw fragment sprite
                    this.spriteRenderer.drawSprite('fragment', fragment.x, fragment.y);
                    // Add blue glow
                    this.drawObjectiveGlow(fragment.x, fragment.y, GAME_COLORS.FRAGMENT);
                }
            });
        }
    }

    /**
     * Render objectives with highlight effects for interactivity
     */
    drawObjectivesWithHighlights(objectives) {
        if (!objectives) return;
        
        // Draw Virgilio if not found
        if (objectives.virgilio && !objectives.virgilio.found) {
            const elementId = `virgilio_${objectives.virgilio.x}_${objectives.virgilio.y}`;
            
            // Add highlight if near player
            if (this.isNearPlayer(objectives.virgilio.x, objectives.virgilio.y)) {
                this.addHighlightEffect(elementId, objectives.virgilio.x, objectives.virgilio.y, 'objective');
            }
            
            // Draw path background first
            this.drawGridCell(objectives.virgilio.x, objectives.virgilio.y, this.currentTheme.path);
            // Draw Virgilio sprite
            this.spriteRenderer.drawSprite('virgilio', objectives.virgilio.x, objectives.virgilio.y);
            // Add enhanced glow with pulsing effect
            this.drawEnhancedObjectiveGlow(objectives.virgilio.x, objectives.virgilio.y, GAME_COLORS.VIRGILIO, 'virgilio');
        }
        
        // Draw fragments
        if (objectives.fragments) {
            objectives.fragments.forEach((fragment, index) => {
                if (!fragment.collected) {
                    const elementId = `fragment_${fragment.x}_${fragment.y}_${index}`;
                    
                    // Add highlight if near player
                    if (this.isNearPlayer(fragment.x, fragment.y)) {
                        this.addHighlightEffect(elementId, fragment.x, fragment.y, 'interactive');
                    }
                    
                    // Draw path background first
                    this.drawGridCell(fragment.x, fragment.y, this.currentTheme.path);
                    // Draw fragment sprite
                    this.spriteRenderer.drawSprite('fragment', fragment.x, fragment.y);
                    // Add enhanced glow with sparkle effect
                    this.drawEnhancedObjectiveGlow(fragment.x, fragment.y, GAME_COLORS.FRAGMENT, 'fragment');
                }
            });
        }
    }

    /**
     * Render maze entities with highlight effects
     */
    drawMazeEntitiesWithHighlights(maze) {
        if (!maze || !maze.getEntityRenderData) return;
        
        const entities = maze.getEntityRenderData();
        
        entities.forEach((entity, index) => {
            const elementId = `entity_${entity.type}_${entity.x}_${entity.y}_${index}`;
            
            // Add highlight if near player
            if (this.isNearPlayer(entity.x, entity.y)) {
                const highlightType = entity.type === 'virgilio' ? 'objective' : 'interactive';
                this.addHighlightEffect(elementId, entity.x, entity.y, highlightType);
            }
            
            // Draw path background first
            this.drawGridCell(entity.x, entity.y, this.currentTheme.path);
            
            // Draw entity sprite based on type
            switch (entity.type) {
                case 'virgilio':
                    this.spriteRenderer.drawSprite('virgilio', entity.x, entity.y);
                    this.drawEnhancedObjectiveGlow(entity.x, entity.y, GAME_COLORS.VIRGILIO, 'virgilio');
                    break;
                case 'fragment':
                    this.spriteRenderer.drawSprite('fragment', entity.x, entity.y);
                    this.drawEnhancedObjectiveGlow(entity.x, entity.y, GAME_COLORS.FRAGMENT, 'fragment');
                    break;
                default:
                    // Fallback: draw colored square
                    this.drawGridCell(entity.x, entity.y, entity.color);
                    break;
            }
        });
    }

    /**
     * Check if position is near player for highlighting
     */
    isNearPlayer(worldX, worldY) {
        if (!this.gameState || !this.gameState.playerPosition) return false;
        
        const playerPos = this.gameState.playerPosition;
        const distance = Math.sqrt(
            Math.pow(worldX - playerPos.x, 2) + Math.pow(worldY - playerPos.y, 2)
        );
        
        return distance <= 2; // Highlight within 2 grid units
    }

    /**
     * Draw enhanced objective glow with type-specific effects
     */
    drawEnhancedObjectiveGlow(worldX, worldY, color, objectiveType) {
        const screenPos = this.worldToScreen(worldX + 0.5, worldY + 0.5);
        const time = this.animationTime * 0.001;
        
        // Base glow
        this.drawObjectiveGlow(worldX, worldY, color);
        
        // Type-specific enhancements
        switch (objectiveType) {
            case 'fragment':
                this.drawFragmentSparkles(screenPos, time);
                break;
            case 'virgilio':
                this.drawVirgilioAura(screenPos, time);
                break;
        }
    }

    /**
     * Draw sparkle effects around fragments
     */
    drawFragmentSparkles(screenPos, time) {
        const sparkleCount = 6;
        const radius = this.gridSize * 0.8;
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + time * 2;
            const sparkleRadius = radius + Math.sin(time * 3 + i) * 10;
            
            const x = screenPos.x + Math.cos(angle) * sparkleRadius;
            const y = screenPos.y + Math.sin(angle) * sparkleRadius;
            
            const alpha = 0.3 + 0.3 * Math.sin(time * 4 + i);
            this.ctx.fillStyle = ColorUtils.withAlpha(GAME_COLORS.FRAGMENT, alpha);
            this.ctx.fillRect(x - 1, y - 1, 2, 2);
        }
    }

    /**
     * Draw mystical aura around Virgilio
     */
    drawVirgilioAura(screenPos, time) {
        const auraRadius = this.gridSize * 1.2;
        const pulseIntensity = 0.5 + 0.3 * Math.sin(time * 1.5);
        
        // Create mystical aura gradient
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, auraRadius * pulseIntensity
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(GAME_COLORS.VIRGILIO, 0.1 * pulseIntensity));
        gradient.addColorStop(0.7, ColorUtils.withAlpha(GAME_COLORS.VIRGILIO, 0.05 * pulseIntensity));
        gradient.addColorStop(1, ColorUtils.withAlpha(GAME_COLORS.VIRGILIO, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            screenPos.x - auraRadius * pulseIntensity,
            screenPos.y - auraRadius * pulseIntensity,
            auraRadius * pulseIntensity * 2,
            auraRadius * pulseIntensity * 2
        );
    }

    /**
     * Render entities from maze entity system
     */
    drawMazeEntities(maze) {
        if (!maze || !maze.getEntityRenderData) return;
        
        const entities = maze.getEntityRenderData();
        
        entities.forEach(entity => {
            // Draw path background first
            this.drawGridCell(entity.x, entity.y, this.currentTheme.path);
            
            // Draw entity sprite based on type
            switch (entity.type) {
                case 'virgilio':
                    this.spriteRenderer.drawSprite('virgilio', entity.x, entity.y);
                    this.drawObjectiveGlow(entity.x, entity.y, GAME_COLORS.VIRGILIO);
                    break;
                case 'fragment':
                    this.spriteRenderer.drawSprite('fragment', entity.x, entity.y);
                    this.drawObjectiveGlow(entity.x, entity.y, GAME_COLORS.FRAGMENT);
                    break;
                default:
                    // Fallback: draw colored square
                    this.drawGridCell(entity.x, entity.y, entity.color);
                    break;
            }
        });
    }

    /**
     * Draw glow effect around objectives
     */
    drawObjectiveGlow(worldX, worldY, color) {
        const screenPos = this.worldToScreen(worldX + 0.5, worldY + 0.5);
        
        // Create radial gradient for glow
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, this.gridSize
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(color, 0.2));
        gradient.addColorStop(0.7, ColorUtils.withAlpha(color, 0.1));
        gradient.addColorStop(1, ColorUtils.withAlpha(color, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            screenPos.x - this.gridSize,
            screenPos.y - this.gridSize,
            this.gridSize * 2,
            this.gridSize * 2
        );
    }

    /**
     * Apply dynamic lighting effects with pixel art style
     */
    applyLighting(position, intensity = 1.0, lightingTheme = null) {
        if (!position) return;
        
        const screenPos = this.worldToScreen(position.x + 0.5, position.y + 0.5);
        const baseRadius = this.gridSize * 4;
        
        // Get theme-specific lighting colors
        const theme = lightingTheme || this.getLightingTheme();
        
        // Create atmospheric lighting with multiple layers
        this.renderAtmosphericLighting(screenPos, baseRadius, intensity, theme);
        
        // Add dynamic flickering effect
        this.renderFlickeringLight(screenPos, baseRadius * 0.8, intensity, theme);
        
        // Add subtle pulsing effect
        this.renderPulsingLight(screenPos, baseRadius * 0.5, intensity, theme);
    }

    /**
     * Get lighting theme based on current level
     */
    getLightingTheme() {
        const levelThemes = {
            1: { // Forest
                primary: GAME_COLORS.LIGHT_GOLD,
                secondary: GAME_COLORS.LIGHT_WARM,
                ambient: '#FFE4B5',
                intensity: 1.0
            },
            2: { // Limbo
                primary: '#E6E6FA',
                secondary: '#D8BFD8',
                ambient: '#F0F8FF',
                intensity: 0.8
            },
            3: { // Lust
                primary: '#FF69B4',
                secondary: '#FF1493',
                ambient: '#FFB6C1',
                intensity: 1.2
            },
            4: { // Gluttony
                primary: '#ADFF2F',
                secondary: '#9ACD32',
                ambient: '#F0FFF0',
                intensity: 0.9
            },
            5: { // Greed/Wrath
                primary: '#FFFF00',
                secondary: '#FFD700',
                ambient: '#FFFACD',
                intensity: 1.1
            },
            6: { // City of Dis
                primary: '#FF4500',
                secondary: '#FF6347',
                ambient: '#FFA07A',
                intensity: 1.3
            },
            7: { // Violence
                primary: '#FF0000',
                secondary: '#DC143C',
                ambient: '#FFE4E1',
                intensity: 1.4
            },
            8: { // Fraud
                primary: '#FF6347',
                secondary: '#FF4500',
                ambient: '#FFEFD5',
                intensity: 1.2
            },
            9: { // Treachery
                primary: '#00BFFF',
                secondary: '#87CEEB',
                ambient: '#F0F8FF',
                intensity: 0.7
            }
        };
        
        return levelThemes[this.gameState?.currentLevel || 1] || levelThemes[1];
    }

    /**
     * Render atmospheric lighting layers
     */
    renderAtmosphericLighting(screenPos, baseRadius, intensity, theme) {
        const layers = [
            {
                radius: baseRadius * 1.5 * intensity,
                color: theme.ambient,
                alpha: 0.15 * intensity,
                blur: true
            },
            {
                radius: baseRadius * 1.0 * intensity,
                color: theme.secondary,
                alpha: 0.25 * intensity,
                blur: false
            },
            {
                radius: baseRadius * 0.6 * intensity,
                color: theme.primary,
                alpha: 0.4 * intensity,
                blur: false
            }
        ];
        
        layers.forEach(layer => {
            if (layer.blur) {
                this.ctx.filter = 'blur(2px)';
            }
            
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, layer.radius
            );
            gradient.addColorStop(0, ColorUtils.withAlpha(layer.color, layer.alpha));
            gradient.addColorStop(0.7, ColorUtils.withAlpha(layer.color, layer.alpha * 0.5));
            gradient.addColorStop(1, ColorUtils.withAlpha(layer.color, 0));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                screenPos.x - layer.radius,
                screenPos.y - layer.radius,
                layer.radius * 2,
                layer.radius * 2
            );
            
            if (layer.blur) {
                this.ctx.filter = 'none';
            }
        });
    }

    /**
     * Render flickering light effect
     */
    renderFlickeringLight(screenPos, radius, intensity, theme) {
        // Create subtle flickering using time-based variation
        const time = Date.now() * 0.01;
        const flicker = 0.8 + 0.2 * Math.sin(time * 2.3) * Math.sin(time * 1.7);
        const flickerIntensity = intensity * flicker;
        
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, radius * flickerIntensity
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(theme.primary, 0.3 * flickerIntensity));
        gradient.addColorStop(0.5, ColorUtils.withAlpha(theme.primary, 0.15 * flickerIntensity));
        gradient.addColorStop(1, ColorUtils.withAlpha(theme.primary, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            screenPos.x - radius * flickerIntensity,
            screenPos.y - radius * flickerIntensity,
            radius * flickerIntensity * 2,
            radius * flickerIntensity * 2
        );
    }

    /**
     * Render pulsing light effect
     */
    renderPulsingLight(screenPos, radius, intensity, theme) {
        // Create gentle pulsing effect
        const time = Date.now() * 0.005;
        const pulse = 0.7 + 0.3 * Math.sin(time);
        const pulseIntensity = intensity * pulse;
        
        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, radius * pulseIntensity
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(theme.secondary, 0.2 * pulseIntensity));
        gradient.addColorStop(1, ColorUtils.withAlpha(theme.secondary, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            screenPos.x - radius * pulseIntensity,
            screenPos.y - radius * pulseIntensity,
            radius * pulseIntensity * 2,
            radius * pulseIntensity * 2
        );
    }

    /**
     * Apply directional lighting based on player movement
     */
    applyDirectionalLighting(position, direction, intensity = 1.0) {
        if (!position || !direction) return;
        
        const screenPos = this.worldToScreen(position.x + 0.5, position.y + 0.5);
        const theme = this.getLightingTheme();
        
        // Calculate directional offset
        const directionOffsets = {
            'up': { x: 0, y: -0.3 },
            'down': { x: 0, y: 0.3 },
            'left': { x: -0.3, y: 0 },
            'right': { x: 0.3, y: 0 }
        };
        
        const offset = directionOffsets[direction] || { x: 0, y: 0 };
        const lightX = screenPos.x + offset.x * this.gridSize;
        const lightY = screenPos.y + offset.y * this.gridSize;
        
        // Create directional gradient
        const gradient = this.ctx.createRadialGradient(
            lightX, lightY, 0,
            lightX, lightY, this.gridSize * 2 * intensity
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(theme.primary, 0.3 * intensity));
        gradient.addColorStop(0.6, ColorUtils.withAlpha(theme.primary, 0.1 * intensity));
        gradient.addColorStop(1, ColorUtils.withAlpha(theme.primary, 0));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            lightX - this.gridSize * 2 * intensity,
            lightY - this.gridSize * 2 * intensity,
            this.gridSize * 4 * intensity,
            this.gridSize * 4 * intensity
        );
    }

    /**
     * Apply shadow effects around walls and obstacles
     */
    applyShadowEffects(maze, playerPosition) {
        if (!maze || !playerPosition) return;
        
        const shadowColor = ColorUtils.withAlpha(GAME_COLORS.SHADOW, 0.4);
        const lightRadius = 4; // Grid units
        
        // Check surrounding area for walls to cast shadows
        for (let dy = -lightRadius; dy <= lightRadius; dy++) {
            for (let dx = -lightRadius; dx <= lightRadius; dx++) {
                const checkX = Math.floor(playerPosition.x) + dx;
                const checkY = Math.floor(playerPosition.y) + dy;
                
                // Skip if out of bounds
                if (checkX < 0 || checkY < 0 || checkX >= maze.width || checkY >= maze.height) {
                    continue;
                }
                
                // Check if this position is a wall
                if (maze.cells && maze.cells[checkY] && maze.cells[checkY][checkX] === 0) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Only cast shadows for walls within light radius
                    if (distance <= lightRadius) {
                        this.renderWallShadow(checkX, checkY, playerPosition, distance, lightRadius);
                    }
                }
            }
        }
    }

    /**
     * Render shadow cast by a wall
     */
    renderWallShadow(wallX, wallY, playerPos, distance, maxDistance) {
        const screenPos = this.worldToScreen(wallX, wallY);
        const playerScreenPos = this.worldToScreen(playerPos.x + 0.5, playerPos.y + 0.5);
        
        // Calculate shadow direction (away from player)
        const dx = screenPos.x - playerScreenPos.x;
        const dy = screenPos.y - playerScreenPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return;
        
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        
        // Shadow intensity based on distance
        const intensity = Math.max(0, 1 - distance / maxDistance);
        const shadowLength = this.gridSize * 2 * intensity;
        
        // Create shadow gradient
        const gradient = this.ctx.createLinearGradient(
            screenPos.x, screenPos.y,
            screenPos.x + normalizedDx * shadowLength,
            screenPos.y + normalizedDy * shadowLength
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(GAME_COLORS.SHADOW, 0.3 * intensity));
        gradient.addColorStop(1, ColorUtils.withAlpha(GAME_COLORS.SHADOW, 0));
        
        this.ctx.fillStyle = gradient;
        
        // Draw shadow rectangle
        this.ctx.fillRect(
            screenPos.x,
            screenPos.y,
            normalizedDx * shadowLength,
            normalizedDy * shadowLength
        );
    }

    /**
     * Draw pixel-perfect UI elements
     */
    drawPixelUI(x, y, width, height, backgroundColor, borderColor = null) {
        // Draw background
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(x, y, width, height);
        
        // Draw pixel-perfect border
        if (borderColor) {
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        }
        
        this.drawCalls++;
    }

    /**
     * Begin frame rendering
     */
    beginFrame(deltaTime = 16.67) {
        this.updateCamera();
        this.animationTime += deltaTime;
        this.lastFrameDrawCalls = this.drawCalls;
        this.drawCalls = 0;
    }

    /**
     * End frame rendering
     */
    endFrame() {
        // Frame cleanup if needed
    }

    /**
     * Get rendering statistics
     */
    getStats() {
        return {
            drawCalls: this.lastFrameDrawCalls,
            viewport: { ...this.viewport },
            camera: { ...this.camera }
        };
    }

    /**
     * Render complete game scene with dynamic lighting and visual effects
     */
    renderGameScene(gameState, player, maze, objectives, deltaTime = 16.67) {
        // Begin frame rendering
        this.beginFrame();
        
        // Update visual effects
        this.updateEffects(deltaTime);
        
        // Clear canvas with theme background
        this.clear();
        
        // Set camera to follow player
        if (player && player.getPosition) {
            const playerPos = player.getPosition();
            this.setCamera(playerPos.x, playerPos.y);
        }
        
        // Render maze structure
        if (maze) {
            this.drawMaze(maze);
        }
        
        // Render objectives and entities with highlights
        if (objectives) {
            this.drawObjectivesWithHighlights(objectives);
        }
        
        // Render maze entities if available
        if (maze && maze.getEntityRenderData) {
            this.drawMazeEntitiesWithHighlights(maze);
        }
        
        // Render player with dynamic lighting (this should be last for proper lighting layering)
        if (player) {
            this.drawPlayer(player, maze);
        }
        
        // Render all visual effects on top
        this.renderEffects();
        
        // End frame rendering
        this.endFrame();
    }

    /**
     * Update visual effects and animations
     */
    updateEffects(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isComplete();
        });
        
        // Update highlighted elements
        for (let [elementId, highlight] of this.highlightedElements) {
            highlight.update(deltaTime);
            if (highlight.isComplete()) {
                this.highlightedElements.delete(elementId);
            }
        }
    }

    /**
     * Add visual effect for fragment collection
     */
    addFragmentCollectionEffect(worldX, worldY) {
        const effect = new FragmentCollectionEffect(worldX, worldY, this);
        this.activeEffects.push(effect);
    }

    /**
     * Add visual effect for objective completion
     */
    addObjectiveCompletionEffect(worldX, worldY, objectiveType) {
        const effect = new ObjectiveCompletionEffect(worldX, worldY, objectiveType, this);
        this.activeEffects.push(effect);
    }

    /**
     * Add highlight effect for interactive element
     */
    addHighlightEffect(elementId, worldX, worldY, highlightType = 'default') {
        const highlight = new HighlightEffect(worldX, worldY, highlightType, this);
        this.highlightedElements.set(elementId, highlight);
    }

    /**
     * Remove highlight effect
     */
    removeHighlightEffect(elementId) {
        this.highlightedElements.delete(elementId);
    }

    /**
     * Add smooth transition effect
     */
    addTransitionEffect(fromX, fromY, toX, toY, duration = 500, effectType = 'fade') {
        const effect = new TransitionEffect(fromX, fromY, toX, toY, duration, effectType, this);
        this.activeEffects.push(effect);
    }

    /**
     * Render all active visual effects
     */
    renderEffects() {
        // Render highlight effects first (behind other effects)
        for (let highlight of this.highlightedElements.values()) {
            highlight.render();
        }
        
        // Render active effects
        this.activeEffects.forEach(effect => {
            effect.render();
        });
    }

    /**
     * Handle canvas resize
     */
    handleResize() {
        this.updateViewport();
        console.log(`Renderer viewport updated: ${this.viewport.width}x${this.viewport.height}`);
    }

    /**
     * Update frame time statistics for performance monitoring
     */
    updateFrameTimeStats(frameTime) {
        this.performanceStats.totalFrames++;
        
        // Update frame time history
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.frameTimeHistorySize) {
            this.frameTimeHistory.shift();
        }
        
        // Update performance stats
        this.performanceStats.minFrameTime = Math.min(this.performanceStats.minFrameTime, frameTime);
        this.performanceStats.maxFrameTime = Math.max(this.performanceStats.maxFrameTime, frameTime);
        this.performanceStats.avgFrameTime = this.getAverageFrameTime();
        
        // Track dropped frames (frames that took longer than target)
        if (frameTime > this.frameTimeTarget * 1.5) {
            this.performanceStats.droppedFrames++;
        }
        
        this.lastFrameTime = frameTime;
    }

    /**
     * Draw dirty regions only for minimal redraws
     */
    drawMazeDirtyRegions(maze) {
        if (this.dirtyRegions.length === 0) return;
        
        this.dirtyRegions.forEach(region => {
            // Clear the dirty region
            this.ctx.clearRect(region.x, region.y, region.width, region.height);
            
            // Redraw only the affected cells
            const worldRegion = this.screenToWorldRegion(region);
            this.drawMazeRegion(maze, worldRegion);
        });
        
        // Clear dirty regions after drawing
        this.dirtyRegions = [];
    }

    /**
     * Convert screen region to world coordinates
     */
    screenToWorldRegion(screenRegion) {
        const topLeft = this.screenToWorld(screenRegion.x, screenRegion.y);
        const bottomRight = this.screenToWorld(
            screenRegion.x + screenRegion.width,
            screenRegion.y + screenRegion.height
        );
        
        return {
            minX: Math.floor(topLeft.x),
            minY: Math.floor(topLeft.y),
            maxX: Math.ceil(bottomRight.x),
            maxY: Math.ceil(bottomRight.y)
        };
    }

    /**
     * Draw specific maze region
     */
    drawMazeRegion(maze, region) {
        for (let y = region.minY; y <= region.maxY; y++) {
            for (let x = region.minX; x <= region.maxX; x++) {
                if (x < 0 || x >= maze.width || y < 0 || y >= maze.height) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                
                switch (cellType) {
                    case 0: // Wall
                        this.drawGridCell(x, y, this.currentTheme.wall);
                        break;
                    case 1: // Path
                        this.drawGridCell(x, y, this.currentTheme.path);
                        break;
                    case 2: // Start
                        this.drawGridCell(x, y, this.currentTheme.path);
                        this.spriteRenderer.drawSprite('start', x, y);
                        break;
                    case 3: // Exit
                        this.drawGridCell(x, y, this.currentTheme.path);
                        this.spriteRenderer.drawSprite('exit', x, y);
                        break;
                }
            }
        }
    }

    /**
     * Mark region as dirty for next frame
     */
    markDirtyRegion(worldX, worldY, width = 1, height = 1) {
        const screenPos = this.worldToScreen(worldX, worldY);
        
        this.dirtyRegions.push({
            x: Math.floor(screenPos.x),
            y: Math.floor(screenPos.y),
            width: width * this.gridSize,
            height: height * this.gridSize
        });
    }

    /**
     * Force full redraw on next frame
     */
    forceFullRedraw() {
        this.fullRedrawRequired = true;
        this.dirtyRegions = [];
    }

    /**
     * Get current performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            currentFPS: Math.round(1000 / this.getAverageFrameTime()),
            performanceMode: this.performanceMode,
            visibleCellsCount: this.visibleCells.size,
            drawCallsLastFrame: this.lastFrameDrawCalls,
            frameTimeTarget: this.frameTimeTarget
        };
    }

    /**
     * Set performance mode manually
     */
    setPerformanceMode(mode) {
        const validModes = ['high', 'balanced', 'performance', 'auto'];
        if (validModes.includes(mode)) {
            this.performanceMode = mode;
            this.forceFullRedraw(); // Redraw with new quality settings
            console.log(`Performance mode set to: ${mode}`);
        } else {
            console.warn(`Invalid performance mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
        }
    }

    /**
     * Enable or disable frustum culling
     */
    setFrustumCulling(enabled) {
        this.frustumCulling = enabled;
        this.forceFullRedraw();
        console.log(`Frustum culling ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Adjust culling margin for performance tuning
     */
    setCullingMargin(margin) {
        this.cullingMargin = Math.max(0, margin);
        this.forceFullRedraw();
        console.log(`Culling margin set to: ${margin}`);
    }

    /**
     * Reset performance statistics
     */
    resetPerformanceStats() {
        this.performanceStats = {
            avgFrameTime: 0,
            minFrameTime: Infinity,
            maxFrameTime: 0,
            droppedFrames: 0,
            totalFrames: 0,
            culledCells: 0,
            visibleCells: 0
        };
        this.frameTimeHistory = new Array(this.frameTimeHistorySize).fill(16.67);
        console.log('Performance statistics reset');
    }

    /**
     * Update viewport with performance considerations
     */
    updateViewport() {
        const oldWidth = this.viewport.width;
        const oldHeight = this.viewport.height;
        
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
        
        // Update offscreen canvas if size changed
        if (this.useOffscreenRendering && 
            (oldWidth !== this.viewport.width || oldHeight !== this.viewport.height)) {
            this.resizeOffscreenCanvas();
        }
        
        // Force redraw if viewport changed
        if (oldWidth !== this.viewport.width || oldHeight !== this.viewport.height) {
            this.forceFullRedraw();
        }
    }

    /**
     * Resize offscreen canvas to match main canvas
     */
    resizeOffscreenCanvas() {
        if (!this.offscreenCanvas) return;

        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        
        // Reconfigure pixel art rendering
        if (this.offscreenCtx) {
            this.offscreenCtx.imageSmoothingEnabled = false;
            this.offscreenCtx.webkitImageSmoothingEnabled = false;
            this.offscreenCtx.mozImageSmoothingEnabled = false;
            this.offscreenCtx.msImageSmoothingEnabled = false;
        }
        
        console.log('Offscreen canvas resized');
    }

    /**
     * Render performance overlay for debugging
     */
    renderPerformanceOverlay() {
        if (this.performanceMode === 'performance') return; // Skip in performance mode

        const stats = this.getPerformanceStats();
        const x = 10;
        let y = 10;
        const lineHeight = 16;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 5, y - 5, 200, 120);

        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';

        this.ctx.fillText(`FPS: ${stats.currentFPS}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Frame Time: ${stats.avgFrameTime.toFixed(2)}ms`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Mode: ${stats.performanceMode}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Visible Cells: ${stats.visibleCellsCount}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Draw Calls: ${stats.drawCallsLastFrame}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Dropped Frames: ${stats.droppedFrames}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Culled Cells: ${stats.culledCells}`, x, y);
    }

    /**
     * Start frame timing
     */
    startFrame() {
        this.frameStartTime = performance.now();
    }

    /**
     * End frame timing and update statistics
     */
    endFrame() {
        if (this.frameStartTime) {
            const frameTime = performance.now() - this.frameStartTime;
            this.updateFrameTimeStats(frameTime);
        }
    }
}

/**
 * Base class for visual effects
 */
class VisualEffect {
    constructor(worldX, worldY, duration, renderer) {
        this.worldX = worldX;
        this.worldY = worldY;
        this.duration = duration;
        this.renderer = renderer;
        this.elapsed = 0;
        this.completed = false;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.completed = true;
        }
    }

    isComplete() {
        return this.completed;
    }

    getProgress() {
        return Math.min(this.elapsed / this.duration, 1);
    }

    render() {
        // Override in subclasses
    }
}

/**
 * Fragment collection effect with sparkles and fade
 */
class FragmentCollectionEffect extends VisualEffect {
    constructor(worldX, worldY, renderer) {
        super(worldX, worldY, 1000, renderer); // 1 second duration
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        // Create sparkle particles
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.worldX + 0.5,
                y: this.worldY + 0.5,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.8 + Math.random() * 0.4,
                size: 2 + Math.random() * 3,
                color: GAME_COLORS.FRAGMENT
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.vx * deltaTime * 0.01;
            particle.y += particle.vy * deltaTime * 0.01;
            particle.life -= particle.decay * deltaTime * 0.001;
            particle.vy += 0.1; // Gravity effect
        });
        
        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0);
    }

    render() {
        const progress = this.getProgress();
        
        // Render collection flash
        if (progress < 0.2) {
            const flashIntensity = (0.2 - progress) / 0.2;
            const screenPos = this.renderer.worldToScreen(this.worldX + 0.5, this.worldY + 0.5);
            
            const gradient = this.renderer.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, this.renderer.gridSize * 2
            );
            gradient.addColorStop(0, ColorUtils.withAlpha(GAME_COLORS.FRAGMENT, 0.8 * flashIntensity));
            gradient.addColorStop(1, ColorUtils.withAlpha(GAME_COLORS.FRAGMENT, 0));
            
            this.renderer.ctx.fillStyle = gradient;
            this.renderer.ctx.fillRect(
                screenPos.x - this.renderer.gridSize * 2,
                screenPos.y - this.renderer.gridSize * 2,
                this.renderer.gridSize * 4,
                this.renderer.gridSize * 4
            );
        }
        
        // Render particles
        this.particles.forEach(particle => {
            const screenPos = this.renderer.worldToScreen(particle.x, particle.y);
            
            this.renderer.ctx.fillStyle = ColorUtils.withAlpha(particle.color, particle.life);
            this.renderer.ctx.fillRect(
                screenPos.x - particle.size / 2,
                screenPos.y - particle.size / 2,
                particle.size,
                particle.size
            );
        });
    }
}

/**
 * Objective completion effect with expanding rings
 */
class ObjectiveCompletionEffect extends VisualEffect {
    constructor(worldX, worldY, objectiveType, renderer) {
        super(worldX, worldY, 1500, renderer); // 1.5 second duration
        this.objectiveType = objectiveType;
        this.rings = [];
        this.createRings();
    }

    createRings() {
        const colors = {
            'virgilio': GAME_COLORS.VIRGILIO,
            'fragment': GAME_COLORS.FRAGMENT,
            'exit': GAME_COLORS.EXIT
        };
        
        const color = colors[this.objectiveType] || GAME_COLORS.LIGHT_GOLD;
        
        // Create expanding rings
        for (let i = 0; i < 3; i++) {
            this.rings.push({
                delay: i * 200,
                maxRadius: (i + 1) * this.renderer.gridSize * 1.5,
                color: color,
                started: false
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Start rings based on delay
        this.rings.forEach(ring => {
            if (!ring.started && this.elapsed >= ring.delay) {
                ring.started = true;
                ring.startTime = this.elapsed;
            }
        });
    }

    render() {
        const screenPos = this.renderer.worldToScreen(this.worldX + 0.5, this.worldY + 0.5);
        
        this.rings.forEach(ring => {
            if (!ring.started) return;
            
            const ringProgress = Math.min((this.elapsed - ring.startTime) / (this.duration - ring.delay), 1);
            const radius = ring.maxRadius * ringProgress;
            const alpha = (1 - ringProgress) * 0.6;
            
            if (alpha > 0) {
                this.renderer.ctx.strokeStyle = ColorUtils.withAlpha(ring.color, alpha);
                this.renderer.ctx.lineWidth = 3;
                this.renderer.ctx.beginPath();
                this.renderer.ctx.arc(screenPos.x, screenPos.y, radius, 0, 2 * Math.PI);
                this.renderer.ctx.stroke();
            }
        });
    }
}

/**
 * Highlight effect for interactive elements
 */
class HighlightEffect extends VisualEffect {
    constructor(worldX, worldY, highlightType, renderer) {
        super(worldX, worldY, Infinity, renderer); // Persistent until removed
        this.highlightType = highlightType;
        this.pulsePhase = 0;
    }

    update(deltaTime) {
        this.pulsePhase += deltaTime * 0.003; // Slow pulse
    }

    render() {
        const screenPos = this.renderer.worldToScreen(this.worldX, this.worldY);
        const pulse = 0.5 + 0.5 * Math.sin(this.pulsePhase);
        
        let color, intensity;
        switch (this.highlightType) {
            case 'interactive':
                color = GAME_COLORS.LIGHT_GOLD;
                intensity = 0.3;
                break;
            case 'objective':
                color = GAME_COLORS.LIGHT_WARM;
                intensity = 0.4;
                break;
            case 'danger':
                color = GAME_COLORS.STATUS_BLOCKED;
                intensity = 0.5;
                break;
            default:
                color = GAME_COLORS.LIGHT_GOLD;
                intensity = 0.3;
        }
        
        // Draw pulsing border
        this.renderer.ctx.strokeStyle = ColorUtils.withAlpha(color, intensity * pulse);
        this.renderer.ctx.lineWidth = 2;
        this.renderer.ctx.strokeRect(
            screenPos.x - 2,
            screenPos.y - 2,
            this.renderer.gridSize + 4,
            this.renderer.gridSize + 4
        );
        
        // Draw subtle glow
        const gradient = this.renderer.ctx.createRadialGradient(
            screenPos.x + this.renderer.gridSize / 2,
            screenPos.y + this.renderer.gridSize / 2,
            0,
            screenPos.x + this.renderer.gridSize / 2,
            screenPos.y + this.renderer.gridSize / 2,
            this.renderer.gridSize
        );
        gradient.addColorStop(0, ColorUtils.withAlpha(color, 0.1 * pulse));
        gradient.addColorStop(1, ColorUtils.withAlpha(color, 0));
        
        this.renderer.ctx.fillStyle = gradient;
        this.renderer.ctx.fillRect(
            screenPos.x - this.renderer.gridSize / 2,
            screenPos.y - this.renderer.gridSize / 2,
            this.renderer.gridSize * 2,
            this.renderer.gridSize * 2
        );
    }
}

/**
 * Smooth transition effect between positions
 */
class TransitionEffect extends VisualEffect {
    constructor(fromX, fromY, toX, toY, duration, effectType, renderer) {
        super(fromX, fromY, duration, renderer);
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.effectType = effectType;
    }

    render() {
        const progress = this.getProgress();
        const easedProgress = this.easeInOutCubic(progress);
        
        // Interpolate position
        const currentX = this.fromX + (this.toX - this.fromX) * easedProgress;
        const currentY = this.fromY + (this.toY - this.fromY) * easedProgress;
        
        const screenPos = this.renderer.worldToScreen(currentX + 0.5, currentY + 0.5);
        
        switch (this.effectType) {
            case 'fade':
                this.renderFadeEffect(screenPos, progress);
                break;
            case 'trail':
                this.renderTrailEffect(screenPos, progress);
                break;
            case 'spark':
                this.renderSparkEffect(screenPos, progress);
                break;
        }
    }

    renderFadeEffect(screenPos, progress) {
        const alpha = 1 - progress;
        this.renderer.ctx.fillStyle = ColorUtils.withAlpha(GAME_COLORS.LIGHT_GOLD, alpha * 0.5);
        this.renderer.ctx.fillRect(
            screenPos.x - this.renderer.gridSize / 2,
            screenPos.y - this.renderer.gridSize / 2,
            this.renderer.gridSize,
            this.renderer.gridSize
        );
    }

    renderTrailEffect(screenPos, progress) {
        // Draw trail particles
        for (let i = 0; i < 5; i++) {
            const trailProgress = progress - i * 0.1;
            if (trailProgress <= 0) continue;
            
            const trailX = this.fromX + (this.toX - this.fromX) * trailProgress;
            const trailY = this.fromY + (this.toY - this.fromY) * trailProgress;
            const trailScreenPos = this.renderer.worldToScreen(trailX + 0.5, trailY + 0.5);
            
            const alpha = (1 - trailProgress) * 0.3;
            this.renderer.ctx.fillStyle = ColorUtils.withAlpha(GAME_COLORS.LIGHT_WARM, alpha);
            this.renderer.ctx.fillRect(
                trailScreenPos.x - 2,
                trailScreenPos.y - 2,
                4,
                4
            );
        }
    }

    renderSparkEffect(screenPos, progress) {
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2;
            const distance = 20 * progress;
            const sparkX = screenPos.x + Math.cos(angle) * distance;
            const sparkY = screenPos.y + Math.sin(angle) * distance;
            
            this.renderer.ctx.fillStyle = ColorUtils.withAlpha(GAME_COLORS.LIGHT_GOLD, 1 - progress);
            this.renderer.ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }


    /**
     * Update frame time statistics for performance monitoring
     */
    updateFrameTimeStats(frameTime) {
        this.performanceStats.totalFrames++;
        
        // Update frame time history
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.frameTimeHistorySize) {
            this.frameTimeHistory.shift();
        }
        
        // Update performance stats
        this.performanceStats.minFrameTime = Math.min(this.performanceStats.minFrameTime, frameTime);
        this.performanceStats.maxFrameTime = Math.max(this.performanceStats.maxFrameTime, frameTime);
        this.performanceStats.avgFrameTime = this.getAverageFrameTime();
        
        // Track dropped frames (frames that took longer than target)
        if (frameTime > this.frameTimeTarget * 1.5) {
            this.performanceStats.droppedFrames++;
        }
        
        this.lastFrameTime = frameTime;
    }

    /**
     * Draw dirty regions only for minimal redraws
     */
    drawMazeDirtyRegions(maze) {
        if (this.dirtyRegions.length === 0) return;
        
        this.dirtyRegions.forEach(region => {
            // Clear the dirty region
            this.ctx.clearRect(region.x, region.y, region.width, region.height);
            
            // Redraw only the affected cells
            const worldRegion = this.screenToWorldRegion(region);
            this.drawMazeRegion(maze, worldRegion);
        });
        
        // Clear dirty regions after drawing
        this.dirtyRegions = [];
    }

    /**
     * Convert screen region to world coordinates
     */
    screenToWorldRegion(screenRegion) {
        const topLeft = this.screenToWorld(screenRegion.x, screenRegion.y);
        const bottomRight = this.screenToWorld(
            screenRegion.x + screenRegion.width,
            screenRegion.y + screenRegion.height
        );
        
        return {
            minX: Math.floor(topLeft.x),
            minY: Math.floor(topLeft.y),
            maxX: Math.ceil(bottomRight.x),
            maxY: Math.ceil(bottomRight.y)
        };
    }

    /**
     * Draw specific maze region
     */
    drawMazeRegion(maze, region) {
        for (let y = region.minY; y <= region.maxY; y++) {
            for (let x = region.minX; x <= region.maxX; x++) {
                if (x < 0 || x >= maze.width || y < 0 || y >= maze.height) continue;
                
                const cellType = maze.cells[y] ? maze.cells[y][x] : 0;
                
                switch (cellType) {
                    case 0: // Wall
                        this.drawGridCell(x, y, this.currentTheme.wall);
                        break;
                    case 1: // Path
                        this.drawGridCell(x, y, this.currentTheme.path);
                        break;
                    case 2: // Start
                        this.drawGridCell(x, y, this.currentTheme.path);
                        this.spriteRenderer.drawSprite('start', x, y);
                        break;
                    case 3: // Exit
                        this.drawGridCell(x, y, this.currentTheme.path);
                        this.spriteRenderer.drawSprite('exit', x, y);
                        break;
                }
            }
        }
    }

    /**
     * Mark region as dirty for next frame
     */
    markDirtyRegion(worldX, worldY, width = 1, height = 1) {
        const screenPos = this.worldToScreen(worldX, worldY);
        
        this.dirtyRegions.push({
            x: Math.floor(screenPos.x),
            y: Math.floor(screenPos.y),
            width: width * this.gridSize,
            height: height * this.gridSize
        });
    }

    /**
     * Force full redraw on next frame
     */
    forceFullRedraw() {
        this.fullRedrawRequired = true;
        this.dirtyRegions = [];
    }

    /**
     * Get current performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            currentFPS: Math.round(1000 / this.getAverageFrameTime()),
            performanceMode: this.performanceMode,
            visibleCellsCount: this.visibleCells.size,
            drawCallsLastFrame: this.lastFrameDrawCalls,
            frameTimeTarget: this.frameTimeTarget
        };
    }

    /**
     * Set performance mode manually
     */
    setPerformanceMode(mode) {
        const validModes = ['high', 'balanced', 'performance', 'auto'];
        if (validModes.includes(mode)) {
            this.performanceMode = mode;
            this.forceFullRedraw(); // Redraw with new quality settings
            console.log(`Performance mode set to: ${mode}`);
        } else {
            console.warn(`Invalid performance mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
        }
    }

    /**
     * Enable or disable frustum culling
     */
    setFrustumCulling(enabled) {
        this.frustumCulling = enabled;
        this.forceFullRedraw();
        console.log(`Frustum culling ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Adjust culling margin for performance tuning
     */
    setCullingMargin(margin) {
        this.cullingMargin = Math.max(0, margin);
        this.forceFullRedraw();
        console.log(`Culling margin set to: ${margin}`);
    }

    /**
     * Reset performance statistics
     */
    resetPerformanceStats() {
        this.performanceStats = {
            avgFrameTime: 0,
            minFrameTime: Infinity,
            maxFrameTime: 0,
            droppedFrames: 0,
            totalFrames: 0,
            culledCells: 0,
            visibleCells: 0
        };
        this.frameTimeHistory = new Array(this.frameTimeHistorySize).fill(16.67);
        console.log('Performance statistics reset');
    }

    /**
     * Update viewport with performance considerations
     */
    updateViewport() {
        const oldWidth = this.viewport.width;
        const oldHeight = this.viewport.height;
        
        this.viewport.width = this.canvas.width;
        this.viewport.height = this.canvas.height;
        
        // Update offscreen canvas if size changed
        if (this.useOffscreenRendering && 
            (oldWidth !== this.viewport.width || oldHeight !== this.viewport.height)) {
            this.resizeOffscreenCanvas();
        }
        
        // Force redraw if viewport changed
        if (oldWidth !== this.viewport.width || oldHeight !== this.viewport.height) {
            this.forceFullRedraw();
        }
    }

    /**
     * Resize offscreen canvas to match main canvas
     */
    resizeOffscreenCanvas() {
        if (!this.offscreenCanvas) return;
        
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        
        // Reconfigure pixel art settings
        if (this.offscreenCtx) {
            this.offscreenCtx.imageSmoothingEnabled = false;
            this.offscreenCtx.webkitImageSmoothingEnabled = false;
            this.offscreenCtx.mozImageSmoothingEnabled = false;
            this.offscreenCtx.msImageSmoothingEnabled = false;
        }
    }

    /**
     * Render performance overlay for debugging
     */
    renderPerformanceOverlay() {
        if (this.performanceMode === 'performance') return; // Skip in performance mode
        
        const stats = this.getPerformanceStats();
        const x = 10;
        let y = 10;
        const lineHeight = 16;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 5, y - 5, 200, 120);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`FPS: ${stats.currentFPS}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Frame Time: ${stats.avgFrameTime.toFixed(2)}ms`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Mode: ${stats.performanceMode}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Visible Cells: ${stats.visibleCellsCount}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Draw Calls: ${stats.drawCallsLastFrame}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Dropped Frames: ${stats.droppedFrames}`, x, y);
        y += lineHeight;
        this.ctx.fillText(`Culled Cells: ${stats.culledCells}`, x, y);
    }

    /**
     * Start frame timing
     */
    startFrame() {
        this.frameStartTime = performance.now();
        this.lastFrameDrawCalls = this.drawCalls;
        this.drawCalls = 0;
    }

    /**
     * End frame timing and update statistics
     */
    endFrame() {
        if (this.frameStartTime) {
            const frameTime = performance.now() - this.frameStartTime;
            this.updateFrameTimeStats(frameTime);
        }
    }
}