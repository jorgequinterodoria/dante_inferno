/**
 * Unit tests for LevelManager
 * Tests level progression and difficulty scaling according to requirements 4.1, 4.2, 4.3
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LevelManager } from '../../js/game/levelManager.js';
import { ObjectiveManager } from '../../js/game/objectives.js';

describe('LevelManager', () => {
    let levelManager;

    beforeEach(() => {
        levelManager = new LevelManager();
    });

    describe('Initialization', () => {
        test('should initialize with default values', () => {
            expect(levelManager.getCurrentLevelNumber()).toBe(1);
            expect(levelManager.getCurrentLevel()).toBe(null);
            expect(levelManager.getCurrentMaze()).toBe(null);
            expect(levelManager.getLevelHistory()).toHaveLength(0);
        });

        test('should have correct max level', () => {
            const stats = levelManager.getProgressionStats();
            expect(stats.maxLevel).toBe(9);
        });
    });

    describe('Level Loading - Requirement 4.1', () => {
        test('should load level 1 successfully', () => {
            const result = levelManager.loadLevel(1);
            
            expect(result).toBe(true);
            expect(levelManager.getCurrentLevelNumber()).toBe(1);
            
            const levelData = levelManager.getCurrentLevel();
            expect(levelData).toBeDefined();
            expect(levelData.name).toBe("Bosque Oscuro");
            expect(levelData.difficulty).toBe(1);
            expect(levelData.requiredFragments).toBe(3);
            expect(levelData.hasVirgilio).toBe(true);
        });

        test('should load different levels with correct configurations', () => {
            // Load level 3 (Lujuria)
            levelManager.loadLevel(3);
            const level3 = levelManager.getCurrentLevel();
            
            expect(level3.name).toBe("Lujuria");
            expect(level3.difficulty).toBe(3);
            expect(level3.requiredFragments).toBe(5);
            expect(level3.mazeSize.width).toBe(21);
            expect(level3.mazeSize.height).toBe(21);
            expect(level3.hasVirgilio).toBe(false);
        });

        test('should fail to load non-existent level', () => {
            const result = levelManager.loadLevel(99);
            
            expect(result).toBe(false);
            expect(levelManager.getCurrentLevelNumber()).toBe(1); // Should remain unchanged
        });

        test('should generate maze when loading level', () => {
            levelManager.loadLevel(1);
            const maze = levelManager.getCurrentMaze();
            
            expect(maze).toBeDefined();
            expect(maze.width).toBe(15);
            expect(maze.height).toBe(15);
        });

        test('should trigger onLevelLoad callback', () => {
            const callback = vi.fn();
            levelManager.setCallbacks({ onLevelLoad: callback });
            
            levelManager.loadLevel(2);
            
            expect(callback).toHaveBeenCalledWith(2, expect.any(Object));
        });
    });

    describe('Level Progression - Requirement 4.1, 4.2', () => {
        test('should progress to next level successfully', () => {
            levelManager.loadLevel(1);
            
            const result = levelManager.progressToNext();
            
            expect(result).toBe(true);
            expect(levelManager.getCurrentLevelNumber()).toBe(2);
            
            const levelData = levelManager.getCurrentLevel();
            expect(levelData.name).toBe("Limbo");
        });

        test('should add completed level to history', () => {
            levelManager.loadLevel(1);
            levelManager.progressToNext();
            
            const history = levelManager.getLevelHistory();
            expect(history).toHaveLength(1);
            expect(history[0].level).toBe(1);
            expect(history[0].data.name).toBe("Bosque Oscuro");
        });

        test('should not progress beyond max level', () => {
            levelManager.loadLevel(9); // Load final level
            
            const result = levelManager.progressToNext();
            
            expect(result).toBe(false);
            expect(levelManager.getCurrentLevelNumber()).toBe(9);
        });

        test('should trigger callbacks during progression', () => {
            const onLevelComplete = vi.fn();
            const onLevelTransition = vi.fn();
            const onGameComplete = vi.fn();
            
            levelManager.setCallbacks({
                onLevelComplete,
                onLevelTransition,
                onGameComplete
            });
            
            levelManager.loadLevel(1);
            levelManager.progressToNext();
            
            expect(onLevelComplete).toHaveBeenCalledWith(1, expect.any(Object));
            expect(onLevelTransition).toHaveBeenCalledWith(1, 2);
            expect(onGameComplete).not.toHaveBeenCalled();
        });

        test('should trigger game complete callback at final level', () => {
            const onGameComplete = vi.fn();
            levelManager.setCallbacks({ onGameComplete });
            
            levelManager.loadLevel(9);
            levelManager.progressToNext();
            
            expect(onGameComplete).toHaveBeenCalledWith(expect.any(Array));
        });
    });

    describe('Difficulty Scaling - Requirements 4.2, 4.3', () => {
        test('should scale maze size with difficulty', () => {
            // Level 1: 15x15
            levelManager.loadLevel(1);
            let levelData = levelManager.getCurrentLevel();
            expect(levelData.mazeSize.width).toBe(15);
            expect(levelData.mazeSize.height).toBe(15);
            
            // Level 5: 27x27
            levelManager.loadLevel(5);
            levelData = levelManager.getCurrentLevel();
            expect(levelData.mazeSize.width).toBe(27);
            expect(levelData.mazeSize.height).toBe(27);
            
            // Level 9: 39x39
            levelManager.loadLevel(9);
            levelData = levelManager.getCurrentLevel();
            expect(levelData.mazeSize.width).toBe(39);
            expect(levelData.mazeSize.height).toBe(39);
        });

        test('should scale required fragments with difficulty', () => {
            levelManager.loadLevel(1);
            expect(levelManager.getCurrentLevel().requiredFragments).toBe(3);
            
            levelManager.loadLevel(5);
            expect(levelManager.getCurrentLevel().requiredFragments).toBe(7);
            
            levelManager.loadLevel(9);
            expect(levelManager.getCurrentLevel().requiredFragments).toBe(12);
        });

        test('should provide difficulty scaling information', () => {
            levelManager.loadLevel(5);
            const scaling = levelManager.getDifficultyScaling();
            
            expect(scaling.level).toBe(5);
            expect(scaling.difficulty).toBe(5);
            expect(scaling.scaling.mazeSizeIncrease.width).toBe(12); // 27 - 15
            expect(scaling.scaling.mazeSizeIncrease.height).toBe(12); // 27 - 15
            expect(scaling.scaling.fragmentIncrease).toBe(4); // 7 - 3
            expect(scaling.scaling.difficultyMultiplier).toBe(5); // 5 / 1
        });

        test('should have different themes for each level', () => {
            levelManager.loadLevel(1);
            const theme1 = levelManager.getLevelTheme();
            expect(theme1.backgroundColor).toBe("#2d1810");
            
            levelManager.loadLevel(3);
            const theme3 = levelManager.getLevelTheme();
            expect(theme3.backgroundColor).toBe("#4B0000");
            
            expect(theme1.backgroundColor).not.toBe(theme3.backgroundColor);
        });

        test('should only have Virgilio in level 1', () => {
            levelManager.loadLevel(1);
            expect(levelManager.getCurrentLevel().hasVirgilio).toBe(true);
            
            for (let level = 2; level <= 9; level++) {
                levelManager.loadLevel(level);
                expect(levelManager.getCurrentLevel().hasVirgilio).toBe(false);
            }
        });
    });

    describe('Level Completion Logic', () => {
        test('should check if level can be completed with objective manager', () => {
            levelManager.loadLevel(1);
            const maze = levelManager.getCurrentMaze();
            const objectiveManager = new ObjectiveManager(maze);
            
            // Initially cannot complete
            expect(levelManager.canCompleteLevel(objectiveManager)).toBe(false);
            
            // Complete all objectives
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            
            // Now can complete
            expect(levelManager.canCompleteLevel(objectiveManager)).toBe(true);
        });

        test('should handle null objective manager', () => {
            levelManager.loadLevel(1);
            expect(levelManager.canCompleteLevel(null)).toBe(false);
        });
    });

    describe('Progression Statistics', () => {
        test('should provide accurate progression statistics', () => {
            levelManager.loadLevel(1);
            levelManager.progressToNext(); // Complete level 1
            levelManager.progressToNext(); // Complete level 2
            
            const stats = levelManager.getProgressionStats();
            
            expect(stats.currentLevel).toBe(3);
            expect(stats.maxLevel).toBe(9);
            expect(stats.completedLevels).toBe(2);
            expect(stats.progressPercentage).toBeCloseTo(22.22, 1); // 2/9 * 100
            expect(stats.isGameComplete).toBe(false);
            expect(stats.levelsRemaining).toBe(7);
        });

        test('should indicate game completion', () => {
            // Simulate completing all levels
            for (let i = 1; i <= 9; i++) {
                levelManager.loadLevel(i);
                if (i < 9) levelManager.progressToNext();
            }
            levelManager.progressToNext(); // Try to go beyond level 9
            
            const stats = levelManager.getProgressionStats();
            expect(stats.isGameComplete).toBe(true);
            expect(stats.levelsRemaining).toBe(0);
        });
    });

    describe('Level Unlocking and Navigation', () => {
        test('should check level unlock status', () => {
            expect(levelManager.isLevelUnlocked(1)).toBe(true); // Always unlocked
            expect(levelManager.isLevelUnlocked(2)).toBe(false); // Not unlocked initially
            
            levelManager.loadLevel(1);
            levelManager.progressToNext(); // Complete level 1
            
            expect(levelManager.isLevelUnlocked(2)).toBe(true); // Now unlocked
            expect(levelManager.isLevelUnlocked(3)).toBe(false); // Still locked
        });

        test('should provide next level preview', () => {
            levelManager.loadLevel(1);
            const preview = levelManager.getNextLevelPreview();
            
            expect(preview).toBeDefined();
            expect(preview.name).toBe("Limbo");
            expect(preview.circle).toBe("Primer Círculo");
        });

        test('should return null for next level preview at final level', () => {
            levelManager.loadLevel(9);
            const preview = levelManager.getNextLevelPreview();
            
            expect(preview).toBe(null);
        });
    });

    describe('State Management', () => {
        test('should reset to specific level', () => {
            levelManager.loadLevel(5);
            levelManager.progressToNext();
            
            const result = levelManager.resetToLevel(1);
            
            expect(result).toBe(true);
            expect(levelManager.getCurrentLevelNumber()).toBe(1);
            expect(levelManager.getLevelHistory()).toHaveLength(0);
        });

        test('should serialize and load state correctly', () => {
            levelManager.loadLevel(3);
            levelManager.progressToNext();
            levelManager.progressToNext();
            
            const state = levelManager.getSerializableState();
            const newManager = new LevelManager();
            const result = newManager.loadState(state);
            
            expect(result).toBe(true);
            expect(newManager.getCurrentLevelNumber()).toBe(5);
            expect(newManager.getLevelHistory()).toHaveLength(2);
        });

        test('should handle invalid state gracefully', () => {
            const invalidState = { currentLevel: 99, levelHistory: [] };
            const result = levelManager.loadState(invalidState);
            
            expect(result).toBe(false);
        });
    });

    describe('Narrative and Theme Access', () => {
        test('should provide level narrative content', () => {
            levelManager.loadLevel(1);
            const narrative = levelManager.getLevelNarrative();
            
            expect(narrative).toBeDefined();
            expect(narrative.intro).toContain("bosque oscuro");
            expect(narrative.virgilioDialogue).toContain("Virgilio");
            expect(narrative.completion).toBeDefined();
        });

        test('should provide level theme for rendering', () => {
            levelManager.loadLevel(2);
            const theme = levelManager.getLevelTheme();
            
            expect(theme).toBeDefined();
            expect(theme.backgroundColor).toBeDefined();
            expect(theme.wallColor).toBeDefined();
            expect(theme.pathColor).toBeDefined();
            expect(theme.lightingColor).toBeDefined();
        });
    });

    describe('Validation and Error Handling', () => {
        test('should validate progression correctly', () => {
            levelManager.loadLevel(1);
            const validation = levelManager.validateProgression();
            
            expect(validation.isValid).toBe(true);
            expect(validation.issues).toHaveLength(0);
            expect(validation.currentLevel).toBe(1);
        });

        test('should detect validation issues', () => {
            levelManager.currentLevel = 99; // Invalid level
            const validation = levelManager.validateProgression();
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues.length).toBeGreaterThan(0);
        });

        test('should handle maze generation errors', () => {
            levelManager.levelData = null;
            
            expect(() => {
                levelManager.generateMaze(1);
            }).toThrow('No level data available for maze generation');
        });
    });
});