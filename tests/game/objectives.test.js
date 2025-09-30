/**
 * Unit tests for ObjectiveManager
 * Tests objective completion logic according to requirements 2.1, 2.2, 2.4, 2.5
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ObjectiveManager } from '../../js/game/objectives.js';
import { Maze } from '../../js/game/maze.js';

describe('ObjectiveManager', () => {
    let objectiveManager;
    let mockMaze;

    beforeEach(() => {
        // Create a mock maze with entities
        mockMaze = new Maze(10, 10);
        mockMaze.generate();
        mockMaze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
        
        objectiveManager = new ObjectiveManager(mockMaze);
    });

    describe('Initialization', () => {
        test('should initialize with default values', () => {
            const manager = new ObjectiveManager();
            
            expect(manager.virgilioFound).toBe(false);
            expect(manager.fragmentsCollected).toBe(0);
            expect(manager.totalFragments).toBe(3);
            expect(manager.exitUnlocked).toBe(false);
            expect(manager.collectedFragmentIds.size).toBe(0);
        });

        test('should update total fragments when maze is set', () => {
            const manager = new ObjectiveManager();
            const maze = new Maze(10, 10);
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 5 });
            
            manager.setMaze(maze);
            
            expect(manager.totalFragments).toBe(5);
        });
    });

    describe('Virgilio Encounter - Requirement 2.1', () => {
        test('should mark Virgilio as found when findVirgilio is called', () => {
            expect(objectiveManager.virgilioFound).toBe(false);
            
            const result = objectiveManager.findVirgilio();
            
            expect(result).toBe(true);
            expect(objectiveManager.virgilioFound).toBe(true);
        });

        test('should not mark Virgilio as found twice', () => {
            objectiveManager.findVirgilio();
            
            const result = objectiveManager.findVirgilio();
            
            expect(result).toBe(false);
            expect(objectiveManager.virgilioFound).toBe(true);
        });

        test('should trigger callback when Virgilio is found', () => {
            const callback = vi.fn();
            objectiveManager.setCallbacks({ onVirgiliofound: callback });
            
            objectiveManager.findVirgilio();
            
            expect(callback).toHaveBeenCalledOnce();
        });

        test('should detect Virgilio at player position', () => {
            const virgilioEntity = mockMaze.getEntitiesByType('virgilio')[0];
            const playerPosition = { x: virgilioEntity.x, y: virgilioEntity.y };
            
            const result = objectiveManager.checkObjectives(playerPosition);
            
            expect(result.collected).toHaveLength(1);
            expect(result.collected[0].type).toBe('virgilio');
            expect(result.statusChanged).toBe(true);
            expect(objectiveManager.virgilioFound).toBe(true);
        });
    });

    describe('Fragment Collection - Requirement 2.2', () => {
        test('should collect fragments and increment counter', () => {
            expect(objectiveManager.fragmentsCollected).toBe(0);
            
            const result1 = objectiveManager.collectFragment(0);
            expect(result1).toBe(true);
            expect(objectiveManager.fragmentsCollected).toBe(1);
            
            const result2 = objectiveManager.collectFragment(1);
            expect(result2).toBe(true);
            expect(objectiveManager.fragmentsCollected).toBe(2);
        });

        test('should not collect the same fragment twice', () => {
            objectiveManager.collectFragment(0);
            
            const result = objectiveManager.collectFragment(0);
            
            expect(result).toBe(false);
            expect(objectiveManager.fragmentsCollected).toBe(1);
        });

        test('should trigger callback when fragment is collected', () => {
            const callback = vi.fn();
            objectiveManager.setCallbacks({ onFragmentCollected: callback });
            
            objectiveManager.collectFragment(0);
            
            expect(callback).toHaveBeenCalledWith(1, 3);
        });

        test('should detect fragment at player position', () => {
            const fragmentEntity = mockMaze.getEntitiesByType('fragment')[0];
            const playerPosition = { x: fragmentEntity.x, y: fragmentEntity.y };
            
            const result = objectiveManager.checkObjectives(playerPosition);
            
            expect(result.collected).toHaveLength(1);
            expect(result.collected[0].type).toBe('fragment');
            expect(result.statusChanged).toBe(true);
            expect(objectiveManager.fragmentsCollected).toBe(1);
        });

        test('should track fragment collection progress', () => {
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            
            const progress = objectiveManager.getFragmentProgress();
            
            expect(progress.collected).toBe(2);
            expect(progress.total).toBe(3);
            expect(progress.remaining).toBe(1);
            expect(progress.percentage).toBe(2/3 * 100);
        });
    });

    describe('Exit Unlock Logic - Requirements 2.4, 2.5', () => {
        test('should not unlock exit when objectives are incomplete', () => {
            expect(objectiveManager.isExitUnlocked()).toBe(false);
            expect(objectiveManager.areAllObjectivesCompleted()).toBe(false);
        });

        test('should not unlock exit when only Virgilio is found', () => {
            objectiveManager.findVirgilio();
            
            expect(objectiveManager.isExitUnlocked()).toBe(false);
            expect(objectiveManager.areAllObjectivesCompleted()).toBe(false);
        });

        test('should not unlock exit when only fragments are collected', () => {
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            
            expect(objectiveManager.isExitUnlocked()).toBe(false);
            expect(objectiveManager.areAllObjectivesCompleted()).toBe(false);
        });

        test('should unlock exit when all objectives are completed', () => {
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            
            expect(objectiveManager.isExitUnlocked()).toBe(true);
            expect(objectiveManager.areAllObjectivesCompleted()).toBe(true);
        });

        test('should trigger callback when exit is unlocked', () => {
            const callback = vi.fn();
            objectiveManager.setCallbacks({ onExitUnlocked: callback });
            
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            
            expect(callback).toHaveBeenCalledOnce();
        });

        test('should allow level exit when at exit position and objectives completed', () => {
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            
            const exitPosition = mockMaze.getExitPosition();
            const canExit = objectiveManager.canExitLevel(exitPosition);
            
            expect(canExit).toBe(true);
        });

        test('should not allow level exit when objectives incomplete', () => {
            const exitPosition = mockMaze.getExitPosition();
            const canExit = objectiveManager.canExitLevel(exitPosition);
            
            expect(canExit).toBe(false);
        });

        test('should not allow level exit when not at exit position', () => {
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            objectiveManager.collectFragment(2);
            
            const wrongPosition = { x: 0, y: 0 };
            const canExit = objectiveManager.canExitLevel(wrongPosition);
            
            expect(canExit).toBe(false);
        });
    });

    describe('Objective Status and Progress', () => {
        test('should return correct objective status', () => {
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            
            const status = objectiveManager.getObjectiveStatus();
            
            expect(status.virgilioFound).toBe(true);
            expect(status.fragmentsCollected).toBe(1);
            expect(status.totalFragments).toBe(3);
            expect(status.exitUnlocked).toBe(false);
            expect(status.allCompleted).toBe(false);
        });

        test('should handle multiple objective checks without duplicates', () => {
            const fragmentEntity = mockMaze.getEntitiesByType('fragment')[0];
            const playerPosition = { x: fragmentEntity.x, y: fragmentEntity.y };
            
            // First check should collect the fragment
            const result1 = objectiveManager.checkObjectives(playerPosition);
            expect(result1.collected).toHaveLength(1);
            expect(result1.statusChanged).toBe(true);
            
            // Second check at same position should not collect again
            const result2 = objectiveManager.checkObjectives(playerPosition);
            expect(result2.collected).toHaveLength(0);
            expect(result2.statusChanged).toBe(false);
            
            expect(objectiveManager.fragmentsCollected).toBe(1);
        });
    });

    describe('Reset and State Management', () => {
        test('should reset objectives for new level', () => {
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(1);
            
            objectiveManager.reset(5);
            
            expect(objectiveManager.virgilioFound).toBe(false);
            expect(objectiveManager.fragmentsCollected).toBe(0);
            expect(objectiveManager.totalFragments).toBe(5);
            expect(objectiveManager.exitUnlocked).toBe(false);
            expect(objectiveManager.collectedFragmentIds.size).toBe(0);
        });

        test('should serialize and load state correctly', () => {
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(2);
            
            const state = objectiveManager.getSerializableState();
            const newManager = new ObjectiveManager();
            newManager.loadState(state);
            
            expect(newManager.virgilioFound).toBe(true);
            expect(newManager.fragmentsCollected).toBe(2);
            expect(newManager.totalFragments).toBe(3);
            expect(newManager.collectedFragmentIds.has(0)).toBe(true);
            expect(newManager.collectedFragmentIds.has(2)).toBe(true);
            expect(newManager.collectedFragmentIds.has(1)).toBe(false);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle checkObjectives without maze', () => {
            const manager = new ObjectiveManager();
            const result = manager.checkObjectives({ x: 5, y: 5 });
            
            expect(result.collected).toHaveLength(0);
            expect(result.statusChanged).toBe(false);
        });

        test('should handle canExitLevel without maze', () => {
            const manager = new ObjectiveManager();
            const canExit = manager.canExitLevel({ x: 5, y: 5 });
            
            expect(canExit).toBe(false);
        });

        test('should handle empty maze entities', () => {
            const emptyMaze = new Maze(5, 5);
            emptyMaze.generate();
            // Don't place entities
            
            const manager = new ObjectiveManager(emptyMaze);
            const result = manager.checkObjectives({ x: 2, y: 2 });
            
            expect(result.collected).toHaveLength(0);
            expect(result.statusChanged).toBe(false);
        });

        test('should handle fragment progress with zero total fragments', () => {
            const manager = new ObjectiveManager();
            manager.totalFragments = 0;
            
            const progress = manager.getFragmentProgress();
            
            expect(progress.collected).toBe(0);
            expect(progress.total).toBe(0);
            expect(progress.remaining).toBe(0);
            expect(progress.percentage).toBe(0);
        });
    });
});