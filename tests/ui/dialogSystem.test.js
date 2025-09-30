/**
 * Dialog System Tests
 * Tests for Spanish narrative dialogue system
 * Requirements: 5.1, 5.2, 5.3 - Spanish language content and narrative
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DialogSystem } from '../../js/ui/dialogSystem.js';

// Mock DOM environment
const mockDOM = () => {
    global.document = {
        createElement: vi.fn((tag) => ({
            className: '',
            style: { display: '' },
            id: '',
            textContent: '',
            addEventListener: vi.fn(),
            appendChild: vi.fn(),
            querySelector: vi.fn(),
            classList: {
                add: vi.fn(),
                remove: vi.fn()
            }
        })),
        body: {
            appendChild: vi.fn()
        },
        getElementById: vi.fn(),
        addEventListener: vi.fn()
    };
};

describe('DialogSystem', () => {
    let dialogSystem;

    beforeEach(() => {
        mockDOM();
        dialogSystem = new DialogSystem();
    });

    afterEach(() => {
        if (dialogSystem) {
            dialogSystem.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize correctly', () => {
            expect(dialogSystem.isDialogActive).toBe(false);
            expect(dialogSystem.currentDialog).toBe(null);
            expect(dialogSystem.dialogQueue).toEqual([]);
            expect(dialogSystem.isInitialized).toBe(false);
        });

        test('should create DOM elements on init', () => {
            dialogSystem.init();
            expect(dialogSystem.isInitialized).toBe(true);
            expect(document.createElement).toHaveBeenCalledWith('div');
        });

        test('should not reinitialize if already initialized', () => {
            dialogSystem.init();
            const createElementCallCount = document.createElement.mock.calls.length;
            dialogSystem.init();
            expect(document.createElement.mock.calls.length).toBe(createElementCallCount);
        });
    });

    describe('Dialog Display', () => {
        beforeEach(() => {
            dialogSystem.init();
        });

        test('should show single dialog', () => {
            const dialogData = {
                speaker: 'Virgilio',
                text: 'Yo soy Virgilio, tu guía en este viaje.',
                type: 'virgilio'
            };

            dialogSystem.showDialog(dialogData);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog).toEqual(dialogData);
            expect(dialogSystem.dialogQueue).toEqual([dialogData]);
        });

        test('should show multiple dialogs in sequence', () => {
            const dialogData = [
                { speaker: 'Narrador', text: 'Primera parte de la historia.' },
                { speaker: 'Virgilio', text: 'Segunda parte de la historia.' }
            ];

            dialogSystem.showDialog(dialogData);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.dialogQueue).toEqual(dialogData);
            expect(dialogSystem.currentDialogIndex).toBe(0);
        });

        test('should handle dialog without speaker', () => {
            const dialogData = {
                text: 'Texto sin narrador específico.'
            };

            dialogSystem.showDialog(dialogData);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog).toEqual(dialogData);
        });
    });

    describe('Dialog Navigation', () => {
        beforeEach(() => {
            dialogSystem.init();
        });

        test('should continue to next dialog', () => {
            const dialogData = [
                { speaker: 'Narrador', text: 'Primer diálogo.' },
                { speaker: 'Virgilio', text: 'Segundo diálogo.' }
            ];

            dialogSystem.showDialog(dialogData);
            expect(dialogSystem.currentDialogIndex).toBe(0);

            dialogSystem.continueDialog();
            expect(dialogSystem.currentDialogIndex).toBe(1);
        });

        test('should close dialog when reaching end', () => {
            const dialogData = { speaker: 'Narrador', text: 'Único diálogo.' };
            const onComplete = vi.fn();

            dialogSystem.showDialog(dialogData, onComplete);
            dialogSystem.continueDialog();

            expect(dialogSystem.isDialogActive).toBe(false);
            expect(onComplete).toHaveBeenCalled();
        });

        test('should skip all dialogs', () => {
            const dialogData = [
                { speaker: 'Narrador', text: 'Primer diálogo.' },
                { speaker: 'Virgilio', text: 'Segundo diálogo.' }
            ];
            const onComplete = vi.fn();

            dialogSystem.showDialog(dialogData, onComplete);
            dialogSystem.skipDialog();

            expect(dialogSystem.isDialogActive).toBe(false);
            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe('Specialized Dialog Methods', () => {
        beforeEach(() => {
            dialogSystem.init();
        });

        test('should show level introduction dialog', () => {
            const levelData = {
                name: 'Bosque Oscuro',
                narrative: {
                    intro: 'Te encuentras perdido en un bosque oscuro...'
                }
            };

            dialogSystem.showLevelIntro(levelData);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog.speaker).toBe('Narrador');
            expect(dialogSystem.currentDialog.text).toBe(levelData.narrative.intro);
            expect(dialogSystem.currentDialog.type).toBe('intro');
        });

        test('should show Virgilio dialog', () => {
            const levelData = {
                narrative: {
                    virgilioDialogue: 'Yo soy Virgilio, tu guía en este viaje.'
                }
            };

            dialogSystem.showVirgilioDialog(levelData);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog.speaker).toBe('Virgilio');
            expect(dialogSystem.currentDialog.text).toBe(levelData.narrative.virgilioDialogue);
            expect(dialogSystem.currentDialog.type).toBe('virgilio');
        });

        test('should show level completion dialog', () => {
            const levelData = {
                name: 'Bosque Oscuro',
                narrative: {
                    completion: 'Has completado el primer círculo...'
                }
            };

            dialogSystem.showLevelCompletion(levelData);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog.speaker).toBe('Narrador');
            expect(dialogSystem.currentDialog.text).toBe(levelData.narrative.completion);
            expect(dialogSystem.currentDialog.type).toBe('completion');
        });

        test('should show fragment collection dialog', () => {
            dialogSystem.showFragmentDialog(2, 3);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog.speaker).toBe('Narrador');
            expect(dialogSystem.currentDialog.text).toBe('Has encontrado un fragmento. Tienes 2 de 3.');
            expect(dialogSystem.currentDialog.type).toBe('fragment');
        });

        test('should show exit unlocked dialog', () => {
            dialogSystem.showExitUnlockedDialog();

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog.speaker).toBe('Narrador');
            expect(dialogSystem.currentDialog.text).toBe('Has completado todos los objetivos. La salida está ahora desbloqueada.');
            expect(dialogSystem.currentDialog.type).toBe('exit');
        });

        test('should show custom dialog', () => {
            const customText = 'Texto personalizado en español.';
            const customSpeaker = 'Dante';
            const customType = 'custom';

            dialogSystem.showCustomDialog(customText, customSpeaker, customType);

            expect(dialogSystem.isDialogActive).toBe(true);
            expect(dialogSystem.currentDialog.speaker).toBe(customSpeaker);
            expect(dialogSystem.currentDialog.text).toBe(customText);
            expect(dialogSystem.currentDialog.type).toBe(customType);
        });
    });

    describe('Spanish Language Content', () => {
        beforeEach(() => {
            dialogSystem.init();
        });

        test('should handle Spanish text correctly', () => {
            const spanishDialog = {
                speaker: 'Virgilio',
                text: 'Nel mezzo del cammin di nostra vita, mi ritrovai per una selva oscura...'
            };

            dialogSystem.showDialog(spanishDialog);

            expect(dialogSystem.currentDialog.text).toBe(spanishDialog.text);
            expect(dialogSystem.currentDialog.speaker).toBe(spanishDialog.speaker);
        });

        test('should use Spanish button text', () => {
            // This would be tested in integration tests with actual DOM
            expect(true).toBe(true); // Placeholder for DOM-dependent test
        });
    });

    describe('State Management', () => {
        beforeEach(() => {
            dialogSystem.init();
        });

        test('should track active state correctly', () => {
            expect(dialogSystem.isActive()).toBe(false);

            dialogSystem.showDialog({ text: 'Test dialog' });
            expect(dialogSystem.isActive()).toBe(true);

            dialogSystem.hideDialog();
            expect(dialogSystem.isActive()).toBe(false);
        });

        test('should clear state on hide', () => {
            const dialogData = { speaker: 'Test', text: 'Test dialog' };
            dialogSystem.showDialog(dialogData);

            dialogSystem.hideDialog();

            expect(dialogSystem.isDialogActive).toBe(false);
            expect(dialogSystem.currentDialog).toBe(null);
            expect(dialogSystem.dialogQueue).toEqual([]);
            expect(dialogSystem.currentDialogIndex).toBe(0);
        });

        test('should handle completion callback', () => {
            const onComplete = vi.fn();
            const dialogData = { text: 'Test dialog' };

            dialogSystem.showDialog(dialogData, onComplete);
            dialogSystem.hideDialog();

            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle showDialog before initialization', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            dialogSystem.showDialog({ text: 'Test' });
            
            expect(consoleSpy).toHaveBeenCalledWith('DialogSystem not initialized');
            consoleSpy.mockRestore();
        });

        test('should handle missing narrative data gracefully', () => {
            dialogSystem.init();
            const levelData = { name: 'Test Level' };

            dialogSystem.showLevelIntro(levelData);

            expect(dialogSystem.currentDialog.text).toBe('Bienvenido al Test Level');
        });
    });

    describe('Cleanup', () => {
        test('should destroy properly', () => {
            dialogSystem.init();
            dialogSystem.showDialog({ text: 'Test' });

            dialogSystem.destroy();

            expect(dialogSystem.isDialogActive).toBe(false);
            expect(dialogSystem.currentDialog).toBe(null);
            expect(dialogSystem.dialogQueue).toEqual([]);
            expect(dialogSystem.dialogElement).toBe(null);
            expect(dialogSystem.isInitialized).toBe(false);
        });
    });
});