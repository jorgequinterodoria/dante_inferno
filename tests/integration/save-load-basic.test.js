/**
 * Basic Save/Load Integration Tests
 * Tests save/load functionality with realistic game states
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../js/data/saveManager.js';

// Mock localStorage
const createLocalStorageMock = () => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        })
    };
};

describe('Basic Save/Load Integration', () => {
    let saveManager;
    let localStorageMock;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        global.localStorage = localStorageMock;
        global.window = { localStorage: localStorageMock };

        saveManager = new SaveManager();

        // Mock Date.now for consistent testing
        vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorageMock.clear();
    });

    describe('Basic Save/Load Operations - Requirement 3.1', () => {
        test('should save and load game state successfully', () => {
            const gameState = {
                currentLevel: 2,
                playerPosition: { x: 5, y: 8 },
                collectedItems: ['fragment1', 'fragment2'],
                objectivesCompleted: {
                    virgilioFound: true,
                    fragmentsCollected: 2,
                    exitUnlocked: false
                },
                gameSettings: {
                    volume: 0.8,
                    difficulty: 'normal'
                },
                gameStats: {
                    playTime: 15000,
                    deathCount: 3,
                    dialoguesSeen: ['intro', 'virgilio_meet']
                },
                levelProgress: [
                    { level: 1, completed: true, startTime: 1000 }
                ]
            };

            // Save game state
            const saveResult = saveManager.saveGame(gameState);
            expect(saveResult).toBe(true);

            // Load game state
            const loadedState = saveManager.loadGame();
            expect(loadedState).toBeTruthy();
            expect(loadedState.currentLevel).toBe(2);
            expect(loadedState.playerPosition).toEqual({ x: 5, y: 8 });
            expect(loadedState.objectivesCompleted.virgilioFound).toBe(true);
            expect(loadedState.gameStats.playTime).toBe(15000);
        });

        test('should handle save data validation', () => {
            const invalidStates = [
                null,
                undefined,
                'invalid',
                { invalid: 'structure' },
                { currentLevel: 'invalid' }
            ];

            invalidStates.forEach(invalidState => {
                const result = saveManager.saveGame(invalidState);
                expect(result).toBe(false);
            });
        });

        test('should return null for missing save data', () => {
            const result = saveManager.loadGame();
            expect(result).toBeNull();
        });
    });

    describe('Game State Variations - Requirement 3.2', () => {
        test('should handle different objective states', () => {
            const objectiveStates = [
                { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                { virgilioFound: true, fragmentsCollected: 0, exitUnlocked: false },
                { virgilioFound: true, fragmentsCollected: 3, exitUnlocked: true }
            ];

            objectiveStates.forEach((objectives, index) => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: objectives,
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                    levelProgress: []
                };

                const saveResult = saveManager.saveGame(gameState);
                expect(saveResult).toBe(true);

                const loadedState = saveManager.loadGame();
                expect(loadedState.objectivesCompleted).toEqual(objectives);
            });
        });

        test('should persist statistics correctly', () => {
            const gameState = {
                currentLevel: 3,
                playerPosition: { x: 10, y: 15 },
                collectedItems: ['fragment1', 'fragment2', 'fragment3'],
                objectivesCompleted: {
                    virgilioFound: true,
                    fragmentsCollected: 3,
                    exitUnlocked: true
                },
                gameSettings: {
                    volume: 0.5,
                    difficulty: 'hard'
                },
                gameStats: {
                    playTime: 45000,
                    deathCount: 7,
                    dialoguesSeen: ['intro', 'virgilio_meet', 'level_2_complete']
                },
                levelProgress: [
                    { level: 1, completed: true, startTime: 1000, completionTime: 15000 },
                    { level: 2, completed: true, startTime: 15000, completionTime: 30000 }
                ]
            };

            saveManager.saveGame(gameState);
            const loadedState = saveManager.loadGame();

            expect(loadedState.gameStats.playTime).toBe(45000);
            expect(loadedState.gameStats.deathCount).toBe(7);
            expect(loadedState.gameStats.dialoguesSeen).toEqual(['intro', 'virgilio_meet', 'level_2_complete']);
            expect(loadedState.levelProgress).toHaveLength(2);
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage full');
            });

            const gameState = {
                currentLevel: 1,
                playerPosition: { x: 1, y: 1 },
                collectedItems: [],
                objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                levelProgress: []
            };

            const result = saveManager.saveGame(gameState);
            expect(result).toBe(false);
        });

        test('should handle corrupted save data', () => {
            // Set corrupted data directly
            localStorageMock.setItem('danteInfernoGameSave', 'corrupted json');
            
            const result = saveManager.loadGame();
            expect(result).toBeNull();
        });

        test('should clear save data completely', () => {
            const gameState = {
                currentLevel: 1,
                playerPosition: { x: 1, y: 1 },
                collectedItems: [],
                objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                levelProgress: []
            };

            // Save data first
            saveManager.saveGame(gameState);
            
            // Clear save data
            const clearResult = saveManager.clearSave();
            expect(clearResult).toBe(true);

            // Verify data is cleared
            const loadResult = saveManager.loadGame();
            expect(loadResult).toBeNull();
        });
    });

    describe('Save Information and Utilities', () => {
        test('should provide save information', () => {
            const gameState = {
                currentLevel: 2,
                playerPosition: { x: 5, y: 5 },
                collectedItems: [],
                objectivesCompleted: { virgilioFound: true, fragmentsCollected: 1, exitUnlocked: false },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 12000, deathCount: 2, dialoguesSeen: ['intro'] },
                levelProgress: []
            };

            saveManager.saveGame(gameState);
            
            const saveInfo = saveManager.getSaveInfo();
            expect(saveInfo).toBeTruthy();
            expect(saveInfo.level).toBe(2);
            expect(saveInfo.playTime).toBe(12000);
            expect(saveInfo.version).toBe('1.0.0');
        });

        test('should check if save exists', () => {
            expect(saveManager.hasSave()).toBe(false);

            const gameState = {
                currentLevel: 1,
                playerPosition: { x: 1, y: 1 },
                collectedItems: [],
                objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                levelProgress: []
            };

            saveManager.saveGame(gameState);
            expect(saveManager.hasSave()).toBe(true);
        });

        test('should test localStorage availability', () => {
            expect(saveManager.testLocalStorage()).toBe(true);

            // Mock localStorage failure
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            expect(saveManager.testLocalStorage()).toBe(false);
        });
    });

    describe('Backup and Recovery System', () => {
        test('should create backup before overwriting save', () => {
            const firstState = {
                currentLevel: 1,
                playerPosition: { x: 1, y: 1 },
                collectedItems: [],
                objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 5000, deathCount: 1, dialoguesSeen: [] },
                levelProgress: []
            };

            const secondState = {
                ...firstState,
                currentLevel: 2,
                gameStats: { playTime: 15000, deathCount: 2, dialoguesSeen: ['intro'] }
            };

            // Save first state
            saveManager.saveGame(firstState);
            
            // Save second state (should create backup)
            saveManager.saveGame(secondState);

            // Verify backup was created
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'danteInfernoGameSave_backup',
                expect.any(String)
            );
        });

        test('should recover from backup when main save is corrupted', () => {
            const originalState = {
                currentLevel: 3,
                playerPosition: { x: 10, y: 10 },
                collectedItems: ['fragment1'],
                objectivesCompleted: { virgilioFound: true, fragmentsCollected: 1, exitUnlocked: false },
                gameSettings: { volume: 0.5, difficulty: 'hard' },
                gameStats: { playTime: 25000, deathCount: 5, dialoguesSeen: ['intro'] },
                levelProgress: []
            };

            // Save original state
            saveManager.saveGame(originalState);

            // Manually corrupt main save but keep backup
            const store = localStorageMock._getStore ? localStorageMock._getStore() : {};
            if (store) {
                store['danteInfernoGameSave'] = 'corrupted data';
            } else {
                localStorageMock.getItem.mockImplementation((key) => {
                    if (key === 'danteInfernoGameSave') return 'corrupted data';
                    if (key === 'danteInfernoGameSave_backup') {
                        return JSON.stringify({
                            version: '1.0.0',
                            timestamp: 1000,
                            gameState: originalState
                        });
                    }
                    return null;
                });
            }

            // Should recover from backup
            const recoveredState = saveManager.loadGame();
            expect(recoveredState).toBeTruthy();
            expect(recoveredState.currentLevel).toBe(3);
        });
    });
});