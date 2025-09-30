/**
 * Objective Manager
 * Tracks completion of Virgilio encounter, fragment collection, and exit unlock
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

export class ObjectiveManager {
    constructor(maze = null, audioService = null) {
        this.maze = maze;
        this.virgilioFound = false;
        this.fragmentsCollected = 0;
        this.totalFragments = 3;
        this.exitUnlocked = false;
        this.collectedFragmentIds = new Set();
        
        // Audio service for sound effects
        this.audioService = audioService;
        
        // Event callbacks for UI updates
        this.onObjectiveUpdate = null;
        this.onVirgiliofound = null;
        this.onFragmentCollected = null;
        this.onExitUnlocked = null;
    }

    /**
     * Set the maze reference for objective checking
     * @param {Maze} maze - The current maze instance
     */
    setMaze(maze) {
        this.maze = maze;
        this.updateTotalFragments();
    }

    /**
     * Update total fragments based on current maze
     */
    updateTotalFragments() {
        if (this.maze) {
            this.totalFragments = this.maze.getTotalFragmentsCount();
        }
    }

    /**
     * Check if objectives are met based on player position
     * Requirements: 2.1, 2.2, 2.4
     * @param {Object} playerPosition - Player's current position {x, y}
     * @returns {Object} - Object with collected entities and status updates
     */
    checkObjectives(playerPosition) {
        if (!this.maze) {
            return { collected: [], statusChanged: false };
        }

        const result = {
            collected: [],
            statusChanged: false
        };

        // Check for entity at player position
        const entity = this.maze.getEntityAt(playerPosition.x, playerPosition.y);
        
        if (entity) {
            // Collect the entity from maze
            const collectedEntity = this.maze.collectEntity(playerPosition.x, playerPosition.y);
            
            if (collectedEntity) {
                result.collected.push(collectedEntity);
                
                // Handle different entity types
                if (collectedEntity.type === 'virgilio') {
                    const wasFound = this.virgilioFound;
                    this.findVirgilio();
                    if (!wasFound && this.virgilioFound) {
                        result.statusChanged = true;
                    }
                } else if (collectedEntity.type === 'fragment') {
                    const previousCount = this.fragmentsCollected;
                    this.collectFragment(collectedEntity.id);
                    if (this.fragmentsCollected > previousCount) {
                        result.statusChanged = true;
                    }
                }
            }
        }

        // Check if exit should be unlocked
        const wasUnlocked = this.exitUnlocked;
        this.updateExitStatus();
        if (!wasUnlocked && this.exitUnlocked) {
            result.statusChanged = true;
        }

        return result;
    }

    /**
     * Handle fragment collection
     * Requirements: 2.2
     * @param {number} fragmentId - ID of the collected fragment
     * @returns {boolean} - True if fragment was newly collected
     */
    collectFragment(fragmentId) {
        if (this.collectedFragmentIds.has(fragmentId)) {
            return false; // Already collected
        }

        this.collectedFragmentIds.add(fragmentId);
        this.fragmentsCollected = this.collectedFragmentIds.size;

        // Play fragment collection sound
        if (this.audioService) {
            this.audioService.playObjectiveSound('fragment');
        }

        // Trigger callback if set
        if (this.onFragmentCollected) {
            this.onFragmentCollected(this.fragmentsCollected, this.totalFragments);
        }

        // Check if exit should be unlocked
        this.updateExitStatus();

        return true;
    }

    /**
     * Handle Virgilio encounter
     * Requirements: 2.1
     * @returns {boolean} - True if Virgilio was newly found
     */
    findVirgilio() {
        if (this.virgilioFound) {
            return false; // Already found
        }

        this.virgilioFound = true;

        // Play Virgilio found sound
        if (this.audioService) {
            this.audioService.playObjectiveSound('virgilio');
        }

        // Trigger callback if set
        if (this.onVirgiliofound) {
            this.onVirgiliofound();
        }

        // Check if exit should be unlocked
        this.updateExitStatus();

        return true;
    }

    /**
     * Update exit unlock status based on objective completion
     * Requirements: 2.4, 2.5
     */
    updateExitStatus() {
        const wasUnlocked = this.exitUnlocked;
        
        // Exit is unlocked when all objectives are completed
        this.exitUnlocked = this.areAllObjectivesCompleted();

        // Trigger callback if status changed
        if (!wasUnlocked && this.exitUnlocked) {
            // Play exit unlocked sound
            if (this.audioService) {
                this.audioService.playObjectiveSound('exit');
            }
            
            if (this.onExitUnlocked) {
                this.onExitUnlocked();
            }
        }
    }

    /**
     * Check if all objectives are completed
     * Requirements: 2.4, 2.5
     * @returns {boolean} - True if all objectives are completed
     */
    areAllObjectivesCompleted() {
        return this.virgilioFound && this.fragmentsCollected >= this.totalFragments;
    }

    /**
     * Check if exit is unlocked
     * Requirements: 2.5
     * @returns {boolean} - True if exit is unlocked
     */
    isExitUnlocked() {
        return this.exitUnlocked;
    }

    /**
     * Get current objective status
     * @returns {Object} - Current status of all objectives
     */
    getObjectiveStatus() {
        return {
            virgilioFound: this.virgilioFound,
            fragmentsCollected: this.fragmentsCollected,
            totalFragments: this.totalFragments,
            exitUnlocked: this.exitUnlocked,
            allCompleted: this.areAllObjectivesCompleted()
        };
    }

    /**
     * Get fragments collection progress
     * @returns {Object} - Fragment collection progress
     */
    getFragmentProgress() {
        return {
            collected: this.fragmentsCollected,
            total: this.totalFragments,
            remaining: this.totalFragments - this.fragmentsCollected,
            percentage: this.totalFragments > 0 ? (this.fragmentsCollected / this.totalFragments) * 100 : 0
        };
    }

    /**
     * Check if player can exit the level
     * Requirements: 2.5
     * @param {Object} playerPosition - Player's current position {x, y}
     * @returns {boolean} - True if player can exit
     */
    canExitLevel(playerPosition) {
        if (!this.maze || !this.exitUnlocked) {
            return false;
        }

        const exitPosition = this.maze.getExitPosition();
        return playerPosition.x === exitPosition.x && playerPosition.y === exitPosition.y;
    }

    /**
     * Reset objectives for new level
     * @param {number} totalFragments - Total fragments for the new level
     */
    reset(totalFragments = 3) {
        this.virgilioFound = false;
        this.fragmentsCollected = 0;
        this.totalFragments = totalFragments;
        this.exitUnlocked = false;
        this.collectedFragmentIds.clear();
    }

    /**
     * Set event callbacks for UI updates
     * @param {Object} callbacks - Object containing callback functions
     */
    setCallbacks(callbacks) {
        this.onObjectiveUpdate = callbacks.onObjectiveUpdate || null;
        this.onVirgiliofound = callbacks.onVirgiliofound || null;
        this.onFragmentCollected = callbacks.onFragmentCollected || null;
        this.onExitUnlocked = callbacks.onExitUnlocked || null;
    }

    /**
     * Get serializable state for saving
     * @returns {Object} - Serializable objective state
     */
    getSerializableState() {
        return {
            virgilioFound: this.virgilioFound,
            fragmentsCollected: this.fragmentsCollected,
            totalFragments: this.totalFragments,
            exitUnlocked: this.exitUnlocked,
            collectedFragmentIds: Array.from(this.collectedFragmentIds)
        };
    }

    /**
     * Load state from serialized data
     * @param {Object} state - Serialized objective state
     */
    loadState(state) {
        this.virgilioFound = state.virgilioFound || false;
        this.fragmentsCollected = state.fragmentsCollected || 0;
        this.totalFragments = state.totalFragments || 3;
        this.exitUnlocked = state.exitUnlocked || false;
        this.collectedFragmentIds = new Set(state.collectedFragmentIds || []);
    }

    /**
     * Set audio service for sound effects
     * @param {AudioService} audioService - Audio service instance
     */
    setAudioService(audioService) {
        this.audioService = audioService;
    }
}