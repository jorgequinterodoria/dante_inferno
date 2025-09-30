/**
 * Narrative Manager
 * Manages Divine Comedy storyline integration and dialogue triggers
 * Requirements: 5.1, 5.2 - Spanish narrative and Divine Comedy storyline
 */

import { DialogSystem } from '../ui/dialogSystem.js';
import { LevelData, getLevelConfig } from '../data/levelData.js';

export class NarrativeManager {
    constructor() {
        this.dialogSystem = null;
        this.currentLevel = 1;
        this.storyProgress = {
            dialoguesSeen: new Set(),
            levelIntrosSeen: new Set(),
            virgilioEncountersSeen: new Set(),
            levelCompletionsSeen: new Set(),
            specialEventsSeen: new Set()
        };
        
        // Narrative state tracking
        this.isNarrativeActive = false;
        this.pendingNarratives = [];
        
        // Event callbacks
        this.onNarrativeStart = null;
        this.onNarrativeComplete = null;
        this.onStoryProgress = null;
    }

    /**
     * Initialize narrative manager with dialog system
     */
    init() {
        this.dialogSystem = new DialogSystem();
        this.dialogSystem.init();
        console.log('NarrativeManager initialized');
    }

    /**
     * Set current level for narrative context
     * @param {number} levelNumber - Current level number
     */
    setCurrentLevel(levelNumber) {
        this.currentLevel = levelNumber;
    }

    /**
     * Show level introduction narrative
     * @param {number} levelNumber - Level number
     * @param {Function} onComplete - Callback when narrative completes
     */
    showLevelIntroduction(levelNumber, onComplete = null) {
        const levelData = getLevelConfig(levelNumber);
        if (!levelData || !levelData.narrative?.intro || !this.dialogSystem) {
            if (onComplete) onComplete();
            return;
        }

        const dialogueId = `level_${levelNumber}_intro`;
        
        // Check if already seen
        if (this.storyProgress.levelIntrosSeen.has(dialogueId)) {
            if (onComplete) onComplete();
            return;
        }

        // Create introduction dialogue sequence
        const introDialogues = this.createLevelIntroDialogue(levelData);
        
        this.isNarrativeActive = true;
        this.dialogSystem.showDialog(introDialogues, () => {
            this.storyProgress.levelIntrosSeen.add(dialogueId);
            this.storyProgress.dialoguesSeen.add(dialogueId);
            this.isNarrativeActive = false;
            
            // Track story progress
            this.trackStoryProgress('levelIntro', levelNumber);
            
            if (onComplete) onComplete();
            if (this.onNarrativeComplete) {
                this.onNarrativeComplete('levelIntro', levelNumber);
            }
        });

        if (this.onNarrativeStart) {
            this.onNarrativeStart('levelIntro', levelNumber);
        }
    }

    /**
     * Show Virgilio encounter dialogue
     * @param {number} levelNumber - Level number
     * @param {Function} onComplete - Callback when narrative completes
     */
    showVirgilioEncounter(levelNumber, onComplete = null) {
        const levelData = getLevelConfig(levelNumber);
        if (!levelData || !levelData.narrative?.virgilioDialogue || !this.dialogSystem) {
            if (onComplete) onComplete();
            return;
        }

        const dialogueId = `level_${levelNumber}_virgilio`;
        
        // Create Virgilio dialogue sequence
        const virgilioDialogues = this.createVirgilioDialogue(levelData, levelNumber);
        
        this.isNarrativeActive = true;
        this.dialogSystem.showDialog(virgilioDialogues, () => {
            this.storyProgress.virgilioEncountersSeen.add(dialogueId);
            this.storyProgress.dialoguesSeen.add(dialogueId);
            this.isNarrativeActive = false;
            
            // Track story progress
            this.trackStoryProgress('virgilioEncounter', levelNumber);
            
            if (onComplete) onComplete();
            if (this.onNarrativeComplete) {
                this.onNarrativeComplete('virgilioEncounter', levelNumber);
            }
        });

        if (this.onNarrativeStart) {
            this.onNarrativeStart('virgilioEncounter', levelNumber);
        }
    }

    /**
     * Show level completion narrative
     * @param {number} levelNumber - Completed level number
     * @param {Function} onComplete - Callback when narrative completes
     */
    showLevelCompletion(levelNumber, onComplete = null) {
        const levelData = getLevelConfig(levelNumber);
        if (!levelData || !levelData.narrative?.completion || !this.dialogSystem) {
            if (onComplete) onComplete();
            return;
        }

        const dialogueId = `level_${levelNumber}_completion`;
        
        // Create completion dialogue sequence
        const completionDialogues = this.createLevelCompletionDialogue(levelData, levelNumber);
        
        this.isNarrativeActive = true;
        this.dialogSystem.showDialog(completionDialogues, () => {
            this.storyProgress.levelCompletionsSeen.add(dialogueId);
            this.storyProgress.dialoguesSeen.add(dialogueId);
            this.isNarrativeActive = false;
            
            // Track story progress
            this.trackStoryProgress('levelCompletion', levelNumber);
            
            if (onComplete) onComplete();
            if (this.onNarrativeComplete) {
                this.onNarrativeComplete('levelCompletion', levelNumber);
            }
        });

        if (this.onNarrativeStart) {
            this.onNarrativeStart('levelCompletion', levelNumber);
        }
    }

    /**
     * Show fragment collection narrative
     * @param {number} fragmentsCollected - Number of fragments collected
     * @param {number} totalFragments - Total fragments needed
     * @param {number} levelNumber - Current level number
     * @param {Function} onComplete - Callback when narrative completes
     */
    showFragmentCollection(fragmentsCollected, totalFragments, levelNumber, onComplete = null) {
        // Only show narrative for significant milestones
        const isSignificant = fragmentsCollected === 1 || fragmentsCollected === totalFragments;
        
        if (!isSignificant || !this.dialogSystem) {
            if (onComplete) onComplete();
            return;
        }

        const levelData = getLevelConfig(levelNumber);
        const fragmentDialogue = this.createFragmentDialogue(fragmentsCollected, totalFragments, levelData);
        
        this.isNarrativeActive = true;
        this.dialogSystem.showDialog(fragmentDialogue, () => {
            this.isNarrativeActive = false;
            
            // Track story progress
            this.trackStoryProgress('fragmentCollection', levelNumber, { 
                collected: fragmentsCollected, 
                total: totalFragments 
            });
            
            if (onComplete) onComplete();
        });
    }

    /**
     * Show game completion narrative
     * @param {Function} onComplete - Callback when narrative completes
     */
    showGameCompletion(onComplete = null) {
        if (!this.dialogSystem) {
            if (onComplete) onComplete();
            return;
        }

        const completionDialogues = this.createGameCompletionDialogue();
        
        this.isNarrativeActive = true;
        this.dialogSystem.showDialog(completionDialogues, () => {
            this.storyProgress.specialEventsSeen.add('game_completion');
            this.storyProgress.dialoguesSeen.add('game_completion');
            this.isNarrativeActive = false;
            
            // Track story progress
            this.trackStoryProgress('gameCompletion', 9);
            
            if (onComplete) onComplete();
            if (this.onNarrativeComplete) {
                this.onNarrativeComplete('gameCompletion', 9);
            }
        });

        if (this.onNarrativeStart) {
            this.onNarrativeStart('gameCompletion', 9);
        }
    }

    /**
     * Create level introduction dialogue sequence
     * @param {Object} levelData - Level configuration data
     * @returns {Array} - Array of dialogue objects
     */
    createLevelIntroDialogue(levelData) {
        const dialogues = [];
        
        // Circle announcement
        dialogues.push({
            type: 'intro',
            speaker: 'Narrador',
            text: `${levelData.circle} - ${levelData.name}`
        });
        
        // Level description
        if (levelData.description) {
            dialogues.push({
                type: 'intro',
                speaker: 'Narrador',
                text: levelData.description
            });
        }
        
        // Main narrative intro
        dialogues.push({
            type: 'intro',
            speaker: 'Narrador',
            text: levelData.narrative.intro
        });
        
        // Add level-specific context
        if (levelData.number === 1) {
            dialogues.push({
                type: 'intro',
                speaker: 'Narrador',
                text: 'Busca a Virgilio, quien será tu guía en este viaje. Recolecta los fragmentos de sabiduría y encuentra la salida.'
            });
        }
        
        return dialogues;
    }

    /**
     * Create Virgilio encounter dialogue sequence
     * @param {Object} levelData - Level configuration data
     * @param {number} levelNumber - Level number
     * @returns {Array} - Array of dialogue objects
     */
    createVirgilioDialogue(levelData, levelNumber) {
        const dialogues = [];
        
        // Virgilio's main dialogue
        dialogues.push({
            type: 'virgilio',
            speaker: 'Virgilio',
            text: levelData.narrative.virgilioDialogue
        });
        
        // Add level-specific Virgilio guidance
        if (levelNumber === 1) {
            dialogues.push({
                type: 'virgilio',
                speaker: 'Virgilio',
                text: 'Recolecta los fragmentos de sabiduría que encuentres en tu camino. Te serán útiles para comprender los misterios del Infierno.'
            });
            
            dialogues.push({
                type: 'virgilio',
                speaker: 'Virgilio',
                text: 'Una vez que hayas completado tus objetivos, la salida se desbloqueará y podrás continuar tu descenso.'
            });
        } else {
            // Add contextual guidance for other levels
            const guidance = this.getVirgilioGuidanceForLevel(levelNumber);
            if (guidance) {
                dialogues.push({
                    type: 'virgilio',
                    speaker: 'Virgilio',
                    text: guidance
                });
            }
        }
        
        return dialogues;
    }

    /**
     * Create level completion dialogue sequence
     * @param {Object} levelData - Level configuration data
     * @param {number} levelNumber - Level number
     * @returns {Array} - Array of dialogue objects
     */
    createLevelCompletionDialogue(levelData, levelNumber) {
        const dialogues = [];
        
        // Main completion narrative
        dialogues.push({
            type: 'completion',
            speaker: 'Narrador',
            text: levelData.narrative.completion
        });
        
        // Add transition to next level (if not final level)
        if (levelNumber < 9) {
            const nextLevel = getLevelConfig(levelNumber + 1);
            if (nextLevel) {
                dialogues.push({
                    type: 'completion',
                    speaker: 'Narrador',
                    text: `Te preparas para descender al ${nextLevel.circle}: ${nextLevel.name}.`
                });
            }
        } else {
            // Final level completion
            dialogues.push({
                type: 'completion',
                speaker: 'Narrador',
                text: 'Has completado tu viaje a través de los nueve círculos del Infierno. La redención te espera.'
            });
        }
        
        return dialogues;
    }

    /**
     * Create fragment collection dialogue
     * @param {number} collected - Fragments collected
     * @param {number} total - Total fragments
     * @param {Object} levelData - Level configuration data
     * @returns {Object} - Dialogue object
     */
    createFragmentDialogue(collected, total, levelData) {
        let text;
        
        if (collected === 1) {
            text = `Has encontrado tu primer fragmento de sabiduría en ${levelData.name}. Quedan ${total - collected} por encontrar.`;
        } else if (collected === total) {
            text = `Has recolectado todos los fragmentos de sabiduría en ${levelData.name}. La salida debería desbloquearse pronto.`;
        } else {
            text = `Has encontrado otro fragmento. Tienes ${collected} de ${total} fragmentos.`;
        }
        
        return {
            type: 'fragment',
            speaker: 'Narrador',
            text: text
        };
    }

    /**
     * Create game completion dialogue sequence
     * @returns {Array} - Array of dialogue objects
     */
    createGameCompletionDialogue() {
        return [
            {
                type: 'completion',
                speaker: 'Narrador',
                text: 'Has completado tu viaje a través de los nueve círculos del Infierno de Dante.'
            },
            {
                type: 'completion',
                speaker: 'Virgilio',
                text: 'Tu viaje ha llegado a su fin, pero la sabiduría que has ganado te acompañará para siempre.'
            },
            {
                type: 'completion',
                speaker: 'Narrador',
                text: 'La Divina Comedia continúa con el Purgatorio y el Paraíso, pero esa es otra historia...'
            },
            {
                type: 'completion',
                speaker: 'Narrador',
                text: '¡Felicidades por completar Inferno Pixelado: La Redención de Dante!'
            }
        ];
    }

    /**
     * Get Virgilio guidance for specific levels
     * @param {number} levelNumber - Level number
     * @returns {string|null} - Guidance text or null
     */
    getVirgilioGuidanceForLevel(levelNumber) {
        const guidance = {
            2: 'En el Limbo encontrarás almas virtuosas que no conocieron la fe cristiana. Observa y aprende de su destino.',
            3: 'Los vientos eternos castigan a quienes se dejaron llevar por la pasión. Mantén tu rumbo firme.',
            4: 'Cerbero guarda este círculo. Los glotones sufren bajo la lluvia eterna. La moderación es una virtud.',
            5: 'Aquí chocan eternamente los avaros y los pródigos. Reflexiona sobre el valor verdadero de las cosas.',
            6: 'Las murallas de Dite se alzan ante nosotros. Los herejes yacen en tumbas ardientes.',
            7: 'El río de sangre hirviente castiga a los violentos. La violencia solo trae más violencia.',
            8: 'Malebolge, las diez fosas del fraude. Aquí el engaño toma muchas formas.',
            9: 'El lago helado del Cocito. Los traidores están congelados para la eternidad. El peor de los pecados.'
        };
        
        return guidance[levelNumber] || null;
    }

    /**
     * Track story progress for statistics
     * @param {string} eventType - Type of narrative event
     * @param {number} levelNumber - Level number
     * @param {Object} metadata - Additional metadata
     */
    trackStoryProgress(eventType, levelNumber, metadata = {}) {
        const progressData = {
            eventType,
            levelNumber,
            timestamp: Date.now(),
            metadata
        };
        
        if (this.onStoryProgress) {
            this.onStoryProgress(progressData);
        }
    }

    /**
     * Check if narrative is currently active
     * @returns {boolean} - True if narrative is active
     */
    isActive() {
        return this.isNarrativeActive || (this.dialogSystem && this.dialogSystem.isActive());
    }

    /**
     * Get story progress statistics
     * @returns {Object} - Story progress data
     */
    getStoryProgress() {
        return {
            dialoguesSeen: Array.from(this.storyProgress.dialoguesSeen),
            levelIntrosSeen: Array.from(this.storyProgress.levelIntrosSeen),
            virgilioEncountersSeen: Array.from(this.storyProgress.virgilioEncountersSeen),
            levelCompletionsSeen: Array.from(this.storyProgress.levelCompletionsSeen),
            specialEventsSeen: Array.from(this.storyProgress.specialEventsSeen),
            totalDialoguesSeen: this.storyProgress.dialoguesSeen.size,
            completionPercentage: this.calculateCompletionPercentage()
        };
    }

    /**
     * Calculate story completion percentage
     * @returns {number} - Completion percentage (0-100)
     */
    calculateCompletionPercentage() {
        // Total possible story events: 9 intros + 1 virgilio + 9 completions + 1 game completion = 20
        const totalPossibleEvents = 20;
        const completedEvents = this.storyProgress.levelIntrosSeen.size + 
                               this.storyProgress.virgilioEncountersSeen.size +
                               this.storyProgress.levelCompletionsSeen.size +
                               this.storyProgress.specialEventsSeen.size;
        
        return Math.round((completedEvents / totalPossibleEvents) * 100);
    }

    /**
     * Set event callbacks
     * @param {Object} callbacks - Object containing callback functions
     */
    setCallbacks(callbacks) {
        this.onNarrativeStart = callbacks.onNarrativeStart || null;
        this.onNarrativeComplete = callbacks.onNarrativeComplete || null;
        this.onStoryProgress = callbacks.onStoryProgress || null;
    }

    /**
     * Get serializable state for saving
     * @returns {Object} - Serializable narrative state
     */
    getSerializableState() {
        return {
            currentLevel: this.currentLevel,
            storyProgress: {
                dialoguesSeen: Array.from(this.storyProgress.dialoguesSeen),
                levelIntrosSeen: Array.from(this.storyProgress.levelIntrosSeen),
                virgilioEncountersSeen: Array.from(this.storyProgress.virgilioEncountersSeen),
                levelCompletionsSeen: Array.from(this.storyProgress.levelCompletionsSeen),
                specialEventsSeen: Array.from(this.storyProgress.specialEventsSeen)
            }
        };
    }

    /**
     * Load state from serialized data
     * @param {Object} state - Serialized narrative state
     */
    loadState(state) {
        this.currentLevel = state.currentLevel || 1;
        
        if (state.storyProgress) {
            this.storyProgress.dialoguesSeen = new Set(state.storyProgress.dialoguesSeen || []);
            this.storyProgress.levelIntrosSeen = new Set(state.storyProgress.levelIntrosSeen || []);
            this.storyProgress.virgilioEncountersSeen = new Set(state.storyProgress.virgilioEncountersSeen || []);
            this.storyProgress.levelCompletionsSeen = new Set(state.storyProgress.levelCompletionsSeen || []);
            this.storyProgress.specialEventsSeen = new Set(state.storyProgress.specialEventsSeen || []);
        }
    }

    /**
     * Reset narrative progress
     */
    reset() {
        this.currentLevel = 1;
        this.storyProgress = {
            dialoguesSeen: new Set(),
            levelIntrosSeen: new Set(),
            virgilioEncountersSeen: new Set(),
            levelCompletionsSeen: new Set(),
            specialEventsSeen: new Set()
        };
        this.isNarrativeActive = false;
        this.pendingNarratives = [];
    }

    /**
     * Destroy narrative manager and clean up
     */
    destroy() {
        if (this.dialogSystem) {
            this.dialogSystem.destroy();
            this.dialogSystem = null;
        }
        
        this.reset();
        this.onNarrativeStart = null;
        this.onNarrativeComplete = null;
        this.onStoryProgress = null;
    }
}