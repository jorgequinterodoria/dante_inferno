/**
 * Main entry point for Inferno Pixelado: La Redención de Dante
 * Initializes the game engine and manages the overall application lifecycle
 */

// Import core engine modules
import { GameEngine } from './engine/gameEngine.js';
import { Renderer } from './engine/renderer.js';
import { InputManager } from './engine/inputManager.js';
import { AudioManager } from './engine/audioManager.js';

// Import game logic modules
import { Player } from './game/player.js';
import { Maze } from './game/maze.js';
import { LevelManager } from './game/levelManager.js';
import { ObjectiveManager } from './game/objectives.js';

// Import UI modules
import { ProgressPanel } from './ui/progressPanel.js';
import { MenuSystem } from './ui/menuSystem.js';
import { DialogSystem } from './ui/dialogSystem.js';

// Import data management modules
import { SaveManager } from './data/saveManager.js';
import { GameData } from './data/gameData.js';

/**
 * Main Game Application Class
 * Coordinates all game systems and manages the overall game state
 */
class DanteInfernoGame {
    constructor() {
        this.canvas = null;
        this.gameEngine = null;
        this.isInitialized = false;
        this.loadingScreen = null;
    }

    /**
     * Initialize the game application
     */
    async init() {
        try {
            this.showLoadingScreen();
            
            // Get canvas element
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            // Check for Canvas support
            if (!this.canvas.getContext) {
                throw new Error('Canvas not supported in this browser');
            }

            // Initialize core systems
            await this.initializeSystems();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load saved game or start new game
            await this.loadGameState();
            
            this.isInitialized = true;
            this.hideLoadingScreen();
            
            console.log('Dante Inferno Game initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Error al inicializar el juego: ' + error.message);
        }
    }

    /**
     * Initialize all game systems
     */
    async initializeSystems() {
        // Initialize offline functionality first
        await this.initializeOfflineManager();
        
        // Initialize game engine
        this.gameEngine = new GameEngine(this.canvas);
        await this.gameEngine.init();
        
        console.log('Game systems initialized');
    }

    /**
     * Initialize offline manager and service worker
     */
    async initializeOfflineManager() {
        try {
            const { OfflineManager } = await import('./engine/offlineManager.js');
            this.offlineManager = new OfflineManager();
            await this.offlineManager.init();
            
            // Set up offline/online callbacks
            this.offlineManager.onOffline(() => {
                console.log('Game went offline');
                this.handleOfflineMode();
            });
            
            this.offlineManager.onOnline(() => {
                console.log('Game came back online');
                this.handleOnlineMode();
            });
            
            console.log('Offline manager initialized');
            
        } catch (error) {
            console.error('Failed to initialize offline manager:', error);
            // Continue without offline functionality
            this.offlineManager = null;
        }
    }

    /**
     * Handle offline mode
     */
    handleOfflineMode() {
        // Ensure localStorage is working for saves
        if (this.gameEngine && this.gameEngine.saveManager) {
            const canSave = this.gameEngine.saveManager.testLocalStorage();
            if (!canSave) {
                this.showError('Funcionalidad de guardado limitada sin conexión');
            }
        }
        
        // Disable any online-only features
        this.disableOnlineFeatures();
    }

    /**
     * Handle online mode
     */
    handleOnlineMode() {
        // Re-enable online features
        this.enableOnlineFeatures();
        
        // Check for updates
        if (this.offlineManager) {
            this.offlineManager.checkCacheStatus();
        }
    }

    /**
     * Disable online-only features
     */
    disableOnlineFeatures() {
        // In this offline-first game, most features should work offline
        // This is mainly for future online features like leaderboards
        console.log('Online features disabled');
    }

    /**
     * Enable online features
     */
    enableOnlineFeatures() {
        // Re-enable any online-only features
        console.log('Online features enabled');
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle visibility change (for pause/resume)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.gameEngine?.pause();
            } else {
                this.gameEngine?.resume();
            }
        });

        // Handle beforeunload for auto-save
        window.addEventListener('beforeunload', () => {
            if (this.gameEngine) {
                this.gameEngine.autoSave();
            }
        });
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        if (this.gameEngine) {
            this.gameEngine.handleResize();
        }
    }

    /**
     * Load game state from save or start new game
     */
    async loadGameState() {
        const saveManager = new SaveManager();
        const savedState = saveManager.loadGame();
        
        if (savedState) {
            await this.gameEngine.loadState(savedState);
            console.log('Loaded saved game state');
        } else {
            // No hay partida guardada, simplemente inicializar el estado del juego
            // pero quedarse en el menú para que el usuario pueda elegir
            console.log('No saved game found, staying in menu');
        }
    }

    /**
     * Start the game
     */
    start() {
        if (!this.isInitialized) {
            console.error('Game not initialized');
            return;
        }
        
        this.gameEngine.start();
        console.log('Game started');
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        this.loadingScreen = document.getElementById('loadingScreen');
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Recargar Página</button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
    }
}

/**
 * Initialize and start the game when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    const game = new DanteInfernoGame();
    
    try {
        await game.init();
        game.start();
    } catch (error) {
        console.error('Failed to start game:', error);
    }
});

// Export for potential external access
export { DanteInfernoGame };