/**
 * SaveManager Unit Tests
 * Tests for game state persistence functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../../js/data/saveManager.js';

// Mock localStorage
const localStorageMock = (() => {
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
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => Object.keys(store)[index] || null)
    };
})();

// Mock console methods to avoid test output noise
const consoleMock = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
};

describe('SaveManager', () => {
    let saveManager;
    let mockGameState;

    beforeEach(() => {
        // Reset localStorage mock
        localStorageMock.clear();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();

        // Mock global localStorage
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        // Mock console methods
        vi.spyOn(console, 'log').mockImplementation(consoleMock.log);
        vi.spyOn(console, 'warn').mockImplementation(consoleMock.warn);
        vi.spyOn(console, 'error').mockImplementation(consoleMock.error);

        // Create SaveManager instance
        saveManager = new SaveManager();

        // Create mock game state
        mockGameState = {
            currentLevel: 1,
            playerPosition: { x: 5, y: 3 },
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
                playTime: 12000,
                deathCount: 3,
                dialoguesSeen: ['intro', 'virgilio_meet']
            },
            levelProgress: [
                { level: 1, completed: false, startTime: Date.now() }
            ],
            currentMaze: null
        };
    });

    afterEach(() => {
        // Restore console methods
        vi.restoreAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(saveManager.saveKey).toBe('danteInfernoGameSave');
            expect(saveManager.settingsKey).toBe('danteInfernoSettings');
            expect(saveManager.backupKey).toBe('danteInfernoGameSave_backup');
            expect(saveManager.saveVersion).toBe('1.0.0');
            expect(saveManager.maxSaveSize).toBe(1024 * 1024);
        });
    });

    describe('saveGame', () => {
        it('should save valid game state successfully', () => {
            const result = saveManager.saveGame(mockGameState);

            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'danteInfernoGameSave',
                expect.any(String)
            );
            expect(consoleMock.log).toHaveBeenCalledWith('Game saved successfully');
        });

        it('should reject invalid game state', () => {
            const invalidState = { invalid: 'state' };
            const result = saveManager.saveGame(invalidState);

            expect(result).toBe(false);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
            expect(consoleMock.error).toHaveBeenCalledWith('Invalid game state provided to saveGame');
        });

        it('should reject null or undefined game state', () => {
            expect(saveManager.saveGame(null)).toBe(false);
            expect(saveManager.saveGame(undefined)).toBe(false);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('should create backup before saving', () => {
            // Set up existing save
            const existingSave = JSON.stringify({ version: '1.0.0', timestamp: Date.now(), gameState: mockGameState });
            localStorageMock.setItem('danteInfernoGameSave', existingSave);
            localStorageMock.setItem.mockClear();

            saveManager.saveGame(mockGameState);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'danteInfernoGameSave_backup',
                existingSave
            );
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage full');
            });

            const result = saveManager.saveGame(mockGameState);

            expect(result).toBe(false);
            expect(consoleMock.error).toHaveBeenCalledWith('Failed to save game:', expect.any(Error));
        });

        it('should reject oversized save data', () => {
            // Create oversized game state by making dialoguesSeen very large
            const oversizedState = {
                ...mockGameState,
                gameStats: {
                    ...mockGameState.gameStats,
                    dialoguesSeen: new Array(100000).fill('x'.repeat(100)) // Large array of strings
                }
            };

            const result = saveManager.saveGame(oversizedState);

            expect(result).toBe(false);
            expect(consoleMock.error).toHaveBeenCalledWith('Save data exceeds maximum size limit');
        });
    });

    describe('loadGame', () => {
        it('should load valid saved game successfully', () => {
            // Set up valid save data
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                gameState: mockGameState
            };
            localStorageMock.setItem('danteInfernoGameSave', JSON.stringify(saveData));

            const result = saveManager.loadGame();

            expect(result).toEqual(mockGameState);
            expect(consoleMock.log).toHaveBeenCalledWith('Game loaded successfully');
        });

        it('should return null when no save exists', () => {
            const result = saveManager.loadGame();

            expect(result).toBeNull();
            expect(consoleMock.log).toHaveBeenCalledWith('No save data found');
        });

        it('should handle corrupted JSON gracefully', () => {
            localStorageMock.setItem('danteInfernoGameSave', 'invalid json');

            const result = saveManager.loadGame();

            expect(result).toBeNull();
            expect(consoleMock.error).toHaveBeenCalledWith('Failed to load game:', expect.any(Error));
        });

        it('should validate save data structure', () => {
            const invalidSaveData = { invalid: 'structure' };
            localStorageMock.setItem('danteInfernoGameSave', JSON.stringify(invalidSaveData));

            const result = saveManager.loadGame();

            expect(result).toBeNull();
            expect(consoleMock.warn).toHaveBeenCalledWith('Invalid save data structure, attempting backup recovery');
        });

        it('should handle version incompatibility', () => {
            const incompatibleSave = {
                version: '2.0.0',
                timestamp: Date.now(),
                gameState: mockGameState
            };
            localStorageMock.setItem('danteInfernoGameSave', JSON.stringify(incompatibleSave));

            const result = saveManager.loadGame();

            expect(result).toBeNull();
            expect(consoleMock.warn).toHaveBeenCalledWith('Save version incompatible, attempting migration');
        });

        it('should attempt backup recovery on corruption', () => {
            // Set up corrupted main save and valid backup
            localStorageMock.setItem('danteInfernoGameSave', 'corrupted');
            
            const backupSave = {
                version: '1.0.0',
                timestamp: Date.now(),
                gameState: mockGameState
            };
            localStorageMock.setItem('danteInfernoGameSave_backup', JSON.stringify(backupSave));

            const result = saveManager.loadGame();

            expect(result).toEqual(mockGameState);
            expect(consoleMock.log).toHaveBeenCalledWith('Loaded from backup save');
        });
    });

    describe('clearSave', () => {
        it('should clear all save data successfully', () => {
            // Set up some save data
            localStorageMock.setItem('danteInfernoGameSave', 'save data');
            localStorageMock.setItem('danteInfernoGameSave_backup', 'backup data');
            localStorageMock.setItem('danteInfernoSettings', 'settings data');

            const result = saveManager.clearSave();

            expect(result).toBe(true);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('danteInfernoGameSave');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('danteInfernoGameSave_backup');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('danteInfernoSettings');
            expect(consoleMock.log).toHaveBeenCalledWith('Save data cleared successfully');
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.removeItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            const result = saveManager.clearSave();

            expect(result).toBe(false);
            expect(consoleMock.error).toHaveBeenCalledWith('Failed to clear save data:', expect.any(Error));
        });
    });

    describe('hasSave', () => {
        it('should return true for valid save', () => {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                gameState: mockGameState
            };
            localStorageMock.setItem('danteInfernoGameSave', JSON.stringify(saveData));

            expect(saveManager.hasSave()).toBe(true);
        });

        it('should return false when no save exists', () => {
            expect(saveManager.hasSave()).toBe(false);
        });

        it('should return false for corrupted save', () => {
            localStorageMock.setItem('danteInfernoGameSave', 'corrupted data');

            expect(saveManager.hasSave()).toBe(false);
            expect(consoleMock.warn).toHaveBeenCalledWith('Save data appears corrupted:', expect.any(Error));
        });
    });

    describe('getSaveInfo', () => {
        it('should return save metadata', () => {
            const timestamp = Date.now();
            const saveData = {
                version: '1.0.0',
                timestamp,
                gameState: mockGameState
            };
            localStorageMock.setItem('danteInfernoGameSave', JSON.stringify(saveData));

            const info = saveManager.getSaveInfo();

            expect(info).toEqual({
                version: '1.0.0',
                timestamp,
                date: new Date(timestamp).toLocaleString('es-ES'),
                level: 1,
                playTime: 12000
            });
        });

        it('should return null when no save exists', () => {
            expect(saveManager.getSaveInfo()).toBeNull();
        });

        it('should handle corrupted save gracefully', () => {
            localStorageMock.setItem('danteInfernoGameSave', 'corrupted');

            expect(saveManager.getSaveInfo()).toBeNull();
            expect(consoleMock.error).toHaveBeenCalledWith('Failed to get save info:', expect.any(Error));
        });
    });

    describe('validateGameState', () => {
        it('should validate correct game state', () => {
            expect(saveManager.validateGameState(mockGameState)).toBe(true);
        });

        it('should reject null or undefined', () => {
            expect(saveManager.validateGameState(null)).toBe(false);
            expect(saveManager.validateGameState(undefined)).toBe(false);
        });

        it('should reject non-object values', () => {
            expect(saveManager.validateGameState('string')).toBe(false);
            expect(saveManager.validateGameState(123)).toBe(false);
            expect(saveManager.validateGameState([])).toBe(false);
        });

        it('should reject missing required properties', () => {
            const incompleteState = { currentLevel: 1 };
            expect(saveManager.validateGameState(incompleteState)).toBe(false);
        });

        it('should reject invalid currentLevel', () => {
            const invalidState = { ...mockGameState, currentLevel: 0 };
            expect(saveManager.validateGameState(invalidState)).toBe(false);
        });

        it('should reject invalid playerPosition', () => {
            const invalidState = { ...mockGameState, playerPosition: null };
            expect(saveManager.validateGameState(invalidState)).toBe(false);
        });

        it('should reject invalid objectivesCompleted', () => {
            const invalidState = { ...mockGameState, objectivesCompleted: null };
            expect(saveManager.validateGameState(invalidState)).toBe(false);
        });
    });

    describe('serializeGameState', () => {
        it('should create clean serializable copy', () => {
            const serialized = saveManager.serializeGameState(mockGameState);

            expect(serialized).toEqual({
                currentLevel: 1,
                playerPosition: { x: 5, y: 3 },
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
                    playTime: 12000,
                    deathCount: 3,
                    dialoguesSeen: ['intro', 'virgilio_meet']
                },
                levelProgress: [
                    { level: 1, completed: false, startTime: expect.any(Number) }
                ]
            });

            // Should not include currentMaze
            expect(serialized.currentMaze).toBeUndefined();
        });
    });

    describe('deserializeGameState', () => {
        it('should restore complete game state with defaults', () => {
            const serialized = {
                currentLevel: 2,
                playerPosition: { x: 10, y: 5 },
                collectedItems: ['item1'],
                objectivesCompleted: {
                    virgilioFound: false,
                    fragmentsCollected: 1,
                    exitUnlocked: true
                },
                gameSettings: {
                    volume: 0.5,
                    difficulty: 'hard'
                },
                gameStats: {
                    playTime: 5000,
                    deathCount: 1,
                    dialoguesSeen: ['intro']
                },
                levelProgress: []
            };

            const deserialized = saveManager.deserializeGameState(serialized);

            expect(deserialized).toEqual({
                ...serialized,
                currentMaze: null
            });
        });

        it('should provide defaults for missing properties', () => {
            const incomplete = { currentLevel: 3 };
            const deserialized = saveManager.deserializeGameState(incomplete);

            expect(deserialized.currentLevel).toBe(3);
            expect(deserialized.playerPosition).toEqual({ x: 0, y: 0 });
            expect(deserialized.collectedItems).toEqual([]);
            expect(deserialized.objectivesCompleted).toEqual({
                virgilioFound: false,
                fragmentsCollected: 0,
                exitUnlocked: false
            });
            expect(deserialized.gameSettings).toEqual({
                volume: 0.7,
                difficulty: 'normal'
            });
            expect(deserialized.gameStats).toEqual({
                playTime: 0,
                deathCount: 0,
                dialoguesSeen: []
            });
            expect(deserialized.levelProgress).toEqual([]);
            expect(deserialized.currentMaze).toBeNull();
        });
    });

    describe('testLocalStorage', () => {
        it('should return true for working localStorage', () => {
            expect(saveManager.testLocalStorage()).toBe(true);
        });

        it('should return false when localStorage fails', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            expect(saveManager.testLocalStorage()).toBe(false);
            expect(consoleMock.error).toHaveBeenCalledWith('localStorage test failed:', expect.any(Error));
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage usage information', () => {
            const saveData = JSON.stringify({ version: '1.0.0', timestamp: Date.now(), gameState: mockGameState });
            localStorageMock.setItem('danteInfernoGameSave', saveData);

            const info = saveManager.getStorageInfo();

            expect(info).toEqual({
                totalSize: saveData.length,
                saveSize: saveData.length,
                backupSize: 0,
                settingsSize: 0,
                maxSize: 1024 * 1024,
                usagePercent: expect.any(String)
            });
        });

        it('should handle localStorage errors', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            expect(saveManager.getStorageInfo()).toBeNull();
            expect(consoleMock.error).toHaveBeenCalledWith('Failed to get storage info:', expect.any(Error));
        });
    });

    describe('Auto-save functionality', () => {
        beforeEach(() => {
            // Initialize auto-save state
            saveManager.initializeAutoSave();
        });

        describe('autoSave', () => {
            it('should perform auto-save successfully', () => {
                const result = saveManager.autoSave(mockGameState);

                expect(result).toBe(true);
                expect(localStorageMock.setItem).toHaveBeenCalled();
                expect(consoleMock.log).toHaveBeenCalledWith('Auto-save completed successfully');
            });

            it('should throttle frequent auto-save attempts', () => {
                // First save should succeed
                expect(saveManager.autoSave(mockGameState)).toBe(true);
                localStorageMock.setItem.mockClear();

                // Immediate second save should be throttled but queued
                expect(saveManager.autoSave(mockGameState)).toBe(true);
                expect(localStorageMock.setItem).not.toHaveBeenCalled();
            });

            it('should force save when requested', () => {
                // First save
                saveManager.autoSave(mockGameState);
                localStorageMock.setItem.mockClear();

                // Force save should bypass throttling
                const result = saveManager.autoSave(mockGameState, true);

                expect(result).toBe(true);
                expect(localStorageMock.setItem).toHaveBeenCalled();
            });

            it('should skip save for invalid game state', () => {
                const invalidState = { invalid: 'state' };
                const result = saveManager.autoSave(invalidState);

                expect(result).toBe(false);
                expect(consoleMock.warn).toHaveBeenCalledWith('Auto-save skipped due to invalid game state');
            });

            it('should skip save when no significant changes detected', () => {
                // First save to establish baseline
                saveManager.autoSave(mockGameState, true);
                localStorageMock.setItem.mockClear();
                consoleMock.log.mockClear();

                // Second save with same state should be skipped (don't force)
                const result = saveManager.autoSave(mockGameState, false);

                expect(result).toBe(true);
                expect(consoleMock.log).toHaveBeenCalledWith('Auto-save skipped - no significant changes detected');
            });
        });

        describe('hasSignificantChanges', () => {
            it('should detect level changes', () => {
                saveManager.autoSaveState.lastSavedState = saveManager.createStateSnapshot(mockGameState);
                
                const changedState = { ...mockGameState, currentLevel: 2 };
                expect(saveManager.hasSignificantChanges(changedState)).toBe(true);
            });

            it('should detect position changes', () => {
                saveManager.autoSaveState.lastSavedState = saveManager.createStateSnapshot(mockGameState);
                
                const changedState = { 
                    ...mockGameState, 
                    playerPosition: { x: 10, y: 10 } 
                };
                expect(saveManager.hasSignificantChanges(changedState)).toBe(true);
            });

            it('should detect objective changes', () => {
                saveManager.autoSaveState.lastSavedState = saveManager.createStateSnapshot(mockGameState);
                
                const changedState = { 
                    ...mockGameState, 
                    objectivesCompleted: {
                        ...mockGameState.objectivesCompleted,
                        virgilioFound: false
                    }
                };
                expect(saveManager.hasSignificantChanges(changedState)).toBe(true);
            });

            it('should detect significant play time changes', () => {
                saveManager.autoSaveState.lastSavedState = saveManager.createStateSnapshot(mockGameState);
                
                const changedState = { 
                    ...mockGameState, 
                    gameStats: {
                        ...mockGameState.gameStats,
                        playTime: mockGameState.gameStats.playTime + 35000 // +35 seconds
                    }
                };
                expect(saveManager.hasSignificantChanges(changedState)).toBe(true);
            });

            it('should return true for first save', () => {
                expect(saveManager.hasSignificantChanges(mockGameState)).toBe(true);
            });
        });

        describe('validateAutoSaveState', () => {
            it('should validate correct game state', () => {
                expect(saveManager.validateAutoSaveState(mockGameState)).toBe(true);
            });

            it('should reject null or undefined', () => {
                expect(saveManager.validateAutoSaveState(null)).toBe(false);
                expect(saveManager.validateAutoSaveState(undefined)).toBe(false);
            });

            it('should reject missing critical properties', () => {
                const incompleteState = { currentLevel: 1 };
                expect(saveManager.validateAutoSaveState(incompleteState)).toBe(false);
            });

            it('should be more lenient than regular validation', () => {
                // State missing non-critical properties should still pass auto-save validation
                const minimalState = {
                    currentLevel: 1,
                    playerPosition: { x: 5, y: 3 }
                };
                expect(saveManager.validateAutoSaveState(minimalState)).toBe(true);
                expect(saveManager.validateGameState(minimalState)).toBe(false);
            });
        });

        describe('initializeAutoSave', () => {
            it('should initialize auto-save system successfully', () => {
                const result = saveManager.initializeAutoSave();

                expect(saveManager.autoSaveState).toBeDefined();
                expect(saveManager.autoSaveState.saveThrottle).toBe(5000);
                expect(consoleMock.log).toHaveBeenCalledWith('Initializing auto-save system...');
            });

            it('should restore previous game state if available', () => {
                // Set up existing save
                const saveData = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    gameState: mockGameState
                };
                localStorageMock.setItem('danteInfernoGameSave', JSON.stringify(saveData));

                const result = saveManager.initializeAutoSave();

                expect(result).toEqual(mockGameState);
                expect(consoleMock.log).toHaveBeenCalledWith('Game state restored from auto-save');
            });

            it('should handle localStorage unavailability', () => {
                // Mock localStorage test failure
                vi.spyOn(saveManager, 'testLocalStorage').mockReturnValue(false);

                const result = saveManager.initializeAutoSave();

                expect(result).toBeNull();
                expect(consoleMock.error).toHaveBeenCalledWith('localStorage not available - auto-save disabled');
            });
        });

        describe('getAutoSaveStatus', () => {
            it('should return status when auto-save is enabled', () => {
                const status = saveManager.getAutoSaveStatus();

                expect(status.enabled).toBe(true);
                expect(status).toHaveProperty('lastSaveTime');
                expect(status).toHaveProperty('saveThrottle');
                expect(status).toHaveProperty('pendingSave');
                expect(status).toHaveProperty('consecutiveFailures');
            });

            it('should return disabled status when not initialized', () => {
                const uninitializedManager = new SaveManager();
                const status = uninitializedManager.getAutoSaveStatus();

                expect(status.enabled).toBe(false);
                expect(status.reason).toBe('Not initialized');
            });
        });

        describe('forceSave', () => {
            it('should bypass throttling and save immediately', () => {
                // Set up throttling condition
                saveManager.autoSave(mockGameState);
                localStorageMock.setItem.mockClear();

                const result = saveManager.forceSave(mockGameState);

                expect(result).toBe(true);
                expect(localStorageMock.setItem).toHaveBeenCalled();
                expect(consoleMock.log).toHaveBeenCalledWith('Force save requested');
            });
        });

        describe('handleAutoSaveFailure', () => {
            it('should implement exponential backoff on repeated failures', () => {
                const initialThrottle = saveManager.autoSaveState.saveThrottle;
                
                // Simulate multiple failures
                for (let i = 0; i < 5; i++) {
                    saveManager.handleAutoSaveFailure();
                }

                expect(saveManager.autoSaveState.saveThrottle).toBeGreaterThan(initialThrottle);
                expect(saveManager.autoSaveState.consecutiveFailures).toBe(5);
            });
        });
    });

    describe('Statistics tracking', () => {
        beforeEach(() => {
            // Ensure game state has proper structure
            mockGameState.gameStats = {
                playTime: 12000,
                deathCount: 3,
                dialoguesSeen: ['intro', 'virgilio_meet'],
                sessionStartTime: Date.now(),
                totalSessions: 1,
                levelsCompleted: 0,
                objectivesCompleted: 2,
                fragmentsCollected: 2,
                averageSessionTime: 0,
                fastestLevelCompletion: {},
                totalDistance: 150,
                achievements: []
            };
        });

        describe('updateStatistics', () => {
            it('should update play time correctly', () => {
                const result = saveManager.updateStatistics(mockGameState, 'playTime', 15000);
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.playTime).toBe(15000);
            });

            it('should increment play time correctly', () => {
                const initialTime = mockGameState.gameStats.playTime;
                const result = saveManager.updateStatistics(mockGameState, 'incrementPlayTime', 5000);
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.playTime).toBe(initialTime + 5000);
            });

            it('should increment death count', () => {
                const initialDeaths = mockGameState.gameStats.deathCount;
                const result = saveManager.updateStatistics(mockGameState, 'death');
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.deathCount).toBe(initialDeaths + 1);
            });

            it('should track new dialogues', () => {
                const result = saveManager.updateStatistics(mockGameState, 'dialogue', 'new_dialogue');
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.dialoguesSeen).toContain('new_dialogue');
            });

            it('should not duplicate existing dialogues', () => {
                const initialLength = mockGameState.gameStats.dialoguesSeen.length;
                const result = saveManager.updateStatistics(mockGameState, 'dialogue', 'intro');
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.dialoguesSeen.length).toBe(initialLength);
            });

            it('should track session start', () => {
                const result = saveManager.updateStatistics(mockGameState, 'sessionStart');
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.totalSessions).toBe(2);
                expect(mockGameState.gameStats.sessionStartTime).toBeGreaterThan(0);
            });

            it('should track level completion with time', () => {
                const levelData = { level: 1, time: 30000 };
                const result = saveManager.updateStatistics(mockGameState, 'levelComplete', levelData);
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.levelsCompleted).toBe(1);
                expect(mockGameState.gameStats.fastestLevelCompletion[1]).toBe(30000);
            });

            it('should update fastest completion time', () => {
                // Set initial time
                saveManager.updateStatistics(mockGameState, 'levelComplete', { level: 1, time: 30000 });
                
                // Try to set faster time
                const result = saveManager.updateStatistics(mockGameState, 'levelComplete', { level: 1, time: 25000 });
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.fastestLevelCompletion[1]).toBe(25000);
            });

            it('should not update slower completion time', () => {
                // Set initial time
                saveManager.updateStatistics(mockGameState, 'levelComplete', { level: 1, time: 25000 });
                
                // Try to set slower time
                const result = saveManager.updateStatistics(mockGameState, 'levelComplete', { level: 1, time: 30000 });
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.fastestLevelCompletion[1]).toBe(25000);
            });

            it('should track achievements', () => {
                const result = saveManager.updateStatistics(mockGameState, 'achievement', 'first_death');
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.achievements).toContain('first_death');
            });

            it('should handle unknown statistic types', () => {
                const result = saveManager.updateStatistics(mockGameState, 'unknown_stat', 'value');
                
                expect(result).toBe(false);
                expect(consoleMock.warn).toHaveBeenCalledWith('Unknown statistic type: unknown_stat');
            });

            it('should initialize stats if missing', () => {
                const stateWithoutStats = { ...mockGameState };
                delete stateWithoutStats.gameStats;
                
                const result = saveManager.updateStatistics(stateWithoutStats, 'death');
                
                expect(result).toBe(true);
                expect(stateWithoutStats.gameStats).toBeDefined();
                expect(stateWithoutStats.gameStats.deathCount).toBe(1);
            });
        });

        describe('getFormattedStatistics', () => {
            it('should return formatted statistics', () => {
                const stats = saveManager.getFormattedStatistics(mockGameState);
                
                expect(stats).toHaveProperty('playTime');
                expect(stats).toHaveProperty('deathCount', 3);
                expect(stats).toHaveProperty('dialoguesSeen', 2);
                expect(stats).toHaveProperty('levelsCompleted', 0);
                expect(stats).toHaveProperty('efficiency');
                expect(stats).toHaveProperty('completionRate');
            });

            it('should format time correctly', () => {
                const stats = saveManager.getFormattedStatistics(mockGameState);
                
                expect(stats.playTime).toMatch(/^\d+:\d{2}$/); // Format: M:SS or MM:SS
            });

            it('should return default stats for missing gameStats', () => {
                const stateWithoutStats = { ...mockGameState };
                delete stateWithoutStats.gameStats;
                
                const stats = saveManager.getFormattedStatistics(stateWithoutStats);
                
                expect(stats.playTime).toBe('0:00:00');
                expect(stats.deathCount).toBe(0);
                expect(stats.dialoguesSeen).toBe(0);
            });
        });

        describe('formatTime', () => {
            it('should format time correctly for hours', () => {
                expect(saveManager.formatTime(3661000)).toBe('1:01:01'); // 1 hour, 1 minute, 1 second
            });

            it('should format time correctly for minutes', () => {
                expect(saveManager.formatTime(125000)).toBe('2:05'); // 2 minutes, 5 seconds
            });

            it('should handle zero time', () => {
                expect(saveManager.formatTime(0)).toBe('0:00:00');
            });

            it('should handle negative time', () => {
                expect(saveManager.formatTime(-1000)).toBe('0:00:00');
            });
        });

        describe('trackDialogue', () => {
            it('should track dialogue with metadata', () => {
                const dialogueData = { category: 'narrative', character: 'Virgilio' };
                const result = saveManager.trackDialogue(mockGameState, 'virgilio_intro', dialogueData);
                
                expect(result).toBe(true);
                expect(mockGameState.gameStats.dialoguesSeen).toContain('virgilio_intro');
                expect(mockGameState.dialogueMetadata['virgilio_intro']).toBeDefined();
                expect(mockGameState.dialogueMetadata['virgilio_intro'].category).toBe('narrative');
            });

            it('should increment view count for repeated dialogues', () => {
                saveManager.trackDialogue(mockGameState, 'test_dialogue');
                const result = saveManager.trackDialogue(mockGameState, 'test_dialogue');
                
                expect(result).toBe(true);
                expect(mockGameState.dialogueMetadata['test_dialogue'].viewCount).toBe(2);
            });

            it('should reject invalid dialogue IDs', () => {
                const result = saveManager.trackDialogue(mockGameState, null);
                
                expect(result).toBe(false);
                expect(consoleMock.warn).toHaveBeenCalledWith('Invalid dialogue ID provided');
            });
        });

        describe('getDialogueStatistics', () => {
            beforeEach(() => {
                // Set up dialogue metadata
                mockGameState.dialogueMetadata = {
                    'intro': { viewCount: 1, category: 'tutorial' },
                    'virgilio_meet': { viewCount: 3, category: 'character' },
                    'level_complete': { viewCount: 1, category: 'narrative' }
                };
            });

            it('should return dialogue statistics', () => {
                const stats = saveManager.getDialogueStatistics(mockGameState);
                
                expect(stats.totalSeen).toBe(2); // Based on dialoguesSeen array
                expect(stats.categories.tutorial).toBe(1);
                expect(stats.categories.character).toBe(1);
                expect(stats.categories.narrative).toBe(1);
            });

            it('should find most viewed dialogue', () => {
                const stats = saveManager.getDialogueStatistics(mockGameState);
                
                expect(stats.mostViewedDialogue.id).toBe('virgilio_meet');
                expect(stats.mostViewedDialogue.viewCount).toBe(3);
            });
        });

        describe('calculateEfficiency', () => {
            it('should calculate efficiency based on objectives and time', () => {
                const stats = {
                    playTime: 3600000, // 1 hour
                    objectivesCompleted: 5,
                    deathCount: 2
                };
                
                const efficiency = saveManager.calculateEfficiency(stats);
                
                expect(efficiency).toBeGreaterThanOrEqual(0);
                expect(efficiency).toBeLessThanOrEqual(100);
            });

            it('should return 0 for zero play time', () => {
                const stats = { playTime: 0, objectivesCompleted: 5, deathCount: 0 };
                const efficiency = saveManager.calculateEfficiency(stats);
                
                expect(efficiency).toBe(0);
            });
        });

        describe('exportStatistics', () => {
            it('should export complete statistics data', () => {
                const exportData = saveManager.exportStatistics(mockGameState);
                
                expect(exportData).toHaveProperty('exportDate');
                expect(exportData).toHaveProperty('gameVersion');
                expect(exportData).toHaveProperty('playerStats');
                expect(exportData).toHaveProperty('dialogueProgress');
                expect(exportData).toHaveProperty('gameProgress');
                expect(exportData).toHaveProperty('rawStats');
            });

            it('should handle missing game state gracefully', () => {
                const exportData = saveManager.exportStatistics({});
                
                expect(exportData).not.toBeNull();
                expect(exportData.playerStats).toBeDefined();
            });
        });
    });
});