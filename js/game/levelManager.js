/**
 * Level Manager
 * Handles level progression and maze generation for different circles of hell
 * Requirements: 4.1, 4.2, 4.3 - Level progression and difficulty scaling
 */

import { LevelData, getLevelConfig, getMaxLevel, levelExists } from '../data/levelData.js';
import { Maze } from './maze.js';

export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.levelData = null;
        this.currentMaze = null;
        this.maxLevel = getMaxLevel();
        this.levelHistory = [];
        
        // Event callbacks
        this.onLevelLoad = null;
        this.onLevelComplete = null;
        this.onGameComplete = null;
        this.onLevelTransition = null;
    }

    /**
     * Load specific level (circle of hell)
     * Requirements: 4.1, 4.2
     * @param {number} levelNumber - Level number to load (1-9)
     * @returns {boolean} - True if level was loaded successfully
     */
    loadLevel(levelNumber) {
        if (!levelExists(levelNumber)) {
            console.error(`Level ${levelNumber} does not exist`);
            return false;
        }

        // Store previous level in history
        if (this.levelData) {
            this.levelHistory.push({
                level: this.currentLevel,
                data: this.levelData,
                completedAt: new Date().toISOString()
            });
        }

        this.currentLevel = levelNumber;
        this.levelData = getLevelConfig(levelNumber);
        
        if (!this.levelData) {
            console.error(`Failed to load level data for level ${levelNumber}`);
            return false;
        }

        // Generate maze for this level
        this.currentMaze = this.generateMaze(this.levelData.difficulty);
        
        // Trigger callback if set
        if (this.onLevelLoad) {
            this.onLevelLoad(this.currentLevel, this.levelData);
        }

        return true;
    }

    /**
     * Get current level data
     * @returns {Object|null} - Current level configuration
     */
    getCurrentLevel() {
        return this.levelData;
    }

    /**
     * Get current level number
     * @returns {number} - Current level number
     */
    getCurrentLevelNumber() {
        return this.currentLevel;
    }

    /**
     * Get current maze
     * @returns {Maze|null} - Current maze instance
     */
    getCurrentMaze() {
        return this.currentMaze;
    }

    /**
     * Progress to next level
     * Requirements: 4.1, 4.2
     * @returns {boolean} - True if progression was successful
     */
    progressToNext() {
        const nextLevel = this.currentLevel + 1;
        
        // Check if we've completed the game
        if (nextLevel > this.maxLevel) {
            if (this.onGameComplete) {
                this.onGameComplete(this.levelHistory);
            }
            return false;
        }

        // Trigger level completion callback
        if (this.onLevelComplete) {
            this.onLevelComplete(this.currentLevel, this.levelData);
        }

        // Trigger transition callback
        if (this.onLevelTransition) {
            this.onLevelTransition(this.currentLevel, nextLevel);
        }

        // Load next level
        return this.loadLevel(nextLevel);
    }

    /**
     * Generate maze for current level with progressive difficulty
     * Requirements: 4.2, 4.3
     * @param {number} difficulty - Difficulty level (1-9)
     * @returns {Maze} - Generated maze instance
     */
    generateMaze(difficulty) {
        if (!this.levelData) {
            throw new Error('No level data available for maze generation');
        }

        const { width, height } = this.levelData.mazeSize;
        const maze = new Maze(width, height, difficulty);
        
        // Generate the maze structure
        maze.generate();
        
        // Place entities based on level configuration
        maze.placeEntities({
            hasVirgilio: this.levelData.hasVirgilio,
            fragmentCount: this.levelData.requiredFragments
        });

        return maze;
    }

    /**
     * Check if current level is complete
     * @param {Object} objectiveManager - ObjectiveManager instance
     * @returns {boolean} - True if level can be completed
     */
    canCompleteLevel(objectiveManager) {
        if (!objectiveManager) {
            return false;
        }
        return objectiveManager.areAllObjectivesCompleted();
    }

    /**
     * Get level progression statistics
     * @returns {Object} - Progression statistics
     */
    getProgressionStats() {
        const isGameComplete = this.levelHistory.length >= this.maxLevel;
        return {
            currentLevel: this.currentLevel,
            maxLevel: this.maxLevel,
            completedLevels: this.levelHistory.length,
            progressPercentage: (this.levelHistory.length / this.maxLevel) * 100,
            isGameComplete: isGameComplete,
            levelsRemaining: Math.max(0, this.maxLevel - this.levelHistory.length)
        };
    }

    /**
     * Get difficulty scaling information
     * Requirements: 4.2, 4.3
     * @returns {Object} - Difficulty scaling data
     */
    getDifficultyScaling() {
        if (!this.levelData) {
            return null;
        }

        const baseLevel = getLevelConfig(1);
        const currentLevel = this.levelData;
        
        return {
            level: this.currentLevel,
            difficulty: currentLevel.difficulty,
            mazeSize: currentLevel.mazeSize,
            requiredFragments: currentLevel.requiredFragments,
            scaling: {
                mazeSizeIncrease: {
                    width: currentLevel.mazeSize.width - baseLevel.mazeSize.width,
                    height: currentLevel.mazeSize.height - baseLevel.mazeSize.height
                },
                fragmentIncrease: currentLevel.requiredFragments - baseLevel.requiredFragments,
                difficultyMultiplier: currentLevel.difficulty / baseLevel.difficulty
            }
        };
    }

    /**
     * Get level theme for rendering
     * Requirements: 4.3
     * @returns {Object|null} - Level theme configuration
     */
    getLevelTheme() {
        return this.levelData ? this.levelData.theme : null;
    }

    /**
     * Get level narrative content
     * @returns {Object|null} - Level narrative content
     */
    getLevelNarrative() {
        return this.levelData ? this.levelData.narrative : null;
    }

    /**
     * Reset to specific level
     * @param {number} levelNumber - Level to reset to (default: 1)
     * @returns {boolean} - True if reset was successful
     */
    resetToLevel(levelNumber = 1) {
        this.levelHistory = [];
        this.currentMaze = null;
        this.levelData = null;
        return this.loadLevel(levelNumber);
    }

    /**
     * Get level completion history
     * @returns {Array} - Array of completed level data
     */
    getLevelHistory() {
        return [...this.levelHistory];
    }

    /**
     * Check if level is unlocked (for UI purposes)
     * @param {number} levelNumber - Level to check
     * @returns {boolean} - True if level is unlocked
     */
    isLevelUnlocked(levelNumber) {
        // Level 1 is always unlocked
        if (levelNumber === 1) {
            return true;
        }
        
        // Level is unlocked if previous level is completed
        return this.levelHistory.some(entry => entry.level === levelNumber - 1);
    }

    /**
     * Get next level preview
     * @returns {Object|null} - Next level data or null if game complete
     */
    getNextLevelPreview() {
        const nextLevel = this.currentLevel + 1;
        return nextLevel <= this.maxLevel ? getLevelConfig(nextLevel) : null;
    }

    /**
     * Set event callbacks
     * @param {Object} callbacks - Object containing callback functions
     */
    setCallbacks(callbacks) {
        this.onLevelLoad = callbacks.onLevelLoad || null;
        this.onLevelComplete = callbacks.onLevelComplete || null;
        this.onGameComplete = callbacks.onGameComplete || null;
        this.onLevelTransition = callbacks.onLevelTransition || null;
    }

    /**
     * Get serializable state for saving
     * @returns {Object} - Serializable level manager state
     */
    getSerializableState() {
        return {
            currentLevel: this.currentLevel,
            levelHistory: this.levelHistory,
            levelData: this.levelData
        };
    }

    /**
     * Load state from serialized data
     * @param {Object} state - Serialized level manager state
     * @returns {boolean} - True if state was loaded successfully
     */
    loadState(state) {
        try {
            this.currentLevel = state.currentLevel || 1;
            this.levelHistory = state.levelHistory || [];
            
            // Reload current level
            return this.loadLevel(this.currentLevel);
        } catch (error) {
            console.error('Failed to load level manager state:', error);
            return false;
        }
    }

    /**
     * Validate level progression (for debugging)
     * @returns {Object} - Validation results
     */
    validateProgression() {
        const issues = [];
        
        // Check if current level exists
        if (!levelExists(this.currentLevel)) {
            issues.push(`Current level ${this.currentLevel} does not exist`);
        }
        
        // Check level history consistency
        for (let i = 0; i < this.levelHistory.length - 1; i++) {
            const current = this.levelHistory[i];
            const next = this.levelHistory[i + 1];
            
            if (next.level !== current.level + 1) {
                issues.push(`Level progression gap: ${current.level} -> ${next.level}`);
            }
        }
        
        // Check if maze exists for current level
        if (!this.currentMaze) {
            issues.push('No maze generated for current level');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues,
            currentLevel: this.currentLevel,
            historyLength: this.levelHistory.length
        };
    }
}