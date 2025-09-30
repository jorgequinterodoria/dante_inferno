/**
 * Level Progression Integration Tests
 * Tests level progression and objective completion according to requirements 4.1-4.3
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LevelManager } from '../../js/game/levelManager.js';
import { ObjectiveManager } from '../../js/game/objectives.js';
import { Player } from '../../js/game/player.js';
import { Maze } from '../../js/game/maze.js';
import { getLevelConfig } from '../../js/data/levelData.js';

describe('Level Progression Integration', () => {
    let levelManager;

    beforeEach(() => {
        levelManager = new LevelManager();
        
        // Mock Date.now for consistent testing
        vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Level Progression Flow - Requirements 4.1, 4.2, 4.3', () => {
        test('should progress through multiple levels with increasing difficulty', () => {
            // Start with level 1
            const result1 = levelManager.loadLevel(1);
            expect(result1).toBe(true);
            expect(levelManager.getCurrentLevelNumber()).toBe(1);

            // Test progression through first 3 levels
            for (let level = 1; level <= 3; level++) {
                const levelConfig = getLevelConfig(level);
                
                // Verify level configuration exists
                expect(levelConfig).toBeTruthy();
                expect(levelConfig.mazeSize).toBeTruthy();
                expect(levelConfig.mazeSize.width).toBeGreaterThan(0);
                expect(levelConfig.mazeSize.height).toBeGreaterThan(0);

                // Load the level
                const loadResult = levelManager.loadLevel(level);
                expect(loadResult).toBe(true);
                expect(levelManager.getCurrentLevelNumber()).toBe(level);

                // Progress to next level if not at max
                if (level < 3) {
                    const progressResult = levelManager.progressToNext();
                    expect(progressResult).toBe(true);
                    expect(levelManager.getCurrentLevelNumber()).toBe(level + 1);
                }
            }
        });

        test('should generate increasingly difficult mazes', () => {
            const level1Config = getLevelConfig(1);
            const level3Config = getLevelConfig(3);
            const level5Config = getLevelConfig(5);

            // Calculate maze sizes
            const level1Size = level1Config.mazeSize.width * level1Config.mazeSize.height;
            const level3Size = level3Config.mazeSize.width * level3Config.mazeSize.height;
            const level5Size = level5Config.mazeSize.width * level5Config.mazeSize.height;

            // Higher levels should have larger or equal maze sizes
            expect(level3Size).toBeGreaterThanOrEqual(level1Size);
            expect(level5Size).toBeGreaterThanOrEqual(level3Size);
        });

        test('should maintain different themes for different levels', () => {
            const level1Config = getLevelConfig(1);
            const level2Config = getLevelConfig(2);
            const level3Config = getLevelConfig(3);

            // Each level should have unique properties
            expect(level1Config.name).not.toBe(level2Config.name);
            expect(level2Config.name).not.toBe(level3Config.name);
            
            // Themes should be different
            expect(level1Config.theme).not.toEqual(level2Config.theme);
            expect(level2Config.theme).not.toEqual(level3Config.theme);
        });
    });

    describe('Complete Level Flow Integration', () => {
        test('should handle complete level from start to finish', () => {
            // Load level 1
            levelManager.loadLevel(1);
            const levelConfig = getLevelConfig(1);

            // Create maze for level 1
            const maze = new Maze(levelConfig.mazeSize.width, levelConfig.mazeSize.height, 1);
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });

            // Initialize player
            const startPos = maze.getStartPosition();
            const player = new Player(startPos.x, startPos.y);

            // Initialize objectives
            const objectiveManager = new ObjectiveManager(maze);

            // Verify initial state
            expect(objectiveManager.virgilioFound).toBe(false);
            expect(objectiveManager.fragmentsCollected).toBe(0);
            expect(objectiveManager.isExitUnlocked()).toBe(false);

            // Find Virgilio
            const virgilioEntity = maze.getEntitiesByType('virgilio')[0];
            player.reset({ x: virgilioEntity.x, y: virgilioEntity.y });
            let result = objectiveManager.checkObjectives(player.getPosition());
            
            expect(result.collected).toHaveLength(1);
            expect(result.collected[0].type).toBe('virgilio');
            expect(objectiveManager.virgilioFound).toBe(true);

            // Collect all fragments
            const fragmentEntities = maze.getEntitiesByType('fragment');
            let fragmentsCollected = 0;
            
            for (const fragment of fragmentEntities) {
                player.reset({ x: fragment.x, y: fragment.y });
                result = objectiveManager.checkObjectives(player.getPosition());
                
                if (result.collected.length > 0 && result.collected[0].type === 'fragment') {
                    fragmentsCollected++;
                }
            }

            expect(fragmentsCollected).toBe(3);
            expect(objectiveManager.fragmentsCollected).toBe(3);
            expect(objectiveManager.isExitUnlocked()).toBe(true);

            // Complete level at exit
            const exitPosition = maze.getExitPosition();
            player.reset(exitPosition);
            const canExit = objectiveManager.canExitLevel(player.getPosition());
            expect(canExit).toBe(true);
        });

        test('should prevent level completion without all objectives', () => {
            levelManager.loadLevel(1);
            const levelConfig = getLevelConfig(1);

            const maze = new Maze(levelConfig.mazeSize.width, levelConfig.mazeSize.height, 1);
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });

            const exitPosition = maze.getExitPosition();
            const player = new Player(exitPosition.x, exitPosition.y);
            const objectiveManager = new ObjectiveManager(maze);

            // Try to exit without completing objectives
            const canExit = objectiveManager.canExitLevel(player.getPosition());
            expect(canExit).toBe(false);

            // Complete only Virgilio objective
            objectiveManager.findVirgilio();
            const canExitWithVirgilio = objectiveManager.canExitLevel(player.getPosition());
            expect(canExitWithVirgilio).toBe(false);

            // Complete only fragments
            objectiveManager.reset(3); // Reset Virgilio
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            const canExitWithFragments = objectiveManager.canExitLevel(player.getPosition());
            expect(canExitWithFragments).toBe(false);
        });
    });

    describe('Maze Generation Integration', () => {
        test('should generate valid mazes for all levels', () => {
            for (let level = 1; level <= 5; level++) {
                const levelConfig = getLevelConfig(level);
                const maze = new Maze(
                    levelConfig.mazeSize.width, 
                    levelConfig.mazeSize.height, 
                    level
                );
                
                maze.generate();
                maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });

                // Verify maze is valid
                expect(maze.isSolvable()).toBe(true);
                
                // Verify entities are placed
                const virgilioEntities = maze.getEntitiesByType('virgilio');
                const fragmentEntities = maze.getEntitiesByType('fragment');
                
                expect(virgilioEntities).toHaveLength(1);
                expect(fragmentEntities).toHaveLength(3);

                // Verify start and exit positions are walkable
                const startPos = maze.getStartPosition();
                const exitPos = maze.getExitPosition();
                
                expect(maze.isWalkable(startPos.x, startPos.y)).toBe(true);
                expect(maze.isWalkable(exitPos.x, exitPos.y)).toBe(true);
            }
        });

        test('should handle player movement in generated mazes', () => {
            const levelConfig = getLevelConfig(2);
            const maze = new Maze(levelConfig.mazeSize.width, levelConfig.mazeSize.height, 2);
            maze.generate();

            const startPos = maze.getStartPosition();
            const player = new Player(startPos.x, startPos.y);

            // Test movement in all directions
            const directions = ['up', 'down', 'left', 'right'];
            let validMovesFound = 0;
            let blockedMovesFound = 0;

            for (const direction of directions) {
                const result = player.move(direction, maze);
                if (result) {
                    validMovesFound++;
                    player.completeMovement(); // Reset for next test
                } else {
                    blockedMovesFound++;
                }
            }

            // Should have at least one valid move from start position
            expect(validMovesFound).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid level numbers gracefully', () => {
            const invalidLevelConfig = getLevelConfig(999);
            
            // Should return null for invalid levels
            expect(invalidLevelConfig).toBeNull();
            
            // LevelManager should handle invalid level loading gracefully
            const loadResult = levelManager.loadLevel(999);
            expect(loadResult).toBe(false);
        });

        test('should handle maze generation failures gracefully', () => {
            // Test with very small maze that might cause issues
            const tinyMaze = new Maze(3, 3, 1);
            
            expect(() => {
                tinyMaze.generate();
                tinyMaze.placeEntities({ hasVirgilio: true, fragmentCount: 1 });
            }).not.toThrow();

            // Should still be valid even if small
            expect(tinyMaze.width).toBe(3);
            expect(tinyMaze.height).toBe(3);
        });

        test('should handle objective completion edge cases', () => {
            const maze = new Maze(5, 5, 1);
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });

            const objectiveManager = new ObjectiveManager(maze);

            // Test duplicate objective completion
            objectiveManager.findVirgilio();
            const secondVirgilio = objectiveManager.findVirgilio();
            expect(secondVirgilio).toBe(false); // Should not find again

            // Test duplicate fragment collection
            objectiveManager.collectFragment(0);
            const duplicateFragment = objectiveManager.collectFragment(0);
            expect(duplicateFragment).toBe(false); // Should not collect again
        });
    });
});