/**
 * Core Game Engine
 * Manages the main game loop, state, and system coordination
 */

// Game state constants
export const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LOADING: 'loading',
    GAME_OVER: 'game_over'
};

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Game loop state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        this.accumulator = 0;
        
        // Game state management
        this.currentState = GAME_STATES.LOADING;
        this.previousState = null;
        this.gameState = {
            currentLevel: 1,
            playerPosition: { x: 0, y: 0 },
            collectedItems: [],
            objectivesCompleted: {
                virgilioFound: false,
                fragmentsCollected: 0,
                exitUnlocked: false
            },
            gameSettings: {
                volume: 0.7,
                difficulty: 'normal'
            },
            gameStats: {
                playTime: 0,
                deathCount: 0,
                dialoguesSeen: []
            },
            currentMaze: null,
            levelProgress: []
        };
        
        // Systems will be initialized in init()
        this.renderer = null;
        this.inputManager = null;
        this.audioManager = null;
        this.audioService = null;
        this.levelManager = null;
        this.player = null;
        this.objectiveManager = null;
        this.progressPanel = null;
        this.menuSystem = null;
        this.saveManager = null;
        
        // Performance monitoring
        this.frameCount = 0;
        this.fpsCounter = 0;
        this.lastFPSUpdate = 0;
    }

    /**
     * Initialize all game systems
     */
    async init() {
        try {
            console.log('Initializing GameEngine...');
            
            // Set initial state
            this.setState(GAME_STATES.LOADING);
            
            // Initialize canvas settings for pixel art
            this.setupCanvas();
            
            // Initialize core systems
            await this.initializeCoreSystem();
            
            // Initialize UI systems
            await this.initializeUISystems();
            
            // Initialize AudioManager
            await this.initializeAudioSystem();
            
            console.log('GameEngine initialized successfully');
            
            // Transition to menu state
            this.setState(GAME_STATES.MENU);
            
        } catch (error) {
            console.error('Failed to initialize GameEngine:', error);
            throw error;
        }
    }

    /**
     * Initialize core game systems (Renderer, InputManager, etc.)
     */
    async initializeCoreSystem() {
        try {
            // Import and initialize Renderer
            const { Renderer } = await import('./renderer.js');
            this.renderer = new Renderer(this.canvas, this.ctx);
            this.renderer.init();
            
            // Import and initialize InputManager
            const { InputManager } = await import('./inputManager.js');
            this.inputManager = new InputManager();
            this.inputManager.init();
            
            // Set up input callbacks for menu navigation
            this.setupInputCallbacks();
            
            console.log('Core systems initialized');
            
        } catch (error) {
            console.error('Failed to initialize core systems:', error);
            throw error;
        }
    }

    /**
     * Set up input callbacks for game navigation
     */
    setupInputCallbacks() {
        // El InputManager usa un sistema de buffer, procesaremos la entrada en update()
        console.log('Input callbacks configured for buffer-based input processing');
    }

    /**
     * Initialize UI systems including ProgressPanel and MenuSystem
     */
    async initializeUISystems() {
        try {
            // Import and initialize ProgressPanel
            const { ProgressPanel } = await import('../ui/progressPanel.js');
            this.progressPanel = new ProgressPanel();
            this.progressPanel.init();
            
            // Import and initialize MenuSystem
            const { MenuSystem } = await import('../ui/menuSystem.js');
            this.menuSystem = new MenuSystem(this);
            this.menuSystem.init();
            
            // Set up menu callbacks
            this.setupMenuCallbacks();
            
            // Import and initialize ObjectiveManager for progress tracking
            const { ObjectiveManager } = await import('../game/objectives.js');
            this.objectiveManager = new ObjectiveManager();
            
            // Set up callbacks for real-time progress updates
            this.setupProgressCallbacks();
            
            console.log('UI systems initialized');
            
        } catch (error) {
            console.error('Failed to initialize UI systems:', error);
            throw error;
        }
    }

    /**
     * Initialize audio system
     */
    async initializeAudioSystem() {
        try {
            // Import and initialize AudioManager
            const { AudioManager } = await import('./audioManager.js');
            this.audioManager = new AudioManager();
            await this.audioManager.init();
            
            // Import and initialize AudioService
            const { AudioService } = await import('./audioService.js');
            this.audioService = new AudioService();
            await this.audioService.init(this.audioManager);
            
            // Set initial volume from game settings
            if (this.gameState.gameSettings.volume !== undefined) {
                this.audioManager.setVolume(this.gameState.gameSettings.volume);
            }
            
            console.log('Audio system initialized');
            
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            // Audio is not critical, continue without it
            this.audioManager = null;
            this.audioService = null;
        }
    }

    /**
     * Set up callbacks for menu system
     */
    setupMenuCallbacks() {
        if (this.menuSystem) {
            this.menuSystem.setCallbacks({
                onNewGame: () => {
                    this.startNewGame();
                },
                onContinueGame: () => {
                    this.loadSavedGame();
                },
                onResetGame: () => {
                    this.resetGameData();
                },
                onSettingsChange: (setting) => {
                    this.handleSettingsChange(setting);
                }
            });
        }
    }

    /**
     * Load saved game
     */
    async loadSavedGame() {
        try {
            const { SaveManager } = await import('../data/saveManager.js');
            this.saveManager = new SaveManager();
            
            // Initialize auto-save system and restore state
            const savedState = this.saveManager.initializeAutoSave();
            
            if (savedState) {
                await this.loadState(savedState);
                // Set up auto-save triggers after successful load
                this.setupAutoSave();
            } else {
                console.warn('No saved game found');
                await this.startNewGame();
            }
        } catch (error) {
            console.error('Failed to load saved game:', error);
            await this.startNewGame();
        }
    }

    /**
     * Reset game data
     */
    async resetGameData() {
        try {
            if (!this.saveManager) {
                const { SaveManager } = await import('../data/saveManager.js');
                this.saveManager = new SaveManager();
            }
            
            this.saveManager.clearSave();
            
            // Start fresh game
            await this.startNewGame();
            
        } catch (error) {
            console.error('Failed to reset game data:', error);
        }
    }

    /**
     * Handle settings changes from menu
     */
    handleSettingsChange(setting) {
        switch (setting.type) {
            case 'volume':
                if (this.audioManager) {
                    this.audioManager.setVolume(setting.value);
                }
                // Update game settings
                this.gameState.gameSettings.volume = setting.value;
                break;
            default:
                console.warn('Unknown setting type:', setting.type);
        }
    }

    /**
     * Set up callbacks for real-time progress updates
     */
    setupProgressCallbacks() {
        if (this.objectiveManager && this.progressPanel) {
            this.objectiveManager.setCallbacks({
                onVirgiliofound: () => {
                    this.progressPanel.updateVirgilio(true);
                    this.progressPanel.showCompletionFeedback('virgilio');
                },
                onFragmentCollected: (collected, total) => {
                    this.progressPanel.updateFragments(collected, total);
                    this.progressPanel.showCompletionFeedback('fragment');
                },
                onExitUnlocked: () => {
                    this.progressPanel.updateExit(true);
                    this.progressPanel.showCompletionFeedback('exit');
                },
                onObjectiveUpdate: (status) => {
                    this.updateProgressPanel(status);
                }
            });
        }
    }

    /**
     * Set up canvas for pixel art rendering
     */
    setupCanvas() {
        // Disable image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Set canvas to crisp edges
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
        
        console.log('Canvas configured for pixel art rendering');
    }

    /**
     * Start the game loop
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
            console.log('Game loop started');
        }
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        
        // End current session for statistics
        this.endSession();
        
        // Clean up auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        // Perform final auto-save before stopping
        if (this.saveManager && this.gameState) {
            this.saveManager.forceSave(this.gameState);
        }
        
        console.log('Game loop stopped');
    }

    /**
     * Main game loop with fixed timestep and performance monitoring
     */
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        // Calculate delta time in milliseconds
        this.deltaTime = Math.min(currentTime - this.lastTime, 100); // Cap at 100ms to prevent spiral of death
        this.lastTime = currentTime;

        // Update FPS counter
        this.updateFPS(currentTime);

        // Start frame timing for performance monitoring
        if (this.renderer) {
            this.renderer.startFrame();
        }

        if (!this.isPaused && this.currentState !== GAME_STATES.LOADING) {
            // Fixed timestep update loop
            this.accumulator += this.deltaTime;
            
            while (this.accumulator >= this.frameTime) {
                this.update(this.frameTime);
                this.accumulator -= this.frameTime;
            }
            
            // Render with interpolation factor
            const interpolation = this.accumulator / this.frameTime;
            this.render(interpolation);
        } else if (this.currentState === GAME_STATES.LOADING) {
            // Still render loading screen
            this.render(0);
        }

        // End frame timing
        if (this.renderer) {
            this.renderer.endFrame();
        }

        // Continue the loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Update FPS counter for performance monitoring
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fpsCounter = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
    }

    /**
     * Update game state based on current state
     */
    update(deltaTime) {
        // Process input from InputManager
        this.processInput();
        
        // Update game stats with accurate timing
        if (this.currentState === GAME_STATES.PLAYING && this.saveManager) {
            this.saveManager.updateStatistics(this.gameState, 'incrementPlayTime', deltaTime);
        }

        // State-specific updates
        switch (this.currentState) {
            case GAME_STATES.MENU:
                this.updateMenu(deltaTime);
                break;
            case GAME_STATES.PLAYING:
                this.updateGameplay(deltaTime);
                break;
            case GAME_STATES.PAUSED:
                this.updatePaused(deltaTime);
                break;
            case GAME_STATES.GAME_OVER:
                this.updateGameOver(deltaTime);
                break;
        }
    }

    /**
     * Process input from InputManager
     */
    processInput() {
        if (!this.inputManager) return;
        
        const inputBuffer = this.inputManager.getInputBuffer();
        
        for (const inputEvent of inputBuffer) {
            if (inputEvent.type === 'keydown') {
                this.handleKeyDown(inputEvent);
            }
        }
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(inputEvent) {
        const { action, keyCode } = inputEvent;
        
        switch (this.currentState) {
            case GAME_STATES.MENU:
                if (action === 'action' || keyCode === 'Space') {
                    console.log('Starting new game...');
                    this.startNewGame();
                }
                break;
                
            case GAME_STATES.PLAYING:
                if (action === 'menu' || keyCode === 'Escape') {
                    this.pause();
                }
                break;
                
            case GAME_STATES.PAUSED:
                if (action === 'menu' || keyCode === 'Escape') {
                    this.resume();
                }
                break;
        }
    }

    /**
     * Update menu state
     */
    updateMenu(deltaTime) {
        // Show menu if not visible
        if (this.menuSystem && !this.menuSystem.isMenuVisible) {
            this.menuSystem.showMenu();
        }
    }

    /**
     * Update gameplay state
     */
    updateGameplay(deltaTime) {
        // Game logic updates will be implemented in subsequent tasks
        // This includes player movement, collision detection, objectives, etc.
        
        // Update progress panel with current game state
        this.updateProgressPanel();
    }

    /**
     * Update progress panel with current game state
     */
    updateProgressPanel(objectiveStatus = null) {
        if (!this.progressPanel) return;

        // Use provided status or get current status from objective manager
        const status = objectiveStatus || (this.objectiveManager ? this.objectiveManager.getObjectiveStatus() : null);
        
        if (status) {
            this.progressPanel.updateAll({
                virgilioFound: status.virgilioFound,
                fragmentsCollected: status.fragmentsCollected,
                totalFragments: status.totalFragments,
                exitUnlocked: status.exitUnlocked,
                currentLevel: this.gameState.currentLevel,
                levelName: this.getCurrentLevelName()
            });
        } else {
            // Fallback to game state data
            this.progressPanel.updateAll({
                virgilioFound: this.gameState.objectivesCompleted.virgilioFound,
                fragmentsCollected: this.gameState.objectivesCompleted.fragmentsCollected,
                totalFragments: 3, // Default value
                exitUnlocked: this.gameState.objectivesCompleted.exitUnlocked,
                currentLevel: this.gameState.currentLevel,
                levelName: this.getCurrentLevelName()
            });
        }
    }

    /**
     * Get current level name based on level number
     */
    getCurrentLevelName() {
        const levelNames = {
            1: 'Bosque Oscuro',
            2: 'Limbo',
            3: 'Lujuria',
            4: 'Gula',
            5: 'Avaricia',
            6: 'Ira',
            7: 'Herejía',
            8: 'Violencia',
            9: 'Fraude',
            10: 'Traición'
        };
        
        return levelNames[this.gameState.currentLevel] || `Círculo ${this.gameState.currentLevel}`;
    }

    /**
     * Update paused state
     */
    updatePaused(deltaTime) {
        // Paused state typically doesn't update game logic
        // But might update UI animations or pause menu
    }

    /**
     * Update game over state
     */
    updateGameOver(deltaTime) {
        // Game over screen updates
    }

    /**
     * Render current frame with interpolation
     */
    render(interpolation = 0) {
        // Clear canvas with black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // State-specific rendering
        switch (this.currentState) {
            case GAME_STATES.LOADING:
                this.renderLoading();
                break;
            case GAME_STATES.MENU:
                this.renderMenu();
                break;
            case GAME_STATES.PLAYING:
                this.renderGameplay(interpolation);
                break;
            case GAME_STATES.PAUSED:
                this.renderGameplay(interpolation);
                this.renderPauseOverlay();
                break;
            case GAME_STATES.GAME_OVER:
                this.renderGameOver();
                break;
        }

        // Render debug info in development
        if (process.env.NODE_ENV === 'development') {
            this.renderDebugInfo();
        }

        // Render performance overlay if enabled
        if (this.showPerformanceOverlay && this.renderer && this.renderer.renderPerformanceOverlay) {
            this.renderer.renderPerformanceOverlay();
        }
    }

    /**
     * Render loading screen
     */
    renderLoading() {
        this.ctx.fillStyle = '#2d1810';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Cargando...', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Render menu screen
     */
    renderMenu() {
        this.ctx.fillStyle = '#2d1810';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Inferno Pixelado', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '16px monospace';
        this.ctx.fillText('Presiona ESPACIO para comenzar', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    /**
     * Render gameplay
     */
    renderGameplay(interpolation) {
        // Gameplay rendering will be implemented in task 2.2
        // For now, just show a placeholder
        this.ctx.fillStyle = '#2d1810';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#DEB887';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Modo de Juego - Implementación Pendiente', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Render pause overlay
     */
    renderPauseOverlay() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Render game over screen
     */
    renderGameOver() {
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Fin del Juego', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Render debug information
     */
    renderDebugInfo() {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fpsCounter}`, 10, 20);
        this.ctx.fillText(`State: ${this.currentState}`, 10, 35);
        this.ctx.fillText(`Delta: ${this.deltaTime.toFixed(2)}ms`, 10, 50);
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.currentState === GAME_STATES.PLAYING) {
            this.setState(GAME_STATES.PAUSED);
            console.log('Game paused');
        }
    }

    /**
     * Resume the game
     */
    resume() {
        if (this.currentState === GAME_STATES.PAUSED) {
            this.setState(GAME_STATES.PLAYING);
            console.log('Game resumed');
        }
    }

    /**
     * Set game state with validation
     */
    setState(newState) {
        if (Object.values(GAME_STATES).includes(newState)) {
            this.previousState = this.currentState;
            this.currentState = newState;
            this.onStateChange(this.previousState, this.currentState);
        } else {
            console.error(`Invalid game state: ${newState}`);
        }
    }

    /**
     * Handle state transitions
     */
    onStateChange(previousState, currentState) {
        console.log(`State changed: ${previousState} -> ${currentState}`);
        
        // State-specific initialization
        switch (currentState) {
            case GAME_STATES.PLAYING:
                this.isPaused = false;
                if (this.menuSystem) {
                    this.menuSystem.hideMenu();
                }
                break;
            case GAME_STATES.PAUSED:
                this.isPaused = true;
                break;
            case GAME_STATES.MENU:
                this.isPaused = true;
                if (this.menuSystem) {
                    this.menuSystem.showMenu();
                }
                break;
        }
    }

    /**
     * Get current game state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Canvas resize handling will be implemented with renderer system
        // For now, just log the resize event
        console.log('Window resized');
    }

    /**
     * Load game state
     */
    async loadState(savedState) {
        try {
            // Validate saved state structure
            if (this.validateGameState(savedState)) {
                this.gameState = { ...this.gameState, ...savedState };
                
                // Initialize SaveManager if not already done
                if (!this.saveManager) {
                    const { SaveManager } = await import('../data/saveManager.js');
                    this.saveManager = new SaveManager();
                }
                
                // Track session start for loaded game
                this.saveManager.updateStatistics(this.gameState, 'sessionStart');
                
                // Restore objective manager state if available
                if (this.objectiveManager && savedState.objectiveManagerState) {
                    this.objectiveManager.loadState(savedState.objectiveManagerState);
                }
                
                // Update progress panel with loaded state
                if (this.progressPanel) {
                    this.updateProgressPanel();
                }
                
                console.log('Game state loaded successfully');
                this.setState(GAME_STATES.PLAYING);
            } else {
                console.warn('Invalid saved state, starting new game');
                await this.startNewGame();
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
            await this.startNewGame();
        }
    }

    /**
     * Validate game state structure
     */
    validateGameState(state) {
        if (!state || typeof state !== 'object') return false;
        
        // Check for required properties
        const requiredProps = ['currentLevel', 'playerPosition', 'objectivesCompleted'];
        return requiredProps.every(prop => prop in state);
    }

    /**
     * Start new game
     */
    async startNewGame() {
        try {
            console.log('Starting new game');
            
            // Reset game state to defaults with enhanced statistics
            this.gameState = {
                currentLevel: 1,
                playerPosition: { x: 0, y: 0 },
                collectedItems: [],
                objectivesCompleted: {
                    virgilioFound: false,
                    fragmentsCollected: 0,
                    exitUnlocked: false
                },
                gameSettings: {
                    volume: 0.7,
                    difficulty: 'normal'
                },
                gameStats: {
                    playTime: 0,
                    deathCount: 0,
                    dialoguesSeen: [],
                    sessionStartTime: Date.now(),
                    totalSessions: 0,
                    levelsCompleted: 0,
                    objectivesCompleted: 0,
                    fragmentsCollected: 0,
                    averageSessionTime: 0,
                    fastestLevelCompletion: {},
                    totalDistance: 0,
                    achievements: []
                },
                currentMaze: null,
                levelProgress: [],
                dialogueMetadata: {}
            };
            
            // Initialize SaveManager if not already done
            if (!this.saveManager) {
                const { SaveManager } = await import('../data/saveManager.js');
                this.saveManager = new SaveManager();
            }
            
            // Track new session start
            this.saveManager.updateStatistics(this.gameState, 'sessionStart');
            
            // Set up auto-save system for new game
            this.setupAutoSave();
            
            // Reset objective manager if it exists
            if (this.objectiveManager) {
                this.objectiveManager.reset(3); // Default 3 fragments for level 1
            }
            
            // Reset progress panel to initial state
            if (this.progressPanel) {
                this.progressPanel.reset();
                this.updateProgressPanel();
            }
            
            // Trigger initial auto-save for new game
            this.triggerAutoSave('newGame');
            
            // Initialize first level (will be implemented in subsequent tasks)
            // Cambiar al estado PLAYING solo cuando se inicia realmente el juego
            this.setState(GAME_STATES.PLAYING);
            
        } catch (error) {
            console.error('Failed to start new game:', error);
            throw error;
        }
    }

    /**
     * Auto-save game state
     */
    autoSave() {
        try {
            if (this.saveManager && this.gameState) {
                return this.saveManager.autoSave(this.gameState);
            } else {
                console.warn('Auto-save not available - SaveManager or gameState missing');
                return false;
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
            return false;
        }
    }

    /**
     * Set up auto-save system with triggers
     */
    setupAutoSave() {
        if (!this.saveManager) {
            console.warn('Cannot setup auto-save - SaveManager not initialized');
            return;
        }

        try {
            // Set up auto-save triggers
            this.saveManager.setupAutoSaveTriggers(this);

            // Add periodic auto-save during gameplay
            this.autoSaveInterval = setInterval(() => {
                if (this.currentState === GAME_STATES.PLAYING && this.gameState) {
                    this.autoSave();
                }
            }, 30000); // Every 30 seconds

            console.log('Auto-save system configured');

        } catch (error) {
            console.error('Failed to setup auto-save:', error);
        }
    }

    /**
     * Trigger auto-save on significant game events
     */
    triggerAutoSave(eventType = 'general') {
        if (this.saveManager && this.gameState) {
            console.log(`Auto-save triggered: ${eventType}`);
            
            // Force save for critical events
            const forceSave = ['levelComplete', 'playerDeath', 'objectiveComplete'].includes(eventType);
            
            if (forceSave) {
                return this.saveManager.forceSave(this.gameState);
            } else {
                return this.saveManager.autoSave(this.gameState);
            }
        }
        return false;
    }

    /**
     * Get current FPS for performance monitoring
     */
    getFPS() {
        return this.fpsCounter;
    }

    /**
     * Get comprehensive performance statistics
     */
    getPerformanceStats() {
        const basicStats = {
            fps: this.fpsCounter,
            deltaTime: this.deltaTime,
            frameTime: this.frameTime,
            accumulator: this.accumulator,
            gameState: this.currentState,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };

        // Add renderer performance stats if available
        if (this.renderer && this.renderer.getPerformanceStats) {
            const rendererStats = this.renderer.getPerformanceStats();
            return { ...basicStats, renderer: rendererStats };
        }

        return basicStats;
    }

    /**
     * Set performance mode for all systems
     */
    setPerformanceMode(mode) {
        console.log(`Setting global performance mode to: ${mode}`);
        
        // Update renderer performance mode
        if (this.renderer && this.renderer.setPerformanceMode) {
            this.renderer.setPerformanceMode(mode);
        }
        
        // Update audio quality based on performance mode
        if (this.audioManager) {
            switch (mode) {
                case 'performance':
                    this.audioManager.setQuality('low');
                    break;
                case 'balanced':
                    this.audioManager.setQuality('medium');
                    break;
                case 'high':
                    this.audioManager.setQuality('high');
                    break;
            }
        }
        
        // Adjust game loop timing based on performance mode
        switch (mode) {
            case 'performance':
                this.targetFPS = 30;
                this.frameTime = 1000 / 30;
                break;
            case 'balanced':
                this.targetFPS = 45;
                this.frameTime = 1000 / 45;
                break;
            case 'high':
            case 'auto':
                this.targetFPS = 60;
                this.frameTime = 1000 / 60;
                break;
        }
        
        console.log(`Target FPS set to: ${this.targetFPS}`);
    }

    /**
     * Enable or disable performance monitoring overlay
     */
    setPerformanceOverlay(enabled) {
        this.showPerformanceOverlay = enabled;
        console.log(`Performance overlay ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get game statistics
     */
    getStats() {
        const basicStats = {
            fps: this.fpsCounter,
            playTime: this.gameState.gameStats?.playTime || 0,
            currentState: this.currentState,
            currentLevel: this.gameState.currentLevel
        };

        // Add detailed statistics if SaveManager is available
        if (this.saveManager) {
            const detailedStats = this.saveManager.getFormattedStatistics(this.gameState);
            return { ...basicStats, ...detailedStats };
        }

        return basicStats;
    }

    /**
     * Track player death event
     */
    trackPlayerDeath() {
        if (this.saveManager) {
            this.saveManager.updateStatistics(this.gameState, 'death');
            this.triggerAutoSave('playerDeath');
            console.log('Player death tracked');
        }
    }

    /**
     * Track dialogue viewing
     * @param {string} dialogueId - Unique identifier for the dialogue
     * @param {Object} dialogueData - Additional dialogue metadata
     */
    trackDialogue(dialogueId, dialogueData = {}) {
        if (this.saveManager) {
            this.saveManager.trackDialogue(this.gameState, dialogueId, dialogueData);
            this.triggerAutoSave('dialogue');
        }
    }

    /**
     * Track level completion
     * @param {number} levelNumber - Completed level number
     * @param {number} completionTime - Time taken to complete level in ms
     */
    trackLevelCompletion(levelNumber, completionTime) {
        if (this.saveManager) {
            this.saveManager.updateStatistics(this.gameState, 'levelComplete', {
                level: levelNumber,
                time: completionTime
            });
            this.triggerAutoSave('levelComplete');
            console.log(`Level ${levelNumber} completion tracked: ${Math.round(completionTime / 1000)}s`);
        }
    }

    /**
     * Track objective completion
     * @param {string} objectiveType - Type of objective completed
     */
    trackObjectiveCompletion(objectiveType) {
        if (this.saveManager) {
            this.saveManager.updateStatistics(this.gameState, 'objectiveComplete');
            
            // Track specific objective types
            if (objectiveType === 'fragment') {
                this.saveManager.updateStatistics(this.gameState, 'fragmentCollected');
            }
            
            this.triggerAutoSave('objectiveComplete');
            console.log(`Objective completed: ${objectiveType}`);
        }
    }

    /**
     * Track player movement for distance statistics
     * @param {number} distance - Distance moved in game units
     */
    trackMovement(distance) {
        if (this.saveManager && distance > 0) {
            this.saveManager.updateStatistics(this.gameState, 'distance', distance);
        }
    }

    /**
     * Track achievement unlock
     * @param {string} achievementId - Unique identifier for the achievement
     */
    trackAchievement(achievementId) {
        if (this.saveManager) {
            this.saveManager.updateStatistics(this.gameState, 'achievement', achievementId);
            this.triggerAutoSave('achievement');
            console.log(`Achievement unlocked: ${achievementId}`);
        }
    }

    /**
     * Get detailed statistics for display
     * @returns {Object} - Formatted statistics object
     */
    getDetailedStatistics() {
        if (this.saveManager) {
            return {
                gameStats: this.saveManager.getFormattedStatistics(this.gameState),
                dialogueStats: this.saveManager.getDialogueStatistics(this.gameState),
                exportData: this.saveManager.exportStatistics(this.gameState)
            };
        }
        
        return {
            gameStats: this.saveManager?.getDefaultStatistics() || {},
            dialogueStats: { totalSeen: 0, categories: {}, recentDialogues: [] },
            exportData: null
        };
    }

    /**
     * Handle session end (called when game is closed or paused for extended time)
     */
    endSession() {
        if (this.saveManager) {
            this.saveManager.updateStatistics(this.gameState, 'sessionEnd');
            this.triggerAutoSave('sessionEnd');
            console.log('Game session ended');
        }
    }
}