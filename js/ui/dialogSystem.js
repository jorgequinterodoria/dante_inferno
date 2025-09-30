/**
 * Dialog System
 * Handles narrative dialogues and story text in Spanish
 * Requirements: 5.1, 5.2, 5.3 - Spanish language content and narrative
 */

export class DialogSystem {
    constructor() {
        this.isDialogActive = false;
        this.currentDialog = null;
        this.dialogQueue = [];
        this.dialogElement = null;
        this.isInitialized = false;
        this.onDialogComplete = null;
        this.currentDialogIndex = 0;
    }

    /**
     * Initialize dialog system and create DOM elements
     */
    init() {
        if (this.isInitialized) return;
        
        this.createDialogElements();
        this.bindEvents();
        this.isInitialized = true;
        console.log('DialogSystem initialized');
    }

    /**
     * Create dialog DOM elements
     */
    createDialogElements() {
        // Create dialog overlay
        this.dialogElement = document.createElement('div');
        this.dialogElement.className = 'dialog-overlay';
        this.dialogElement.style.display = 'none';
        
        // Create dialog content container
        const dialogContent = document.createElement('div');
        dialogContent.className = 'dialog-content';
        
        // Create dialog text area
        const dialogText = document.createElement('div');
        dialogText.className = 'dialog-text';
        dialogText.id = 'dialogText';
        
        // Create dialog speaker name
        const dialogSpeaker = document.createElement('div');
        dialogSpeaker.className = 'dialog-speaker';
        dialogSpeaker.id = 'dialogSpeaker';
        
        // Create continue button
        const continueButton = document.createElement('button');
        continueButton.className = 'dialog-continue';
        continueButton.id = 'dialogContinue';
        continueButton.textContent = 'Continuar';
        
        // Assemble dialog structure
        dialogContent.appendChild(dialogSpeaker);
        dialogContent.appendChild(dialogText);
        dialogContent.appendChild(continueButton);
        this.dialogElement.appendChild(dialogContent);
        
        // Add to document
        document.body.appendChild(this.dialogElement);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        const continueButton = document.getElementById('dialogContinue');
        if (continueButton) {
            continueButton.addEventListener('click', () => this.continueDialog());
        }
        
        // Allow spacebar and Enter to continue dialog
        document.addEventListener('keydown', (event) => {
            if (this.isDialogActive && (event.code === 'Space' || event.code === 'Enter')) {
                event.preventDefault();
                this.continueDialog();
            }
        });
        
        // Prevent dialog from closing when clicking on content
        const dialogContent = this.dialogElement?.querySelector('.dialog-content');
        if (dialogContent) {
            dialogContent.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
        
        // Close dialog when clicking overlay
        if (this.dialogElement) {
            this.dialogElement.addEventListener('click', () => {
                this.skipDialog();
            });
        }
    }

    /**
     * Display dialogue text
     * @param {Object|Array} dialogData - Dialog data object or array of dialogs
     * @param {Function} onComplete - Callback when dialog completes
     */
    showDialog(dialogData, onComplete = null) {
        if (!this.isInitialized) {
            console.warn('DialogSystem not initialized');
            return;
        }

        // Handle single dialog or array of dialogs
        if (Array.isArray(dialogData)) {
            this.dialogQueue = [...dialogData];
        } else {
            this.dialogQueue = [dialogData];
        }
        
        this.currentDialogIndex = 0;
        this.onDialogComplete = onComplete;
        this.isDialogActive = true;
        
        // Show the dialog overlay
        this.dialogElement.style.display = 'flex';
        
        // Display first dialog
        this.displayCurrentDialog();
    }

    /**
     * Display the current dialog in the queue
     */
    displayCurrentDialog() {
        if (this.currentDialogIndex >= this.dialogQueue.length) {
            this.hideDialog();
            return;
        }
        
        const dialog = this.dialogQueue[this.currentDialogIndex];
        this.currentDialog = dialog;
        
        const speakerElement = document.getElementById('dialogSpeaker');
        const textElement = document.getElementById('dialogText');
        const continueButton = document.getElementById('dialogContinue');
        
        if (speakerElement && textElement && continueButton) {
            // Set speaker name (if provided)
            speakerElement.textContent = dialog.speaker || '';
            speakerElement.style.display = dialog.speaker ? 'block' : 'none';
            
            // Set dialog text
            textElement.textContent = dialog.text || '';
            
            // Update continue button text
            const isLastDialog = this.currentDialogIndex >= this.dialogQueue.length - 1;
            continueButton.textContent = isLastDialog ? 'Cerrar' : 'Continuar';
            
            // Add dialog type class for styling
            const dialogContent = this.dialogElement.querySelector('.dialog-content');
            if (dialogContent) {
                dialogContent.className = 'dialog-content';
                if (dialog.type) {
                    dialogContent.classList.add(`dialog-${dialog.type}`);
                }
            }
        }
    }

    /**
     * Continue to next dialog or close
     */
    continueDialog() {
        if (!this.isDialogActive) return;
        
        this.currentDialogIndex++;
        
        if (this.currentDialogIndex >= this.dialogQueue.length) {
            this.hideDialog();
        } else {
            this.displayCurrentDialog();
        }
    }

    /**
     * Skip all remaining dialogs
     */
    skipDialog() {
        if (!this.isDialogActive) return;
        this.hideDialog();
    }

    /**
     * Hide current dialog
     */
    hideDialog() {
        if (!this.isDialogActive) return;
        
        this.isDialogActive = false;
        this.currentDialog = null;
        this.dialogQueue = [];
        this.currentDialogIndex = 0;
        
        if (this.dialogElement) {
            this.dialogElement.style.display = 'none';
        }
        
        // Call completion callback
        if (this.onDialogComplete) {
            const callback = this.onDialogComplete;
            this.onDialogComplete = null;
            callback();
        }
    }

    /**
     * Check if dialog is currently active
     */
    isActive() {
        return this.isDialogActive;
    }

    /**
     * Show level introduction dialog
     * @param {Object} levelData - Level configuration data
     * @param {Function} onComplete - Callback when dialog completes
     */
    showLevelIntro(levelData, onComplete = null) {
        const introDialog = {
            type: 'intro',
            speaker: 'Narrador',
            text: levelData.narrative?.intro || `Bienvenido al ${levelData.name}`
        };
        
        this.showDialog(introDialog, onComplete);
    }

    /**
     * Show Virgilio encounter dialog
     * @param {Object} levelData - Level configuration data
     * @param {Function} onComplete - Callback when dialog completes
     */
    showVirgilioDialog(levelData, onComplete = null) {
        const virgilioDialog = {
            type: 'virgilio',
            speaker: 'Virgilio',
            text: levelData.narrative?.virgilioDialogue || 'Yo soy Virgilio, tu guía en este viaje.'
        };
        
        this.showDialog(virgilioDialog, onComplete);
    }

    /**
     * Show level completion dialog
     * @param {Object} levelData - Level configuration data
     * @param {Function} onComplete - Callback when dialog completes
     */
    showLevelCompletion(levelData, onComplete = null) {
        const completionDialog = {
            type: 'completion',
            speaker: 'Narrador',
            text: levelData.narrative?.completion || `Has completado el ${levelData.name}`
        };
        
        this.showDialog(completionDialog, onComplete);
    }

    /**
     * Show fragment collection dialog
     * @param {number} fragmentsCollected - Number of fragments collected
     * @param {number} totalFragments - Total fragments needed
     * @param {Function} onComplete - Callback when dialog completes
     */
    showFragmentDialog(fragmentsCollected, totalFragments, onComplete = null) {
        const fragmentDialog = {
            type: 'fragment',
            speaker: 'Narrador',
            text: `Has encontrado un fragmento. Tienes ${fragmentsCollected} de ${totalFragments}.`
        };
        
        this.showDialog(fragmentDialog, onComplete);
    }

    /**
     * Show exit unlocked dialog
     * @param {Function} onComplete - Callback when dialog completes
     */
    showExitUnlockedDialog(onComplete = null) {
        const exitDialog = {
            type: 'exit',
            speaker: 'Narrador',
            text: 'Has completado todos los objetivos. La salida está ahora desbloqueada.'
        };
        
        this.showDialog(exitDialog, onComplete);
    }

    /**
     * Show custom dialog with Spanish text
     * @param {string} text - Dialog text in Spanish
     * @param {string} speaker - Speaker name (optional)
     * @param {string} type - Dialog type for styling (optional)
     * @param {Function} onComplete - Callback when dialog completes
     */
    showCustomDialog(text, speaker = null, type = null, onComplete = null) {
        const customDialog = {
            type: type || 'custom',
            speaker: speaker,
            text: text
        };
        
        this.showDialog(customDialog, onComplete);
    }

    /**
     * Destroy dialog system and clean up
     */
    destroy() {
        if (this.dialogElement && this.dialogElement.parentNode) {
            this.dialogElement.parentNode.removeChild(this.dialogElement);
        }
        
        this.isDialogActive = false;
        this.currentDialog = null;
        this.dialogQueue = [];
        this.dialogElement = null;
        this.isInitialized = false;
        this.onDialogComplete = null;
    }
}