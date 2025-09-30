/**
 * Comprehensive Save/Load Functionality Tests
 * Tests save/load with various game states according to requirements 3.1-3.4
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../js/data/saveManager.js';
import { LevelManager } from '../../js/game/levelManager.js';
import { ObjectiveManager } from '../../js/game/objectives.js';
import { Player } from '../../js/game/player.js';
import { Maze } from '../../js/game/maze.js';

// Mock localStorage with enhanced functionality
const createLocalStorageMock = () => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            if (typeof value !== 'string') {
                throw new Error('localStorage only accepts strings');
            }
            store[key] = value;
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => Object.keys(store)[index] || null),
        // Helper to get internal store for testing
        _getStore: () => store,
        _setStore: (newStore) => { store = newStore; }
    };
};

describe('Comprehensive Save/Load Functionality', () => {
    let saveManager;
    let levelManager;
    let localStorageMock;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        global.localStorage = localStorageMock;
        global.window = { localStorage: localStorageMock };

        saveManager = new SaveManager();
        levelManager = new LevelManager();

        // Mock Date.now for consistent timestamps
        vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        localStorageMock.clear();
    });

    describe('Basic Save/Load Operations - Requirement 3.1', () => {
        test('should save and load minimal game state', () => {
            const minimalState = {
                currentLevel: 1,
                playerPosition: { x: 1, y: 1 },
                collectedItems: [],
                objectivesCompleted: {
                    virgilioFound: false,
                    fragmentsCollected: 0,
                    exitUnlocked: false
                },
                gameSettings: {
                    volume: 0.7,
                    difficulty: 'normal'
                },
                gameStats: {
                    playTime: 0,
                    deathCount: 0,
                    dialoguesSeen: []
                },
                levelProgress: []
            };

            const saveResult = saveManager.saveGame(minimalState);
            expect(saveResult).toBe(true);

            const loadedState = saveManager.loadGame();
            expect(loadedState).toEqual(expect.objectContaining({
                currentLevel: 1,
                playerPosition: { x: 1, y: 1 },
                collectedItems: [],
                objectivesCompleted: expect.objectContaining({
                    virgilioFound: false,
                    fragmentsCollected: 0,
                    exitUnlocked: false
                })
            }));
        });

        test('should save and load complex game state', () => {
            const complexState = {
                currentLevel: 5,
                playerPosition: { x: 15, y: 23 },
                collectedItems: ['fragment1', 'fragment2', 'fragment3', 'special_item'],
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
                    playTime: 125000,
                    deathCount: 15,
                    dialoguesSeen: ['intro', 'virgilio_meet', 'level_2_intro', 'level_3_complete']
                },
                levelProgress: [
                    { level: 1, completed: true, startTime: 1000, completionTime: 15000 },
                    { level: 2, completed: true, startTime: 15000, completionTime: 35000 },
                    { level: 3, completed: true, startTime: 35000, completionTime: 65000 },
                    { level: 4, completed: true, startTime: 65000, completionTime: 95000 },
                    { level: 5, completed: false, startTime: 95000 }
                ]
            };

            const saveResult = saveManager.saveGame(complexState);
            expect(saveResult).toBe(true);

            const loadedState = saveManager.loadGame();
            expect(loadedState).toEqual(expect.objectContaining({
                currentLevel: 5,
                playerPosition: { x: 15, y: 23 },
                collectedItems: ['fragment1', 'fragment2', 'fragment3', 'special_item'],
                gameStats: expect.objectContaining({
                    playTime: 125000,
                    deathCount: 15,
                    dialoguesSeen: expect.arrayContaining(['intro', 'virgilio_meet'])
                })
            }));
        });
    });

    describe('Game State Variations - Requirement 3.2', () => {
        test('should handle save/load at different level progression points', () => {
            const levelStates = [
                // Level 1 - just started
                {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false }
                },
                // Level 1 - Virgilio found
                {
                    currentLevel: 1,
                    playerPosition: { x: 5, y: 8 },
                    objectivesCompleted: { virgilioFound: true, fragmentsCollected: 0, exitUnlocked: false }
                },
                // Level 1 - some fragments collected
                {
                    currentLevel: 1,
                    playerPosition: { x: 10, y: 12 },
                    objectivesComplected: { virgilioFound: true, fragmentsCollected: 2, exitUnlocked: false }
                },
                // Level 1 - completed
                {
                    currentLevel: 1,
                    playerPosition: { x: 14, y: 14 },
                    objectivesCompleted: { virgilioFound: true, fragmentsCollected: 3, exitUnlocked: true }
                }
            ];

            levelStates.forEach((state, index) => {
                const fullState = {
                    ...state,
                    collectedItems: [],
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime: index * 10000, deathCount: index, dialoguesSeen: [] },
                    levelProgress: []
                };

                const saveResult = saveManager.saveGame(fullState);
                expect(saveResult).toBe(true);

                const loadedState = saveManager.loadGame();
                expect(loadedState.currentLevel).toBe(state.currentLevel);
                expect(loadedState.playerPosition).toEqual(state.playerPosition);
                expect(loadedState.gameStats.playTime).toBe(index * 10000);
            });
        });

        test('should handle save/load with different objective combinations', () => {
            const objectiveStates = [
                { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                { virgilioFound: true, fragmentsCollected: 0, exitUnlocked: false },
                { virgilioFound: false, fragmentsCollected: 1, exitUnlocked: false },
                { virgilioFound: false, fragmentsCollected: 3, exitUnlocked: false },
                { virgilioFound: true, fragmentsCollected: 1, exitUnlocked: false },
                { virgilioFound: true, fragmentsCollected: 2, exitUnlocked: false },
                { virgilioFound: true, fragmentsCollected: 3, exitUnlocked: true }
            ];

            objectiveStates.forEach((objectives, index) => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: index + 1, y: index + 1 },
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

        test('should handle save/load with various collected items', () => {
            const itemCollections = [
                [],
                ['fragment1'],
                ['fragment1', 'fragment2'],
                ['fragment1', 'fragment2', 'fragment3'],
                ['fragment1', 'fragment2', 'fragment3', 'special_key'],
                ['fragment1', 'fragment2', 'fragment3', 'special_key', 'bonus_item']
            ];

            itemCollections.forEach((items, index) => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: items,
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                    levelProgress: []
                };

                const saveResult = saveManager.saveGame(gameState);
                expect(saveResult).toBe(true);

                const loadedState = saveManager.loadGame();
                expect(loadedState.collectedItems).toEqual(items);
            });
        });
    });

    describe('Statistics Persistence - Requirement 3.3', () => {
        test('should persist play time accurately', () => {
            const playTimes = [0, 1000, 30000, 300000, 3600000]; // 0s, 1s, 30s, 5min, 1hour

            playTimes.forEach(playTime => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime, deathCount: 0, dialoguesSeen: [] },
                    levelProgress: []
                };

                saveManager.saveGame(gameState);
                const loadedState = saveManager.loadGame();
                expect(loadedState.gameStats.playTime).toBe(playTime);
            });
        });

        test('should persist death count correctly', () => {
            const deathCounts = [0, 1, 5, 25, 100];

            deathCounts.forEach(deathCount => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime: 0, deathCount, dialoguesSeen: [] },
                    levelProgress: []
                };

                saveManager.saveGame(gameState);
                const loadedState = saveManager.loadGame();
                expect(loadedState.gameStats.deathCount).toBe(deathCount);
            });
        });

        test('should persist dialogue tracking', () => {
            const dialogueSets = [
                [],
                ['intro'],
                ['intro', 'virgilio_meet'],
                ['intro', 'virgilio_meet', 'level_2_start', 'level_2_complete'],
                ['intro', 'virgilio_meet', 'level_2_start', 'level_2_complete', 'special_event', 'ending']
            ];

            dialogueSets.forEach(dialogues => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: dialogues },
                    levelProgress: []
                };

                saveManager.saveGame(gameState);
                const loadedState = saveManager.loadGame();
                expect(loadedState.gameStats.dialoguesSeen).toEqual(dialogues);
            });
        });

        test('should persist level progress history', () => {
            const progressHistories = [
                [],
                [{ level: 1, completed: false, startTime: 1000 }],
                [
                    { level: 1, completed: true, startTime: 1000, completionTime: 15000 },
                    { level: 2, completed: false, startTime: 15000 }
                ],
                [
                    { level: 1, completed: true, startTime: 1000, completionTime: 15000 },
                    { level: 2, completed: true, startTime: 15000, completionTime: 35000 },
                    { level: 3, completed: true, startTime: 35000, completionTime: 65000 },
                    { level: 4, completed: false, startTime: 65000 }
                ]
            ];

            progressHistories.forEach(progress => {
                const gameState = {
                    currentLevel: progress.length > 0 ? progress[progress.length - 1].level : 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume: 0.7, difficulty: 'normal' },
                    gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                    levelProgress: progress
                };

                saveManager.saveGame(gameState);
                const loadedState = saveManager.loadGame();
                expect(loadedState.levelProgress).toEqual(progress);
            });
        });
    });

    describe('Settings Persistence - Requirement 3.4', () => {
        test('should persist volume settings', () => {
            const volumeLevels = [0, 0.25, 0.5, 0.75, 1.0];

            volumeLevels.forEach(volume => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume, difficulty: 'normal' },
                    gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                    levelProgress: []
                };

                saveManager.saveGame(gameState);
                const loadedState = saveManager.loadGame();
                expect(loadedState.gameSettings.volume).toBe(volume);
            });
        });

        test('should persist difficulty settings', () => {
            const difficulties = ['easy', 'normal', 'hard'];

            difficulties.forEach(difficulty => {
                const gameState = {
                    currentLevel: 1,
                    playerPosition: { x: 1, y: 1 },
                    collectedItems: [],
                    objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                    gameSettings: { volume: 0.7, difficulty },
                    gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                    levelProgress: []
                };

                saveManager.saveGame(gameState);
                const loadedState = saveManager.loadGame();
                expect(loadedState.gameSettings.difficulty).toBe(difficulty);
            });
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle localStorage quota exceeded', () => {
            // Mock localStorage to throw quota exceeded error
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('QuotaExceededError');
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

        test('should recover from corrupted save data', () => {
            // Set corrupted data
            localStorageMock._getStore()['danteInfernoGameSave'] = 'corrupted json data';

            const result = saveManager.loadGame();
            expect(result).toBeNull();
        });

        test('should handle missing save data gracefully', () => {
            const result = saveManager.loadGame();
            expect(result).toBeNull();
        });

        test('should validate save data structure', () => {
            const invalidStates = [
                null,
                undefined,
                'string',
                123,
                [],
                { invalid: 'structure' },
                { currentLevel: 'invalid' },
                { currentLevel: 1, playerPosition: null }
            ];

            invalidStates.forEach(invalidState => {
                const result = saveManager.saveGame(invalidState);
                expect(result).toBe(false);
            });
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
                gameStats: { playTime: 5000, deathCount: 1, dialoguesSeen: ['intro'] },
                levelProgress: []
            };

            const secondState = {
                ...firstState,
                currentLevel: 2,
                gameStats: { playTime: 15000, deathCount: 2, dialoguesSeen: ['intro', 'level_2'] }
            };

            // Save first state
            saveManager.saveGame(firstState);
            
            // Save second state (should create backup of first)
            saveManager.saveGame(secondState);

            // Verify backup exists
            const backupData = localStorageMock.getItem('danteInfernoGameSave_backup');
            expect(backupData).toBeTruthy();

            const parsedBackup = JSON.parse(backupData);
            expect(parsedBackup.gameState.currentLevel).toBe(1);
            expect(parsedBackup.gameState.gameStats.playTime).toBe(5000);
        });

        test('should recover from backup when main save is corrupted', () => {
            const originalState = {
                currentLevel: 3,
                playerPosition: { x: 10, y: 10 },
                collectedItems: ['fragment1'],
                objectivesCompleted: { virgilioFound: true, fragmentsCollected: 1, exitUnlocked: false },
                gameSettings: { volume: 0.5, difficulty: 'hard' },
                gameStats: { playTime: 25000, deathCount: 5, dialoguesSeen: ['intro', 'virgilio'] },
                levelProgress: []
            };

            // Save original state
            saveManager.saveGame(originalState);

            // Corrupt main save but keep backup
            localStorageMock._getStore()['danteInfernoGameSave'] = 'corrupted data';

            // Should recover from backup
            const recoveredState = saveManager.loadGame();
            expect(recoveredState).toBeTruthy();
            expect(recoveredState.currentLevel).toBe(3);
            expect(recoveredState.gameStats.playTime).toBe(25000);
        });
    });

    describe('Integration with Game Components', () => {
        test('should save and restore complete game session', () => {
            // Create a complete game session
            const gameState = levelManager.startNewGame();
            
            // Simulate game progress
            gameState.currentLevel = 2;
            gameState.playerPosition = { x: 8, y: 12 };
            gameState.collectedItems = ['fragment1', 'fragment2'];
            gameState.objectivesCompleted = {
                virgilioFound: true,
                fragmentsCollected: 2,
                exitUnlocked: false
            };
            gameState.gameStats.playTime = 45000;
            gameState.gameStats.deathCount = 3;
            gameState.gameStats.dialoguesSeen = ['intro', 'virgilio_meet', 'level_2_start'];
            gameState.levelProgress = [
                { level: 1, completed: true, startTime: 1000, completionTime: 25000 },
                { level: 2, completed: false, startTime: 25000 }
            ];

            // Save the session
            const saveResult = saveManager.saveGame(gameState);
            expect(saveResult).toBe(true);

            // Load and verify complete restoration
            const restoredState = saveManager.loadGame();
            expect(restoredState).toBeTruthy();
            
            // Verify all components can be restored
            expect(restoredState.currentLevel).toBe(2);
            expect(restoredState.playerPosition).toEqual({ x: 8, y: 12 });
            expect(restoredState.collectedItems).toEqual(['fragment1', 'fragment2']);
            expect(restoredState.objectivesCompleted.virgilioFound).toBe(true);
            expect(restoredState.objectivesCompleted.fragmentsCollected).toBe(2);
            expect(restoredState.gameStats.playTime).toBe(45000);
            expect(restoredState.gameStats.deathCount).toBe(3);
            expect(restoredState.levelProgress).toHaveLength(2);
        });

        test('should handle save/load with ObjectiveManager state', () => {
            // Create maze and objective manager
            const maze = new Maze(10, 10, 1);
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });

            const objectiveManager = new ObjectiveManager(maze);
            
            // Progress objectives
            objectiveManager.findVirgilio();
            objectiveManager.collectFragment(0);
            objectiveManager.collectFragment(2);

            // Create game state with objective data
            const gameState = {
                currentLevel: 1,
                playerPosition: { x: 5, y: 5 },
                collectedItems: ['fragment_0', 'fragment_2'],
                objectivesCompleted: {
                    virgilioFound: objectiveManager.virgilioFound,
                    fragmentsCollected: objectiveManager.fragmentsCollected,
                    exitUnlocked: objectiveManager.isExitUnlocked()
                },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                levelProgress: []
            };

            // Save and load
            saveManager.saveGame(gameState);
            const loadedState = saveManager.loadGame();

            // Verify objective state can be restored
            const newObjectiveManager = new ObjectiveManager(maze);
            newObjectiveManager.loadState({
                virgilioFound: loadedState.objectivesCompleted.virgilioFound,
                fragmentsCollected: loadedState.objectivesCompleted.fragmentsCollected,
                totalFragments: 3,
                collectedFragmentIds: [0, 2]
            });

            expect(newObjectiveManager.virgilioFound).toBe(true);
            expect(newObjectiveManager.fragmentsCollected).toBe(2);
            expect(newObjectiveManager.isExitUnlocked()).toBe(false);
        });

        test('should handle save/load with Player state', () => {
            const player = new Player(5, 8);
            
            // Create game state with player data
            const gameState = {
                currentLevel: 1,
                playerPosition: { x: player.x, y: player.y },
                collectedItems: [],
                objectivesCompleted: { virgilioFound: false, fragmentsCollected: 0, exitUnlocked: false },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: { playTime: 0, deathCount: 0, dialoguesSeen: [] },
                levelProgress: []
            };

            // Save and load
            saveManager.saveGame(gameState);
            const loadedState = saveManager.loadGame();

            // Verify player can be restored
            const restoredPlayer = new Player(
                loadedState.playerPosition.x,
                loadedState.playerPosition.y
            );

            expect(restoredPlayer.x).toBe(5);
            expect(restoredPlayer.y).toBe(8);
        });
    });

    describe('Performance and Storage Limits', () => {
        test('should handle large save data efficiently', () => {
            // Create large game state
            const largeDialogueList = Array.from({ length: 1000 }, (_, i) => `dialogue_${i}`);
            const largeLevelProgress = Array.from({ length: 100 }, (_, i) => ({
                level: i + 1,
                completed: i < 50,
                startTime: i * 10000,
                completionTime: i < 50 ? (i + 1) * 10000 : undefined
            }));

            const largeGameState = {
                currentLevel: 50,
                playerPosition: { x: 25, y: 30 },
                collectedItems: Array.from({ length: 200 }, (_, i) => `item_${i}`),
                objectivesCompleted: { virgilioFound: true, fragmentsCollected: 3, exitUnlocked: true },
                gameSettings: { volume: 0.7, difficulty: 'normal' },
                gameStats: {
                    playTime: 3600000, // 1 hour
                    deathCount: 100,
                    dialoguesSeen: largeDialogueList
                },
                levelProgress: largeLevelProgress
            };

            const startTime = Date.now();
            const saveResult = saveManager.saveGame(largeGameState);
            const saveTime = Date.now() - startTime;

            expect(saveResult).toBe(true);
            expect(saveTime).toBeLessThan(1000); // Should complete within 1 second

            const loadStartTime = Date.now();
            const loadedState = saveManager.loadGame();
            const loadTime = Date.now() - loadStartTime;

            expect(loadedState).toBeTruthy();
            expect(loadTime).toBeLessThan(1000); // Should complete within 1 second
            expect(loadedState.gameStats.dialoguesSeen).toHaveLength(1000);
            expect(loadedState.levelProgress).toHaveLength(100);
        });

        test('should provide storage usage information', () => {
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
            const storageInfo = saveManager.getStorageInfo();

            expect(storageInfo).toBeTruthy();
            expect(storageInfo.totalSize).toBeGreaterThan(0);
            expect(storageInfo.saveSize).toBeGreaterThan(0);
            expect(storageInfo.usagePercent).toBeDefined();
        });
    });
});