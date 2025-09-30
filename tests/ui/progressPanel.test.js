/**
 * Tests for ProgressPanel UI component
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ProgressPanel } from '../../js/ui/progressPanel.js';

// Mock DOM elements
const mockElements = {
    virgilioStatus: { 
        textContent: '', 
        className: '',
        style: {
            transition: '',
            transform: '',
            textShadow: ''
        }
    },
    fragmentStatus: { 
        textContent: '', 
        style: { 
            color: '',
            transition: '',
            transform: '',
            textShadow: ''
        } 
    },
    exitStatus: { 
        textContent: '', 
        className: '',
        style: {
            transition: '',
            transform: '',
            textShadow: ''
        }
    },
    currentLevel: { textContent: '' },
    levelName: { textContent: '' }
};

// Mock document.getElementById
global.document = {
    getElementById: vi.fn((id) => {
        const elementMap = {
            'virgilioStatus': mockElements.virgilioStatus,
            'fragmentStatus': mockElements.fragmentStatus,
            'exitStatus': mockElements.exitStatus,
            'currentLevel': mockElements.currentLevel,
            'levelName': mockElements.levelName
        };
        return elementMap[id] || null;
    })
};

describe('ProgressPanel', () => {
    let progressPanel;

    beforeEach(() => {
        // Reset mock elements
        Object.values(mockElements).forEach(element => {
            element.textContent = '';
            if (element.className !== undefined) {
                element.className = '';
            }
            if (element.style) {
                Object.keys(element.style).forEach(key => {
                    element.style[key] = '';
                });
            }
        });

        // Ensure the mock is properly set up before creating ProgressPanel
        global.document.getElementById = vi.fn((id) => {
            const elementMap = {
                'virgilioStatus': mockElements.virgilioStatus,
                'fragmentStatus': mockElements.fragmentStatus,
                'exitStatus': mockElements.exitStatus,
                'currentLevel': mockElements.currentLevel,
                'levelName': mockElements.levelName
            };
            return elementMap[id] || null;
        });

        progressPanel = new ProgressPanel();
    });

    describe('Initialization', () => {
        test('should initialize with DOM elements', () => {
            expect(progressPanel.virgilioStatusElement).toBe(mockElements.virgilioStatus);
            expect(progressPanel.fragmentStatusElement).toBe(mockElements.fragmentStatus);
            expect(progressPanel.exitStatusElement).toBe(mockElements.exitStatus);
            expect(progressPanel.currentLevelElement).toBe(mockElements.currentLevel);
            expect(progressPanel.levelNameElement).toBe(mockElements.levelName);
        });

        test('should initialize with default state', () => {
            progressPanel.init();
            
            expect(mockElements.virgilioStatus.textContent).toBe('Pendiente');
            expect(mockElements.virgilioStatus.className).toBe('status-pendiente');
            expect(mockElements.fragmentStatus.textContent).toBe('0/3');
            expect(mockElements.exitStatus.textContent).toBe('Bloqueada');
            expect(mockElements.exitStatus.className).toBe('status-bloqueada');
            expect(mockElements.currentLevel.textContent).toBe('1');
            expect(mockElements.levelName.textContent).toBe('Bosque Oscuro');
        });
    });

    describe('Virgilio Status Updates', () => {
        test('should update Virgilio status to found', () => {
            progressPanel.updateVirgilio(true);
            
            expect(mockElements.virgilioStatus.textContent).toBe('Encontrado');
            expect(mockElements.virgilioStatus.className).toBe('status-encontrado');
        });

        test('should update Virgilio status to pending', () => {
            progressPanel.updateVirgilio(false);
            
            expect(mockElements.virgilioStatus.textContent).toBe('Pendiente');
            expect(mockElements.virgilioStatus.className).toBe('status-pendiente');
        });

        test('should not update DOM if status unchanged', () => {
            progressPanel.updateVirgilio(false);
            const initialText = mockElements.virgilioStatus.textContent;
            
            progressPanel.updateVirgilio(false);
            
            expect(mockElements.virgilioStatus.textContent).toBe(initialText);
        });
    });

    describe('Fragment Counter Updates', () => {
        test('should update fragment counter in X/3 format', () => {
            progressPanel.updateFragments(2, 3);
            
            expect(mockElements.fragmentStatus.textContent).toBe('2/3');
        });

        test('should handle different total fragment counts', () => {
            progressPanel.updateFragments(1, 5);
            
            expect(mockElements.fragmentStatus.textContent).toBe('1/5');
        });

        test('should change color when all fragments collected', () => {
            progressPanel.updateFragments(3, 3);
            
            expect(mockElements.fragmentStatus.textContent).toBe('3/3');
            expect(mockElements.fragmentStatus.style.color).toBe('#51cf66');
        });

        test('should use white color when fragments incomplete', () => {
            progressPanel.updateFragments(1, 3);
            
            expect(mockElements.fragmentStatus.style.color).toBe('#ffffff');
        });

        test('should validate input parameters', () => {
            progressPanel.updateFragments(-1, 3);
            expect(mockElements.fragmentStatus.textContent).toBe('0/3');
            
            progressPanel.updateFragments(5, 3);
            expect(mockElements.fragmentStatus.textContent).toBe('3/3');
        });
    });

    describe('Exit Status Updates', () => {
        test('should update exit status to unlocked', () => {
            progressPanel.updateExit(true);
            
            expect(mockElements.exitStatus.textContent).toBe('Desbloqueada');
            expect(mockElements.exitStatus.className).toBe('status-desbloqueada');
        });

        test('should update exit status to locked', () => {
            progressPanel.updateExit(false);
            
            expect(mockElements.exitStatus.textContent).toBe('Bloqueada');
            expect(mockElements.exitStatus.className).toBe('status-bloqueada');
        });
    });

    describe('Level Information Updates', () => {
        test('should update level number and name', () => {
            progressPanel.updateLevel(2, 'Limbo');
            
            expect(mockElements.currentLevel.textContent).toBe('2');
            expect(mockElements.levelName.textContent).toBe('Limbo');
        });

        test('should validate level number', () => {
            progressPanel.updateLevel(0, 'Invalid');
            
            expect(mockElements.currentLevel.textContent).toBe('1');
        });

        test('should provide default level name if not provided', () => {
            progressPanel.updateLevel(3);
            
            expect(mockElements.levelName.textContent).toBe('Círculo 3');
        });
    });

    describe('Bulk Updates', () => {
        test('should update all progress information at once', () => {
            const progressData = {
                virgilioFound: true,
                fragmentsCollected: 2,
                totalFragments: 3,
                exitUnlocked: false,
                currentLevel: 2,
                levelName: 'Limbo'
            };

            progressPanel.updateAll(progressData);

            expect(mockElements.virgilioStatus.textContent).toBe('Encontrado');
            expect(mockElements.fragmentStatus.textContent).toBe('2/3');
            expect(mockElements.exitStatus.textContent).toBe('Bloqueada');
            expect(mockElements.currentLevel.textContent).toBe('2');
            expect(mockElements.levelName.textContent).toBe('Limbo');
        });

        test('should handle partial progress data', () => {
            const progressData = {
                virgilioFound: true,
                fragmentsCollected: 1
            };

            progressPanel.updateAll(progressData);

            expect(mockElements.virgilioStatus.textContent).toBe('Encontrado');
            expect(mockElements.fragmentStatus.textContent).toBe('1/3');
        });

        test('should handle null or undefined progress data', () => {
            expect(() => {
                progressPanel.updateAll(null);
                progressPanel.updateAll(undefined);
            }).not.toThrow();
        });
    });

    describe('State Management', () => {
        test('should return current state', () => {
            progressPanel.updateVirgilio(true);
            progressPanel.updateFragments(2, 3);
            progressPanel.updateExit(false);
            progressPanel.updateLevel(2, 'Limbo');

            const state = progressPanel.getCurrentState();

            expect(state).toEqual({
                virgilioFound: true,
                fragmentsCollected: 2,
                totalFragments: 3,
                exitUnlocked: false,
                currentLevel: 2,
                levelName: 'Limbo'
            });
        });

        test('should reset to initial state', () => {
            progressPanel.updateVirgilio(true);
            progressPanel.updateFragments(3, 3);
            progressPanel.updateExit(true);
            progressPanel.updateLevel(5, 'Avaricia');

            progressPanel.reset();

            expect(mockElements.virgilioStatus.textContent).toBe('Pendiente');
            expect(mockElements.fragmentStatus.textContent).toBe('0/3');
            expect(mockElements.exitStatus.textContent).toBe('Bloqueada');
            expect(mockElements.currentLevel.textContent).toBe('1');
            expect(mockElements.levelName.textContent).toBe('Bosque Oscuro');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            // Mock missing elements
            global.document.getElementById = vi.fn(() => null);
            
            const panelWithMissingElements = new ProgressPanel();
            
            expect(() => {
                panelWithMissingElements.updateVirgilio(true);
                panelWithMissingElements.updateFragments(1, 3);
                panelWithMissingElements.updateExit(true);
                panelWithMissingElements.updateLevel(2, 'Test');
            }).not.toThrow();
        });

        test('should handle errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            progressPanel.handleError(new Error('Test error'), 'TestContext');
            
            expect(consoleSpy).toHaveBeenCalledWith('TestContext error:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });

    describe('Visual Feedback', () => {
        test('should show completion feedback for objectives', () => {
            // Verify that the elements are properly set up
            expect(progressPanel.virgilioStatusElement).toBe(mockElements.virgilioStatus);
            expect(progressPanel.fragmentStatusElement).toBe(mockElements.fragmentStatus);
            expect(progressPanel.exitStatusElement).toBe(mockElements.exitStatus);
            
            // Mock setTimeout to capture the callback
            const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
                // Execute callback immediately for testing
                callback();
                return 1; // Return a fake timer ID
            });
            
            // Test that the method executes without errors
            expect(() => {
                progressPanel.showCompletionFeedback('virgilio');
            }).not.toThrow();
            
            // Verify setTimeout was called with correct delay
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
            
            // Test different objective types
            expect(() => {
                progressPanel.showCompletionFeedback('fragment');
                progressPanel.showCompletionFeedback('exit');
            }).not.toThrow();
            
            // Verify setTimeout was called for each objective type (3 times total)
            expect(setTimeoutSpy).toHaveBeenCalledTimes(3);
            
            setTimeoutSpy.mockRestore();
        });

        test('should handle invalid objective types for feedback', () => {
            expect(() => {
                progressPanel.showCompletionFeedback('invalid');
            }).not.toThrow();
        });
    });
});