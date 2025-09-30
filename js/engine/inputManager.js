/**
 * Input Manager
 * Handles keyboard input for player movement (WASD and arrow keys)
 */

export class InputManager {
    constructor() {
        this.keys = {};
        this.inputBuffer = [];
        this.bufferMaxSize = 10;
        this.keyBindings = {
            // WASD keys
            'KeyW': 'up',
            'KeyA': 'left', 
            'KeyS': 'down',
            'KeyD': 'right',
            // Arrow keys
            'ArrowUp': 'up',
            'ArrowLeft': 'left',
            'ArrowDown': 'down',
            'ArrowRight': 'right',
            // Other keys
            'Escape': 'menu',
            'Enter': 'confirm',
            'Space': 'action'
        };
    }

    /**
     * Initialize input system and bind events
     */
    init() {
        this.bindEvents();
        console.log('InputManager initialized');
    }

    /**
     * Bind keyboard event listeners
     */
    bindEvents() {
        // Bind keydown events
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });

        // Bind keyup events
        document.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });

        // Prevent default behavior for game keys
        document.addEventListener('keydown', (event) => {
            if (this.keyBindings[event.code]) {
                event.preventDefault();
            }
        });
    }

    /**
     * Get current input state
     */
    getInputState() {
        const inputState = {};
        
        // Map pressed keys to actions
        for (const [keyCode, action] of Object.entries(this.keyBindings)) {
            if (this.keys[keyCode]) {
                inputState[action] = true;
            }
        }
        
        return inputState;
    }

    /**
     * Check if specific key is pressed
     */
    isKeyPressed(key) {
        // Check by action name (e.g., 'up', 'left')
        for (const [keyCode, action] of Object.entries(this.keyBindings)) {
            if (action === key && this.keys[keyCode]) {
                return true;
            }
        }
        
        // Check by key code directly
        return this.keys[key] || false;
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(event) {
        const keyCode = event.code;
        
        // Input validation - only process valid game keys
        if (!this.isValidGameKey(keyCode)) {
            return;
        }

        // Set key state
        this.keys[keyCode] = true;
        
        // Add to input buffer for processing
        this.addToBuffer({
            type: 'keydown',
            keyCode: keyCode,
            action: this.keyBindings[keyCode],
            timestamp: Date.now()
        });
    }

    /**
     * Handle keyup events
     */
    handleKeyUp(event) {
        const keyCode = event.code;
        
        // Input validation - only process valid game keys
        if (!this.isValidGameKey(keyCode)) {
            return;
        }

        // Clear key state
        this.keys[keyCode] = false;
        
        // Add to input buffer for processing
        this.addToBuffer({
            type: 'keyup',
            keyCode: keyCode,
            action: this.keyBindings[keyCode],
            timestamp: Date.now()
        });
    }

    /**
     * Validate if key is a valid game key
     */
    isValidGameKey(keyCode) {
        return this.keyBindings.hasOwnProperty(keyCode);
    }

    /**
     * Add input event to buffer
     */
    addToBuffer(inputEvent) {
        // Add to buffer
        this.inputBuffer.push(inputEvent);
        
        // Maintain buffer size limit
        if (this.inputBuffer.length > this.bufferMaxSize) {
            this.inputBuffer.shift();
        }
    }

    /**
     * Get and clear input buffer
     */
    getInputBuffer() {
        const buffer = [...this.inputBuffer];
        this.inputBuffer = [];
        return buffer;
    }

    /**
     * Clear all input states
     */
    clearInput() {
        this.keys = {};
        this.inputBuffer = [];
    }

    /**
     * Get movement direction from current input
     */
    getMovementDirection() {
        if (this.isKeyPressed('up')) return 'up';
        if (this.isKeyPressed('down')) return 'down';
        if (this.isKeyPressed('left')) return 'left';
        if (this.isKeyPressed('right')) return 'right';
        return null;
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        // Remove event listeners to prevent memory leaks
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.clearInput();
    }
}