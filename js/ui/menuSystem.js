/**
 * Menu System
 * Handles main menu, settings, and game navigation in Spanish
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

export class MenuSystem {
    constructor(gameEngine = null) {
        this.gameEngine = gameEngine;
        this.menuElement = document.getElementById('gameMenu');
        this.isMenuVisible = false;
        this.currentMenu = 'main'; // 'main', 'settings'
        
        // Menu button elements
        this.newGameBtn = document.getElementById('newGameBtn');
        this.continueBtn = document.getElementById('continueBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Settings elements (will be created dynamically)
        this.settingsMenu = null;
        this.volumeSlider = null;
        this.backBtn = null;
        
        // Audio service for UI sounds
        this.audioService = null;
        
        // Event callbacks
        this.onNewGame = null;
        this.onContinueGame = null;
        this.onResetGame = null;
        this.onSettingsChange = null;
        
        // Validate DOM elements
        this.validateElements();
    }

    /**
     * Validate that required DOM elements exist
     * Requirements: 5.1
     */
    validateElements() {
        const requiredElements = [
            { element: this.menuElement, name: 'gameMenu' },
            { element: this.newGameBtn, name: 'newGameBtn' },
            { element: this.continueBtn, name: 'continueBtn' },
            { element: this.settingsBtn, name: 'settingsBtn' },
            { element: this.resetBtn, name: 'resetBtn' }
        ];

        const missingElements = requiredElements.filter(item => !item.element);
        
        if (missingElements.length > 0) {
            const missing = missingElements.map(item => item.name).join(', ');
            console.warn(`MenuSystem: Missing DOM elements: ${missing}`);
        }
    }

    /**
     * Initialize menu system
     * Requirements: 5.1
     */
    init() {
        this.createSettingsMenu();
        this.bindMenuEvents();
        this.updateContinueButton();
        console.log('MenuSystem initialized');
    }

    /**
     * Create settings menu dynamically
     * Requirements: 5.2, 5.4
     */
    createSettingsMenu() {
        if (!this.menuElement) return;

        // Create settings menu container
        this.settingsMenu = document.createElement('div');
        this.settingsMenu.className = 'menu-content settings-menu';
        this.settingsMenu.style.display = 'none';
        this.settingsMenu.innerHTML = `
            <h2>Configuración</h2>
            <div class="settings-item">
                <label for="volumeSlider">Volumen:</label>
                <input type="range" id="volumeSlider" min="0" max="100" value="70" class="volume-slider">
                <span id="volumeValue">70%</span>
            </div>
            <button id="backToMainBtn" class="menu-button">Volver al Menú</button>
        `;

        // Insert settings menu after main menu
        const mainMenu = this.menuElement.querySelector('.menu-content');
        if (mainMenu) {
            this.menuElement.appendChild(this.settingsMenu);
        }

        // Get references to settings elements
        this.volumeSlider = this.settingsMenu.querySelector('#volumeSlider');
        this.volumeValue = this.settingsMenu.querySelector('#volumeValue');
        this.backBtn = this.settingsMenu.querySelector('#backToMainBtn');
    }

    /**
     * Bind menu event listeners
     * Requirements: 5.1, 5.2, 5.3
     */
    bindMenuEvents() {
        // Main menu buttons
        if (this.newGameBtn) {
            this.newGameBtn.addEventListener('click', () => this.handleNewGame());
        }

        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.handleContinueGame());
        }

        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.showSettingsMenu());
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.handleResetGame());
        }

        // Settings menu events
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e));
        }

        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.showMainMenu());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuVisible) {
                this.hideMenu();
            }
        });
    }

    /**
     * Handle keyboard navigation in menu
     * Requirements: 5.1
     */
    handleKeyboardNavigation(event) {
        if (!this.isMenuVisible) return;

        const buttons = this.getCurrentMenuButtons();
        if (buttons.length === 0) return;

        const currentFocus = document.activeElement;
        const currentIndex = buttons.indexOf(currentFocus);

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
                buttons[prevIndex].focus();
                break;
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = currentIndex >= buttons.length - 1 ? 0 : currentIndex + 1;
                buttons[nextIndex].focus();
                break;
            case 'Enter':
                event.preventDefault();
                if (currentFocus && currentFocus.click) {
                    currentFocus.click();
                }
                break;
        }
    }

    /**
     * Get buttons for current menu
     */
    getCurrentMenuButtons() {
        if (this.currentMenu === 'settings') {
            return Array.from(this.settingsMenu.querySelectorAll('button, input[type="range"]'));
        } else {
            const mainMenu = this.menuElement.querySelector('.menu-content:not(.settings-menu)');
            return Array.from(mainMenu.querySelectorAll('button'));
        }
    }

    /**
     * Show main menu
     * Requirements: 5.1
     */
    showMenu() {
        if (this.menuElement) {
            this.menuElement.style.display = 'flex';
            this.isMenuVisible = true;
            this.showMainMenu();
            this.updateContinueButton();
            
            // Focus first button for keyboard navigation
            const firstButton = this.newGameBtn;
            if (firstButton) {
                setTimeout(() => firstButton.focus(), 100);
            }
        }
    }

    /**
     * Hide menu
     * Requirements: 5.1
     */
    hideMenu() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.isMenuVisible = false;
        }
    }

    /**
     * Show main menu panel
     * Requirements: 5.1
     */
    showMainMenu() {
        // Play back sound if coming from settings
        if (this.currentMenu === 'settings' && this.audioService) {
            this.audioService.playUISound('back');
        }
        
        this.currentMenu = 'main';
        const mainMenu = this.menuElement.querySelector('.menu-content:not(.settings-menu)');
        const settingsMenu = this.settingsMenu;

        if (mainMenu) {
            mainMenu.style.display = 'block';
        }
        if (settingsMenu) {
            settingsMenu.style.display = 'none';
        }
    }

    /**
     * Show settings menu panel
     * Requirements: 5.2
     */
    showSettingsMenu() {
        // Play navigation sound
        if (this.audioService) {
            this.audioService.playUISound('navigate');
        }
        
        this.currentMenu = 'settings';
        const mainMenu = this.menuElement.querySelector('.menu-content:not(.settings-menu)');
        const settingsMenu = this.settingsMenu;

        if (mainMenu) {
            mainMenu.style.display = 'none';
        }
        if (settingsMenu) {
            settingsMenu.style.display = 'block';
            
            // Focus volume slider for keyboard navigation
            if (this.volumeSlider) {
                setTimeout(() => this.volumeSlider.focus(), 100);
            }
        }
    }

    /**
     * Handle volume change
     * Requirements: 5.2
     */
    handleVolumeChange(event) {
        const volume = parseInt(event.target.value);
        
        // Update volume display
        if (this.volumeValue) {
            this.volumeValue.textContent = `${volume}%`;
        }

        // Trigger callback if set
        if (this.onSettingsChange) {
            this.onSettingsChange({
                type: 'volume',
                value: volume / 100 // Convert to 0-1 range
            });
        }

        // Update game engine audio if available
        if (this.gameEngine && this.gameEngine.audioManager) {
            this.gameEngine.audioManager.setVolume(volume / 100);
        }
    }

    /**
     * Handle new game button
     * Requirements: 5.1, 5.3
     */
    handleNewGame() {
        // Play UI sound
        if (this.audioService) {
            this.audioService.playUISound('select');
        }
        
        this.hideMenu();
        
        if (this.onNewGame) {
            this.onNewGame();
        } else if (this.gameEngine) {
            this.gameEngine.startNewGame();
        }
    }

    /**
     * Handle continue game button
     * Requirements: 5.1, 5.3
     */
    async handleContinueGame() {
        // Check if save exists
        if (!this.hasSaveGame()) {
            // Play error sound
            if (this.audioService) {
                this.audioService.playUISound('error');
            }
            this.showMessage('No hay partida guardada disponible');
            return;
        }

        // Play UI sound
        if (this.audioService) {
            this.audioService.playUISound('select');
        }

        this.hideMenu();
        
        if (this.onContinueGame) {
            this.onContinueGame();
        } else if (this.gameEngine) {
            try {
                // Load saved game through game engine
                const { SaveManager } = await import('../data/saveManager.js');
                const saveManager = new SaveManager();
                const savedState = saveManager.loadGame();
                if (savedState) {
                    this.gameEngine.loadState(savedState);
                }
            } catch (error) {
                console.error('Error loading saved game:', error);
                this.showMessage('Error al cargar la partida guardada');
            }
        }
    }

    /**
     * Handle reset game with confirmation
     * Requirements: 5.3, 5.4
     */
    handleResetGame() {
        // Play UI sound
        if (this.audioService) {
            this.audioService.playUISound('click');
        }
        
        // Show confirmation dialog in Spanish
        const confirmed = confirm('¿Estás seguro de que quieres reiniciar desde cero? Se perderá todo el progreso guardado.');
        
        if (confirmed) {
            this.resetGame();
        }
    }

    /**
     * Reset game data
     * Requirements: 5.3
     */
    async resetGame() {
        try {
            // Clear save data
            const { SaveManager } = await import('../data/saveManager.js');
            const saveManager = new SaveManager();
            saveManager.clearSave();
            
            // Update continue button state
            this.updateContinueButton();
            
            // Show confirmation message
            this.showMessage('Progreso reiniciado correctamente');
            
            // Trigger callback if set
            if (this.onResetGame) {
                this.onResetGame();
            }
            
        } catch (error) {
            console.error('Error resetting game:', error);
            this.showMessage('Error al reiniciar el progreso');
        }
    }

    /**
     * Update continue button state based on save availability
     * Requirements: 5.1, 5.3
     */
    updateContinueButton() {
        if (this.continueBtn) {
            const hasSave = this.hasSaveGame();
            this.continueBtn.disabled = !hasSave;
            this.continueBtn.style.opacity = hasSave ? '1' : '0.5';
            this.continueBtn.style.cursor = hasSave ? 'pointer' : 'not-allowed';
        }
    }

    /**
     * Check if save game exists
     * Requirements: 5.3
     */
    hasSaveGame() {
        try {
            return localStorage.getItem('danteInfernoGameSave') !== null;
        } catch (error) {
            console.error('Error checking save game:', error);
            return false;
        }
    }

    /**
     * Show temporary message to user
     * Requirements: 5.4
     */
    showMessage(message, duration = 3000) {
        // Create message overlay
        const messageOverlay = document.createElement('div');
        messageOverlay.className = 'message-overlay';
        messageOverlay.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        
        // Add styles
        messageOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 4000;
        `;
        
        const messageContent = messageOverlay.querySelector('.message-content');
        messageContent.style.cssText = `
            background-color: #2d1810;
            border: 2px solid #8B4513;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            color: #FFD700;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
        `;
        
        document.body.appendChild(messageOverlay);
        
        // Remove message after duration
        setTimeout(() => {
            if (messageOverlay.parentNode) {
                messageOverlay.parentNode.removeChild(messageOverlay);
            }
        }, duration);
    }

    /**
     * Set event callbacks
     * @param {Object} callbacks - Object containing callback functions
     */
    setCallbacks(callbacks) {
        this.onNewGame = callbacks.onNewGame || null;
        this.onContinueGame = callbacks.onContinueGame || null;
        this.onResetGame = callbacks.onResetGame || null;
        this.onSettingsChange = callbacks.onSettingsChange || null;
    }

    /**
     * Set game engine reference
     * @param {GameEngine} gameEngine - Game engine instance
     */
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
    }

    /**
     * Get current volume setting
     * @returns {number} - Volume as decimal (0-1)
     */
    getVolume() {
        if (this.volumeSlider) {
            return parseInt(this.volumeSlider.value) / 100;
        }
        return 0.7; // Default volume
    }

    /**
     * Set volume
     * @param {number} volume - Volume as decimal (0-1)
     */
    setVolume(volume) {
        const volumePercent = Math.round(volume * 100);
        
        if (this.volumeSlider) {
            this.volumeSlider.value = volumePercent;
        }
        
        if (this.volumeValue) {
            this.volumeValue.textContent = `${volumePercent}%`;
        }
    }

    /**
     * Set audio service for UI sounds
     * @param {AudioService} audioService - Audio service instance
     */
    setAudioService(audioService) {
        this.audioService = audioService;
    }

    /**
     * Handle errors gracefully
     * @param {Error} error - Error that occurred
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = 'MenuSystem') {
        console.error(`${context} error:`, error);
        
        // Play error sound
        if (this.audioService) {
            this.audioService.playUISound('error');
        }
        
        this.showMessage('Ha ocurrido un error. Por favor, recarga la página.');
    }
}