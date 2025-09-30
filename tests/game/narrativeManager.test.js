/**
 * Narrative Manager Tests
 * Tests for Divine Comedy storyline integration
 * Requirements: 5.1, 5.2 - Spanish narrative and Divine Comedy storyline
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NarrativeManager } from '../../js/game/narrativeManager.js';

// Mock DialogSystem
vi.mock('../../js/ui/dialogSystem.js', () => ({
    DialogSystem: vi.fn().mockImplementation(() => ({
        init: vi.fn(),
        showDialog: vi.fn((dialogues, callback) => {
            // Simulate async dialog completion
            setTimeout(() => {
                if (callback) callback();
            }, 10);
        }),
        isActive: vi.fn(() => false),
        destroy: vi.fn()
    }))
}));

// Mock LevelData
vi.mock('../../js/data/levelData.js', () => ({
    getLevelConfig: vi.fn((level) => {
        const mockLevels = {
            1: {
                number: 1,
                name: 'Bosque Oscuro',
                circle: 'Antesala del Infierno',
                description: 'El comienzo del viaje de Dante',
                narrative: {
                    intro: 'Te encuentras perdido en un bosque oscuro...',
                    virgilioDialogue: 'Yo soy Virgilio, tu guía en este viaje.',
                    completion: 'Has encontrado a tu guía. Ahora comienza el verdadero descenso.'
                }
            },
            2: {
                number: 2,
                name: 'Limbo',
                circle: 'Primer Círculo',
                description: 'Primer Círculo del Infierno',
                narrative: {
                    intro: 'Entras al Limbo, donde las almas virtuosas esperan.',
                    completion: 'Has atravesado el Limbo.'
                }
            }
        };
        return mockLevels[level] || null;
    })
}));

describe('NarrativeManager', () => {
    let narrativeManager;

    beforeEach(() => {
        narrativeManager = new NarrativeManager();
    });

    afterEach(() => {
        if (narrativeManager) {
            narrativeManager.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize correctly', () => {
            expect(narrativeManager.currentLevel).toBe(1);
            expect(narrativeManager.isNarrativeActive).toBe(false);
            expect(narrativeManager.storyProgress.dialoguesSeen.size).toBe(0);
        });

        test('should initialize dialog system on init', () => {
            narrativeManager.init();
            expect(narrativeManager.dialogSystem).toBeDefined();
        });
    });

    describe('Level Management', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should set current level', () => {
            narrativeManager.setCurrentLevel(3);
            expect(narrativeManager.currentLevel).toBe(3);
        });
    });

    describe('Level Introduction Narrative', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should show level introduction', async () => {
            const onComplete = vi.fn();
            
            narrativeManager.showLevelIntroduction(1, onComplete);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(narrativeManager.dialogSystem.showDialog).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.storyProgress.levelIntrosSeen.has('level_1_intro')).toBe(true);
        });

        test('should not show introduction twice for same level', async () => {
            const onComplete = vi.fn();
            
            // Show first time
            narrativeManager.showLevelIntroduction(1, onComplete);
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // Reset mock
            narrativeManager.dialogSystem.showDialog.mockClear();
            onComplete.mockClear();
            
            // Show second time
            narrativeManager.showLevelIntroduction(1, onComplete);
            
            expect(narrativeManager.dialogSystem.showDialog).not.toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
        });

        test('should handle missing level data gracefully', () => {
            const onComplete = vi.fn();
            
            narrativeManager.showLevelIntroduction(999, onComplete);
            
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.dialogSystem.showDialog).not.toHaveBeenCalled();
        });
    });

    describe('Virgilio Encounter Narrative', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should show Virgilio encounter dialogue', async () => {
            const onComplete = vi.fn();
            
            narrativeManager.showVirgilioEncounter(1, onComplete);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(narrativeManager.dialogSystem.showDialog).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.storyProgress.virgilioEncountersSeen.has('level_1_virgilio')).toBe(true);
        });

        test('should create appropriate Virgilio dialogue for level 1', () => {
            const levelData = {
                narrative: {
                    virgilioDialogue: 'Yo soy Virgilio, tu guía en este viaje.'
                }
            };
            
            const dialogues = narrativeManager.createVirgilioDialogue(levelData, 1);
            
            expect(dialogues).toHaveLength(3); // Main dialogue + 2 guidance dialogues for level 1
            expect(dialogues[0].speaker).toBe('Virgilio');
            expect(dialogues[0].text).toBe('Yo soy Virgilio, tu guía en este viaje.');
            expect(dialogues[1].text).toContain('fragmentos de sabiduría');
        });

        test('should handle missing Virgilio dialogue gracefully', () => {
            const onComplete = vi.fn();
            
            narrativeManager.showVirgilioEncounter(2, onComplete); // Level 2 has no Virgilio dialogue
            
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.dialogSystem.showDialog).not.toHaveBeenCalled();
        });
    });

    describe('Level Completion Narrative', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should show level completion dialogue', async () => {
            const onComplete = vi.fn();
            
            narrativeManager.showLevelCompletion(1, onComplete);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(narrativeManager.dialogSystem.showDialog).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.storyProgress.levelCompletionsSeen.has('level_1_completion')).toBe(true);
        });

        test('should create completion dialogue with next level preview', () => {
            const levelData = {
                narrative: {
                    completion: 'Has completado el nivel.'
                }
            };
            
            const dialogues = narrativeManager.createLevelCompletionDialogue(levelData, 1);
            
            expect(dialogues).toHaveLength(2); // Completion + next level preview
            expect(dialogues[0].text).toBe('Has completado el nivel.');
            expect(dialogues[1].text).toContain('Primer Círculo');
        });

        test('should handle final level completion differently', () => {
            const levelData = {
                narrative: {
                    completion: 'Has completado el último nivel.'
                }
            };
            
            const dialogues = narrativeManager.createLevelCompletionDialogue(levelData, 9);
            
            expect(dialogues).toHaveLength(2);
            expect(dialogues[1].text).toContain('redención');
        });
    });

    describe('Fragment Collection Narrative', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should show narrative for first fragment', async () => {
            const onComplete = vi.fn();
            
            narrativeManager.showFragmentCollection(1, 3, 1, onComplete);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(narrativeManager.dialogSystem.showDialog).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
        });

        test('should show narrative for last fragment', async () => {
            const onComplete = vi.fn();
            
            narrativeManager.showFragmentCollection(3, 3, 1, onComplete);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(narrativeManager.dialogSystem.showDialog).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
        });

        test('should not show narrative for middle fragments', () => {
            const onComplete = vi.fn();
            
            narrativeManager.showFragmentCollection(2, 3, 1, onComplete);
            
            expect(narrativeManager.dialogSystem.showDialog).not.toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
        });

        test('should create appropriate fragment dialogue', () => {
            const levelData = { name: 'Bosque Oscuro' };
            
            const firstFragmentDialogue = narrativeManager.createFragmentDialogue(1, 3, levelData);
            expect(firstFragmentDialogue.text).toContain('primer fragmento');
            expect(firstFragmentDialogue.text).toContain('Bosque Oscuro');
            
            const lastFragmentDialogue = narrativeManager.createFragmentDialogue(3, 3, levelData);
            expect(lastFragmentDialogue.text).toContain('todos los fragmentos');
        });
    });

    describe('Game Completion Narrative', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should show game completion dialogue', async () => {
            const onComplete = vi.fn();
            
            narrativeManager.showGameCompletion(onComplete);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(narrativeManager.dialogSystem.showDialog).toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.storyProgress.specialEventsSeen.has('game_completion')).toBe(true);
        });

        test('should create comprehensive game completion dialogue', () => {
            const dialogues = narrativeManager.createGameCompletionDialogue();
            
            expect(dialogues).toHaveLength(4);
            expect(dialogues[0].text).toContain('nueve círculos');
            expect(dialogues[1].speaker).toBe('Virgilio');
            expect(dialogues[2].text).toContain('Purgatorio');
            expect(dialogues[3].text).toContain('Felicidades');
        });
    });

    describe('Virgilio Guidance', () => {
        test('should provide level-specific guidance', () => {
            const guidance2 = narrativeManager.getVirgilioGuidanceForLevel(2);
            expect(guidance2).toContain('Limbo');
            
            const guidance3 = narrativeManager.getVirgilioGuidanceForLevel(3);
            expect(guidance3).toContain('vientos eternos');
            
            const guidance9 = narrativeManager.getVirgilioGuidanceForLevel(9);
            expect(guidance9).toContain('Cocito');
        });

        test('should return null for invalid levels', () => {
            const guidance = narrativeManager.getVirgilioGuidanceForLevel(999);
            expect(guidance).toBeNull();
        });
    });

    describe('Story Progress Tracking', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should track story progress events', () => {
            const onStoryProgress = vi.fn();
            narrativeManager.setCallbacks({ onStoryProgress });
            
            narrativeManager.trackStoryProgress('levelIntro', 1, { test: 'data' });
            
            expect(onStoryProgress).toHaveBeenCalledWith({
                eventType: 'levelIntro',
                levelNumber: 1,
                timestamp: expect.any(Number),
                metadata: { test: 'data' }
            });
        });

        test('should calculate completion percentage correctly', async () => {
            // Simulate some story progress
            narrativeManager.showLevelIntroduction(1);
            await new Promise(resolve => setTimeout(resolve, 20));
            
            narrativeManager.showVirgilioEncounter(1);
            await new Promise(resolve => setTimeout(resolve, 20));
            
            const progress = narrativeManager.getStoryProgress();
            expect(progress.completionPercentage).toBeGreaterThan(0);
            expect(progress.totalDialoguesSeen).toBe(2);
        });

        test('should provide comprehensive story progress data', () => {
            const progress = narrativeManager.getStoryProgress();
            
            expect(progress).toHaveProperty('dialoguesSeen');
            expect(progress).toHaveProperty('levelIntrosSeen');
            expect(progress).toHaveProperty('virgilioEncountersSeen');
            expect(progress).toHaveProperty('levelCompletionsSeen');
            expect(progress).toHaveProperty('specialEventsSeen');
            expect(progress).toHaveProperty('totalDialoguesSeen');
            expect(progress).toHaveProperty('completionPercentage');
        });
    });

    describe('State Management', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should check if narrative is active', () => {
            expect(narrativeManager.isActive()).toBe(false);
            
            narrativeManager.isNarrativeActive = true;
            expect(narrativeManager.isActive()).toBe(true);
        });

        test('should get serializable state', async () => {
            // Add some progress
            narrativeManager.showLevelIntroduction(1);
            await new Promise(resolve => setTimeout(resolve, 20));
            
            const state = narrativeManager.getSerializableState();
            
            expect(state).toHaveProperty('currentLevel');
            expect(state).toHaveProperty('storyProgress');
            expect(state.storyProgress.levelIntrosSeen).toContain('level_1_intro');
        });

        test('should load state from serialized data', () => {
            const state = {
                currentLevel: 3,
                storyProgress: {
                    dialoguesSeen: ['level_1_intro', 'level_1_virgilio'],
                    levelIntrosSeen: ['level_1_intro'],
                    virgilioEncountersSeen: ['level_1_virgilio'],
                    levelCompletionsSeen: [],
                    specialEventsSeen: []
                }
            };
            
            narrativeManager.loadState(state);
            
            expect(narrativeManager.currentLevel).toBe(3);
            expect(narrativeManager.storyProgress.dialoguesSeen.has('level_1_intro')).toBe(true);
            expect(narrativeManager.storyProgress.virgilioEncountersSeen.has('level_1_virgilio')).toBe(true);
        });

        test('should reset narrative progress', async () => {
            // Add some progress
            narrativeManager.showLevelIntroduction(1);
            await new Promise(resolve => setTimeout(resolve, 20));
            
            narrativeManager.reset();
            
            expect(narrativeManager.currentLevel).toBe(1);
            expect(narrativeManager.storyProgress.dialoguesSeen.size).toBe(0);
            expect(narrativeManager.isNarrativeActive).toBe(false);
        });
    });

    describe('Event Callbacks', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should call narrative start callback', async () => {
            const onNarrativeStart = vi.fn();
            narrativeManager.setCallbacks({ onNarrativeStart });
            
            narrativeManager.showLevelIntroduction(1);
            
            expect(onNarrativeStart).toHaveBeenCalledWith('levelIntro', 1);
        });

        test('should call narrative complete callback', async () => {
            const onNarrativeComplete = vi.fn();
            narrativeManager.setCallbacks({ onNarrativeComplete });
            
            narrativeManager.showLevelIntroduction(1);
            
            // Wait for async completion
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect(onNarrativeComplete).toHaveBeenCalledWith('levelIntro', 1);
        });
    });

    describe('Spanish Language Content', () => {
        beforeEach(() => {
            narrativeManager.init();
        });

        test('should create dialogues in Spanish', () => {
            const levelData = {
                number: 1,
                name: 'Bosque Oscuro',
                circle: 'Antesala del Infierno',
                description: 'El comienzo del viaje de Dante',
                narrative: {
                    intro: 'Te encuentras perdido en un bosque oscuro...'
                }
            };
            
            const dialogues = narrativeManager.createLevelIntroDialogue(levelData);
            
            // Check that dialogues contain Spanish content
            expect(dialogues).toHaveLength(4);
            expect(dialogues[0].text).toContain('Antesala del Infierno');
            expect(dialogues[1].text).toContain('comienzo del viaje');
            expect(dialogues[2].text).toContain('encuentras perdido');
            expect(dialogues[3].text).toContain('Virgilio');
            
            // Check speakers are in Spanish
            dialogues.forEach(dialogue => {
                expect(dialogue.speaker).toBe('Narrador');
            });
        });

        test('should use Spanish terminology consistently', () => {
            const fragmentDialogue = narrativeManager.createFragmentDialogue(1, 3, { name: 'Test' });
            
            expect(fragmentDialogue.text).toContain('fragmento');
            expect(fragmentDialogue.text).toContain('sabiduría');
            expect(fragmentDialogue.speaker).toBe('Narrador');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing dialog system gracefully', () => {
            const onComplete = vi.fn();
            
            // Don't initialize dialog system
            narrativeManager.showLevelIntroduction(1, onComplete);
            
            // Should not crash and should call completion
            expect(onComplete).toHaveBeenCalled();
        });

        test('should handle invalid level data gracefully', () => {
            narrativeManager.init();
            const onComplete = vi.fn();
            
            narrativeManager.showLevelIntroduction(null, onComplete);
            
            expect(onComplete).toHaveBeenCalled();
            expect(narrativeManager.dialogSystem.showDialog).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        test('should destroy properly', () => {
            narrativeManager.init();
            narrativeManager.destroy();
            
            expect(narrativeManager.dialogSystem).toBeNull();
            expect(narrativeManager.storyProgress.dialoguesSeen.size).toBe(0);
        });
    });
});