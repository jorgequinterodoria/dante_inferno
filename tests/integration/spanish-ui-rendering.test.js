/**
 * Spanish UI Rendering and Responsiveness Tests
 * Tests Spanish text rendering and UI responsiveness according to requirements 5.1-5.4
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProgressPanel } from '../../js/ui/progressPanel.js';
import { MenuSystem } from '../../js/ui/menuSystem.js';
import { DialogSystem } from '../../js/ui/dialogSystem.js';
import { NarrativeManager } from '../../js/game/narrativeManager.js';

// Mock DOM elements with proper Spanish text handling
const createMockElement = () => ({
    innerHTML: '',
    textContent: '',
    style: {},
    classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false)
    },
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(() => null)
});

const mockProgressContainer = createMockElement();
const mockMenuContainer = createMockElement();
const mockDialogContainer = createMockElement();

describe('Spanish UI Rendering and Responsiveness', () => {
    let progressPanel;
    let menuSystem;
    let dialogSystem;
    let narrativeManager;

    beforeEach(() => {
        // Mock document methods
        global.document = {
            getElementById: vi.fn((id) => {
                if (id === 'progressPanel') return mockProgressContainer;
                if (id === 'menuContainer') return mockMenuContainer;
                if (id === 'dialogContainer') return mockDialogContainer;
                return createMockElement();
            }),
            createElement: vi.fn(() => createMockElement()),
            createTextNode: vi.fn((text) => ({ textContent: text }))
        };

        // Reset mock elements
        mockProgressContainer.innerHTML = '';
        mockMenuContainer.innerHTML = '';
        mockDialogContainer.innerHTML = '';

        // Initialize UI components
        progressPanel = new ProgressPanel('progressPanel');
        menuSystem = new MenuSystem('menuContainer');
        dialogSystem = new DialogSystem('dialogContainer');
        narrativeManager = new NarrativeManager();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Progress Panel Spanish Text - Requirements 6.1-6.5', () => {
        test('should display Virgilio status in Spanish', () => {
            progressPanel.updateVirgilio(false);
            expect(mockProgressContainer.innerHTML).toContain('Virgilio: Pendiente');

            progressPanel.updateVirgilio(true);
            expect(mockProgressContainer.innerHTML).toContain('Virgilio: Encontrado');
        });

        test('should display fragment counter in Spanish format', () => {
            progressPanel.updateFragments(0, 3);
            expect(mockProgressContainer.innerHTML).toContain('Fragmentos: 0/3');

            progressPanel.updateFragments(2, 3);
            expect(mockProgressContainer.innerHTML).toContain('Fragmentos: 2/3');

            progressPanel.updateFragments(3, 3);
            expect(mockProgressContainer.innerHTML).toContain('Fragmentos: 3/3');
        });

        test('should display exit status in Spanish', () => {
            progressPanel.updateExit(false);
            expect(mockProgressContainer.innerHTML).toContain('Salida: Bloqueada');

            progressPanel.updateExit(true);
            expect(mockProgressContainer.innerHTML).toContain('Salida: Desbloqueada');
        });

        test('should handle special Spanish characters correctly', () => {
            // Test with accented characters
            progressPanel.updateLevel(1, 'Círculo de los Lujuriosos');
            expect(mockProgressContainer.innerHTML).toContain('Círculo');
            expect(mockProgressContainer.innerHTML).toContain('Lujuriosos');
        });

        test('should maintain consistent Spanish terminology', () => {
            progressPanel.render();
            
            // Check for consistent use of Spanish terms
            const spanishTerms = [
                'Nivel',
                'Virgilio',
                'Fragmentos',
                'Salida',
                'Objetivos'
            ];

            spanishTerms.forEach(term => {
                expect(mockProgressContainer.innerHTML).toContain(term);
            });
        });

        test('should handle long Spanish text without overflow', () => {
            const longLevelName = 'El Círculo de los Condenados por la Traición Eterna';
            progressPanel.updateLevel(9, longLevelName);
            
            // Verify text is handled properly (no truncation errors)
            expect(mockProgressContainer.innerHTML).toContain(longLevelName);
        });
    });

    describe('Menu System Spanish Interface - Requirements 5.1-5.4', () => {
        test('should display main menu options in Spanish', () => {
            menuSystem.showMainMenu();
            
            const expectedMenuItems = [
                'Nuevo Juego',
                'Continuar',
                'Configuración',
                'Acerca de'
            ];

            expectedMenuItems.forEach(item => {
                expect(mockMenuContainer.innerHTML).toContain(item);
            });
        });

        test('should display settings menu in Spanish', () => {
            menuSystem.showSettingsMenu();
            
            const expectedSettings = [
                'Volumen',
                'Dificultad',
                'Reiniciar desde cero',
                'Volver'
            ];

            expectedSettings.forEach(setting => {
                expect(mockMenuContainer.innerHTML).toContain(setting);
            });
        });

        test('should show confirmation dialogs in Spanish', () => {
            menuSystem.showResetConfirmation();
            
            expect(mockMenuContainer.innerHTML).toContain('¿Estás seguro?');
            expect(mockMenuContainer.innerHTML).toContain('Se perderá todo el progreso');
            expect(mockMenuContainer.innerHTML).toContain('Confirmar');
            expect(mockMenuContainer.innerHTML).toContain('Cancelar');
        });

        test('should handle Spanish button text with proper encoding', () => {
            menuSystem.showMainMenu();
            
            // Test special characters in button text
            expect(mockMenuContainer.innerHTML).toContain('Configuración');
            expect(mockMenuContainer.innerHTML).not.toContain('Configuraci&oacute;n'); // Should use proper UTF-8
        });

        test('should display help text in Spanish', () => {
            menuSystem.showHelpMenu();
            
            const expectedHelpText = [
                'Instrucciones',
                'Usa WASD o las flechas para moverte',
                'Encuentra a Virgilio',
                'Recoge todos los fragmentos',
                'Llega a la salida'
            ];

            expectedHelpText.forEach(text => {
                expect(mockMenuContainer.innerHTML).toContain(text);
            });
        });
    });

    describe('Dialog System Spanish Narrative - Requirements 5.1-5.3', () => {
        test('should display narrative text in Spanish', () => {
            const spanishNarrative = 'En el medio del camino de nuestra vida, me encontré en una selva oscura...';
            
            dialogSystem.showDialog(spanishNarrative);
            
            expect(mockDialogContainer.innerHTML).toContain(spanishNarrative);
        });

        test('should handle Virgilio dialogue in Spanish', () => {
            const virgilioDialogue = 'Yo soy Virgilio, el poeta que te guiará a través de los círculos del infierno.';
            
            dialogSystem.showDialog(virgilioDialogue, 'Virgilio');
            
            expect(mockDialogContainer.innerHTML).toContain(virgilioDialogue);
            expect(mockDialogContainer.innerHTML).toContain('Virgilio');
        });

        test('should display level introductions in Spanish', () => {
            const levelIntro = narrativeManager.getLevelIntroduction(1);
            
            dialogSystem.showDialog(levelIntro);
            
            // Should contain Spanish narrative elements
            expect(mockDialogContainer.innerHTML).toContain('bosque');
            expect(mockDialogContainer.innerHTML).toContain('perdido');
        });

        test('should handle dialog controls in Spanish', () => {
            dialogSystem.showDialog('Test dialogue', 'Speaker');
            
            expect(mockDialogContainer.innerHTML).toContain('Continuar');
            expect(mockDialogContainer.innerHTML).toContain('Cerrar');
        });

        test('should properly format Spanish punctuation', () => {
            const questionText = '¿Estás listo para comenzar tu viaje?';
            const exclamationText = '¡Bienvenido al Infierno de Dante!';
            
            dialogSystem.showDialog(questionText);
            expect(mockDialogContainer.innerHTML).toContain('¿');
            expect(mockDialogContainer.innerHTML).toContain('?');
            
            dialogSystem.showDialog(exclamationText);
            expect(mockDialogContainer.innerHTML).toContain('¡');
            expect(mockDialogContainer.innerHTML).toContain('!');
        });
    });

    describe('UI Responsiveness and Layout', () => {
        test('should handle different screen sizes with Spanish text', () => {
            // Mock different viewport sizes
            const viewports = [
                { width: 320, height: 568 },  // Mobile
                { width: 768, height: 1024 }, // Tablet
                { width: 1920, height: 1080 } // Desktop
            ];

            viewports.forEach(viewport => {
                // Mock window dimensions
                global.window = {
                    innerWidth: viewport.width,
                    innerHeight: viewport.height
                };

                progressPanel.render();
                menuSystem.showMainMenu();

                // Text should still be readable and properly formatted
                expect(mockProgressContainer.innerHTML).toContain('Virgilio');
                expect(mockMenuContainer.innerHTML).toContain('Nuevo Juego');
            });
        });

        test('should handle text wrapping for long Spanish phrases', () => {
            const longText = 'Este es un texto muy largo en español que debería manejarse correctamente sin causar problemas de diseño';
            
            dialogSystem.showDialog(longText);
            
            // Should contain the full text without truncation
            expect(mockDialogContainer.innerHTML).toContain(longText);
        });

        test('should maintain proper spacing with Spanish text', () => {
            progressPanel.updateVirgilio(true);
            progressPanel.updateFragments(2, 3);
            progressPanel.updateExit(false);
            
            // Should have proper spacing between elements
            const content = mockProgressContainer.innerHTML;
            expect(content).toMatch(/Virgilio:\s+Encontrado/);
            expect(content).toMatch(/Fragmentos:\s+2\/3/);
            expect(content).toMatch(/Salida:\s+Bloqueada/);
        });
    });

    describe('Error Messages in Spanish - Requirement 5.4', () => {
        test('should display save errors in Spanish', () => {
            const errorMessage = 'Error al guardar el juego. Inténtalo de nuevo.';
            
            // Mock error display
            menuSystem.showError(errorMessage);
            
            expect(mockMenuContainer.innerHTML).toContain(errorMessage);
        });

        test('should display load errors in Spanish', () => {
            const errorMessage = 'No se pudo cargar el juego guardado.';
            
            menuSystem.showError(errorMessage);
            
            expect(mockMenuContainer.innerHTML).toContain(errorMessage);
        });

        test('should display validation errors in Spanish', () => {
            const validationErrors = [
                'Datos de guardado corruptos',
                'Versión incompatible',
                'Archivo no encontrado'
            ];

            validationErrors.forEach(error => {
                menuSystem.showError(error);
                expect(mockMenuContainer.innerHTML).toContain(error);
            });
        });
    });

    describe('Accessibility with Spanish Content', () => {
        test('should provide proper ARIA labels in Spanish', () => {
            progressPanel.render();
            
            // Check for Spanish ARIA labels
            expect(mockProgressContainer.setAttribute).toHaveBeenCalledWith(
                'aria-label',
                expect.stringContaining('Panel de progreso')
            );
        });

        test('should handle keyboard navigation with Spanish interface', () => {
            menuSystem.showMainMenu();
            
            // Should have proper tabindex and focus handling
            expect(mockMenuContainer.innerHTML).toContain('tabindex');
        });

        test('should provide Spanish tooltips and help text', () => {
            progressPanel.render();
            
            // Should have Spanish tooltips
            expect(mockProgressContainer.innerHTML).toContain('title=');
            expect(mockProgressContainer.innerHTML).toContain('Ayuda');
        });
    });

    describe('Text Encoding and Character Support', () => {
        test('should properly handle Spanish accented characters', () => {
            const accentedText = 'Configuración, Círculo, Descripción, Información';
            
            dialogSystem.showDialog(accentedText);
            
            expect(mockDialogContainer.innerHTML).toContain('ó');
            expect(mockDialogContainer.innerHTML).toContain('í');
        });

        test('should handle Spanish special punctuation', () => {
            const specialPunctuation = '¿Cómo estás? ¡Muy bien!';
            
            dialogSystem.showDialog(specialPunctuation);
            
            expect(mockDialogContainer.innerHTML).toContain('¿');
            expect(mockDialogContainer.innerHTML).toContain('¡');
        });

        test('should maintain proper text encoding throughout UI updates', () => {
            // Test multiple updates with Spanish text
            progressPanel.updateVirgilio(false);
            progressPanel.updateFragments(1, 3);
            progressPanel.updateExit(false);
            
            progressPanel.updateVirgilio(true);
            progressPanel.updateFragments(3, 3);
            progressPanel.updateExit(true);
            
            // Should maintain proper encoding after updates
            expect(mockProgressContainer.innerHTML).toContain('Virgilio');
            expect(mockProgressContainer.innerHTML).toContain('Fragmentos');
            expect(mockProgressContainer.innerHTML).toContain('Desbloqueada');
        });
    });

    describe('Dynamic Content Updates in Spanish', () => {
        test('should update progress text dynamically in Spanish', () => {
            // Initial state
            progressPanel.updateVirgilio(false);
            expect(mockProgressContainer.innerHTML).toContain('Pendiente');
            
            // Update state
            progressPanel.updateVirgilio(true);
            expect(mockProgressContainer.innerHTML).toContain('Encontrado');
            expect(mockProgressContainer.innerHTML).not.toContain('Pendiente');
        });

        test('should handle rapid UI updates with Spanish text', () => {
            // Simulate rapid updates
            for (let i = 0; i <= 3; i++) {
                progressPanel.updateFragments(i, 3);
                expect(mockProgressContainer.innerHTML).toContain(`Fragmentos: ${i}/3`);
            }
        });

        test('should maintain Spanish text consistency during state changes', () => {
            const states = [
                { virgilio: false, fragments: 0, exit: false },
                { virgilio: true, fragments: 1, exit: false },
                { virgilio: true, fragments: 2, exit: false },
                { virgilio: true, fragments: 3, exit: true }
            ];

            states.forEach(state => {
                progressPanel.updateVirgilio(state.virgilio);
                progressPanel.updateFragments(state.fragments, 3);
                progressPanel.updateExit(state.exit);
                
                // Should always contain Spanish terms
                expect(mockProgressContainer.innerHTML).toContain('Virgilio:');
                expect(mockProgressContainer.innerHTML).toContain('Fragmentos:');
                expect(mockProgressContainer.innerHTML).toContain('Salida:');
            });
        });
    });
});