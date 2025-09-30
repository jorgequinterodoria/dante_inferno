/**
 * Progress Panel
 * Manages the sidebar UI showing objectives and level information
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

export class ProgressPanel {
    constructor() {
        this.virgilioStatusElement = document.getElementById('virgilioStatus');
        this.fragmentStatusElement = document.getElementById('fragmentStatus');
        this.exitStatusElement = document.getElementById('exitStatus');
        this.currentLevelElement = document.getElementById('currentLevel');
        this.levelNameElement = document.getElementById('levelName');
        
        // Track current state to avoid unnecessary DOM updates
        this.currentState = {
            virgilioFound: false,
            fragmentsCollected: 0,
            totalFragments: 3,
            exitUnlocked: false,
            currentLevel: 1,
            levelName: 'Bosque Oscuro'
        };
        
        // Validate DOM elements
        this.validateElements();
    }

    /**
     * Validate that all required DOM elements exist
     * Requirements: 6.1
     */
    validateElements() {
        const requiredElements = [
            { element: this.virgilioStatusElement, name: 'virgilioStatus' },
            { element: this.fragmentStatusElement, name: 'fragmentStatus' },
            { element: this.exitStatusElement, name: 'exitStatus' },
            { element: this.currentLevelElement, name: 'currentLevel' },
            { element: this.levelNameElement, name: 'levelName' }
        ];

        const missingElements = requiredElements.filter(item => !item.element);
        
        if (missingElements.length > 0) {
            const missing = missingElements.map(item => item.name).join(', ');
            console.warn(`ProgressPanel: Missing DOM elements: ${missing}`);
        }
    }

    /**
     * Initialize progress panel with default values
     * Requirements: 6.1
     */
    init() {
        this.updateVirgilio(false);
        this.updateFragments(0, 3);
        this.updateExit(false);
        this.updateLevel(1, 'Bosque Oscuro');
        console.log('ProgressPanel initialized');
    }

    /**
     * Update Virgilio status with real-time display
     * Requirements: 6.2
     * @param {boolean} found - Whether Virgilio has been found
     */
    updateVirgilio(found) {
        this.currentState.virgilioFound = found;

        if (this.virgilioStatusElement) {
            if (found) {
                this.virgilioStatusElement.textContent = 'Encontrado';
                this.virgilioStatusElement.className = 'status-encontrado';
            } else {
                this.virgilioStatusElement.textContent = 'Pendiente';
                this.virgilioStatusElement.className = 'status-pendiente';
            }
        }
    }

    /**
     * Update fragment counter with real-time display in X/3 format
     * Requirements: 6.3
     * @param {number} collected - Number of fragments collected
     * @param {number} total - Total number of fragments in level
     */
    updateFragments(collected, total = 3) {
        // Validate input parameters
        collected = Math.max(0, Math.min(collected, total));
        total = Math.max(1, total);

        this.currentState.fragmentsCollected = collected;
        this.currentState.totalFragments = total;

        if (this.fragmentStatusElement) {
            this.fragmentStatusElement.textContent = `${collected}/${total}`;
            
            // Add visual feedback for completion
            if (collected === total) {
                this.fragmentStatusElement.style.color = '#51cf66'; // Green when complete
            } else {
                this.fragmentStatusElement.style.color = '#ffffff'; // White when incomplete
            }
        }
    }

    /**
     * Update exit status with real-time display
     * Requirements: 6.4
     * @param {boolean} unlocked - Whether the exit is unlocked
     */
    updateExit(unlocked) {
        this.currentState.exitUnlocked = unlocked;

        if (this.exitStatusElement) {
            if (unlocked) {
                this.exitStatusElement.textContent = 'Desbloqueada';
                this.exitStatusElement.className = 'status-desbloqueada';
            } else {
                this.exitStatusElement.textContent = 'Bloqueada';
                this.exitStatusElement.className = 'status-bloqueada';
            }
        }
    }

    /**
     * Update level information
     * Requirements: 6.5
     * @param {number} levelNumber - Current level number
     * @param {string} levelName - Name of the current level
     */
    updateLevel(levelNumber, levelName) {
        // Validate input parameters
        levelNumber = Math.max(1, levelNumber);
        levelName = levelName || `Círculo ${levelNumber}`;

        this.currentState.currentLevel = levelNumber;
        this.currentState.levelName = levelName;

        if (this.currentLevelElement) {
            this.currentLevelElement.textContent = String(levelNumber);
        }
        if (this.levelNameElement) {
            this.levelNameElement.textContent = String(levelName);
        }
    }

    /**
     * Update all progress information at once
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
     * @param {Object} progressData - Complete progress data object
     */
    updateAll(progressData) {
        if (!progressData) {
            return;
        }

        // Update objectives
        if (typeof progressData.virgilioFound === 'boolean') {
            this.updateVirgilio(progressData.virgilioFound);
        }

        if (typeof progressData.fragmentsCollected === 'number') {
            this.updateFragments(
                progressData.fragmentsCollected, 
                progressData.totalFragments || 3
            );
        }

        if (typeof progressData.exitUnlocked === 'boolean') {
            this.updateExit(progressData.exitUnlocked);
        }

        // Update level information
        if (typeof progressData.currentLevel === 'number') {
            this.updateLevel(
                progressData.currentLevel, 
                progressData.levelName
            );
        }
    }

    /**
     * Get current progress state
     * @returns {Object} - Current progress state
     */
    getCurrentState() {
        return { ...this.currentState };
    }

    /**
     * Reset progress panel to initial state
     * Requirements: 6.1
     */
    reset() {
        this.updateVirgilio(false);
        this.updateFragments(0, 3);
        this.updateExit(false);
        this.updateLevel(1, 'Bosque Oscuro');
    }

    /**
     * Show visual feedback for objective completion
     * Requirements: 6.2, 6.3, 6.4
     * @param {string} objectiveType - Type of objective completed ('virgilio', 'fragment', 'exit')
     */
    showCompletionFeedback(objectiveType) {
        let element = null;
        
        switch (objectiveType) {
            case 'virgilio':
                element = this.virgilioStatusElement;
                break;
            case 'fragment':
                element = this.fragmentStatusElement;
                break;
            case 'exit':
                element = this.exitStatusElement;
                break;
        }

        if (element) {
            // Add temporary highlight effect
            element.style.transition = 'all 0.3s ease';
            element.style.transform = 'scale(1.1)';
            element.style.textShadow = '0 0 10px #FFD700';
            
            // Remove effect after animation
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.textShadow = 'none';
            }, 300);
        }
    }

    /**
     * Handle errors gracefully
     * @param {Error} error - Error that occurred
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = 'ProgressPanel') {
        console.error(`${context} error:`, error);
        
        // Try to maintain basic functionality even with errors
        if (!this.virgilioStatusElement || !this.fragmentStatusElement || !this.exitStatusElement) {
            console.warn('ProgressPanel: Some DOM elements are missing, functionality may be limited');
        }
    }
}