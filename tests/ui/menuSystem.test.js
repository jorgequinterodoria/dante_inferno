/**
 * Tests for MenuSystem UI component
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MenuSystem } from '../../js/ui/menuSystem.js';

// Mock DOM elements
const mockElements = {
    gameMenu: { 
        style: { display: 'none' },
        querySelector: vi.fn(),
        appendChild: vi.fn()
    },
    newGameBtn: { 
        addEventListener: vi.fn(),
        focus: vi.fn(),
        disabled: false,
        style: {}
    },
    continueBtn: { 
        addEventListener: vi.fn(),
        focus: vi.fn(),
        disabled: false,
        style: {}
    },
    settingsBtn: { 
        addEventListener: vi.fn(),
        focus: vi.fn()
    },
    resetBtn: { 
        addEventListener: vi.fn(),
        focus: vi.fn()
    }
};

// Mock settings elements
const mockSettingsElements = {
    volumeSlider: {
        value: '70',
        addEventListener: vi.fn(),
        focus: vi.fn()
    },
    volumeValue: {
        textContent: '70%'
    },
    backBtn: {
        addEventListener: vi.fn()
    }
};

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
};

// Mock document
global.document = {
    getElementById: vi.fn((id) => {
        const elementMap = {
            'gameMenu': mockElements.gameMenu,
            'newGameBtn': mockElements.newGameBtn,
            'continueBtn': mockElements.continueBtn,
            'settingsBtn': mockElements.settingsBtn,
            'resetBtn': mockElements.resetBtn
        };
        return elementMap[id] || null;
    }),
    createElement: vi.fn(() => ({
        className: '',
        innerHTML: '',
        style: { cssText: '', display: 'none' },
        querySelector: vi.fn((selector) => {
            if (selector === '#volumeSlider') return mockSettingsElements.volumeSlider;
            if (selector === '#volumeValue') return mockSettingsElements.volumeValue;
            if (selector === '#backToMainBtn') return mockSettingsElements.backBtn;
            if (selector === '.message-content') return { style: {} };
            return null;
        }),
        addEventListener: vi.fn(),
        querySelectorAll: vi.fn(() => [])
    })),
    addEventListener: vi.fn(),
    activeElement: null,
    body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
    }
};

// Mock localStorage
global.localStorage = mockLocalStorage;

// Mock window.confirm
global.confirm = vi.fn();

// Mock setTimeout
global.setTimeout = vi.fn((callback, delay) => {
    callback();
    return 1;
});

describe('MenuSystem', () => {
    let menuSystem;
    let mockGameEngine;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();
        
        // Reset mock elements
        mockElements.gameMenu.style.display = 'none';
        mockElements.continueBtn.disabled = false;
        mockElements.continueBtn.style = {};
        
        // Mock main menu content
        mockElements.gameMenu.querySelector.mockImplementation((selector) => {
            if (selector === '.menu-content:not(.settings-menu)') {
                return { style: { display: 'block' } };
            }
            if (selector === '.menu-content') {
                return { style: { display: 'block' } };
            }
            return null;
        });

        // Create mock game engine
        mockGameEngine = {
            startNewGame: vi.fn(),
            loadState: vi.fn(),
            audioManager: {
                setVolume: vi.fn()
            }
        };

        menuSystem = new MenuSystem(mockGameEngine);
    });

    describe('Initialization', () => {
        test('should initialize with DOM elements', () => {
            expect(menuSystem.menuElement).toBe(mockElements.gameMenu);
            expect(menuSystem.newGameBtn).toBe(mockElements.newGameBtn);
            expect(menuSystem.continueBtn).toBe(mockElements.continueBtn);
            expect(menuSystem.settingsBtn).toBe(mockElements.settingsBtn);
            expect(menuSystem.resetBtn).toBe(mockElements.resetBtn);
        });

        test('should initialize with default state', () => {
            expect(menuSystem.isMenuVisible).toBe(false);
            expect(menuSystem.currentMenu).toBe('main');
            expect(menuSystem.gameEngine).toBe(mockGameEngine);
        });

        test('should create settings menu on init', () => {
            menuSystem.init();
            
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockElements.gameMenu.appendChild).toHaveBeenCalled();
        });
    });

    describe('Menu Visibility', () => {
        test('should show menu', () => {
            menuSystem.showMenu();
            
            expect(mockElements.gameMenu.style.display).toBe('flex');
            expect(menuSystem.isMenuVisible).toBe(true);
        });

        test('should hide menu', () => {
            menuSystem.showMenu();
            menuSystem.hideMenu();
            
            expect(mockElements.gameMenu.style.display).toBe('none');
            expect(menuSystem.isMenuVisible).toBe(false);
        });

        test('should focus first button when showing menu', () => {
            menuSystem.showMenu();
            
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
        });
    });

    describe('Menu Navigation', () => {
        beforeEach(() => {
            menuSystem.init();
        });

        test('should bind event listeners on init', () => {
            expect(mockElements.newGameBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.continueBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.settingsBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements.resetBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        test('should handle new game action', () => {
            const callback = vi.fn();
            menuSystem.setCallbacks({ onNewGame: callback });
            
            menuSystem.handleNewGame();
            
            expect(callback).toHaveBeenCalled();
            expect(menuSystem.isMenuVisible).toBe(false);
        });

        test('should handle continue game when save exists', () => {
            mockLocalStorage.getItem.mockReturnValue('{"level": 1}');
            const callback = vi.fn();
            menuSystem.setCallbacks({ onContinueGame: callback });
            
            menuSystem.handleContinueGame();
            
            expect(callback).toHaveBeenCalled();
            expect(menuSystem.isMenuVisible).toBe(false);
        });

        test('should show message when no save exists for continue', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            const showMessageSpy = vi.spyOn(menuSystem, 'showMessage').mockImplementation(() => {});
            
            menuSystem.handleContinueGame();
            
            expect(showMessageSpy).toHaveBeenCalledWith('No hay partida guardada disponible');
        });
    });

    describe('Settings Menu', () => {
        beforeEach(() => {
            menuSystem.init();
            // Mock settings elements
            menuSystem.volumeSlider = mockSettingsElements.volumeSlider;
            menuSystem.volumeValue = mockSettingsElements.volumeValue;
            menuSystem.settingsMenu = { 
                style: { display: 'none' },
                querySelector: vi.fn(() => menuSystem.volumeSlider),
                querySelectorAll: vi.fn(() => [mockSettingsElements.volumeSlider, mockSettingsElements.backBtn])
            };
        });

        test('should show settings menu', () => {
            const mainMenu = { style: { display: 'block' } };
            mockElements.gameMenu.querySelector.mockReturnValue(mainMenu);
            
            menuSystem.showSettingsMenu();
            
            expect(menuSystem.currentMenu).toBe('settings');
            expect(mainMenu.style.display).toBe('none');
            expect(menuSystem.settingsMenu.style.display).toBe('block');
        });

        test('should handle volume change', () => {
            const event = { target: { value: '80' } };
            
            menuSystem.handleVolumeChange(event);
            
            expect(menuSystem.volumeValue.textContent).toBe('80%');
            expect(mockGameEngine.audioManager.setVolume).toHaveBeenCalledWith(0.8);
        });

        test('should trigger settings callback on volume change', () => {
            const callback = vi.fn();
            menuSystem.setCallbacks({ onSettingsChange: callback });
            const event = { target: { value: '60' } };
            
            menuSystem.handleVolumeChange(event);
            
            expect(callback).toHaveBeenCalledWith({
                type: 'volume',
                value: 0.6
            });
        });
    });

    describe('Game Reset', () => {
        test('should show confirmation dialog for reset', () => {
            global.confirm.mockReturnValue(false);
            const resetSpy = vi.spyOn(menuSystem, 'resetGame').mockImplementation(() => {});
            
            menuSystem.handleResetGame();
            
            expect(global.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres reiniciar desde cero? Se perderá todo el progreso guardado.');
            expect(resetSpy).not.toHaveBeenCalled();
        });

        test('should reset game when confirmed', () => {
            global.confirm.mockReturnValue(true);
            const resetSpy = vi.spyOn(menuSystem, 'resetGame').mockImplementation(() => {});
            
            menuSystem.handleResetGame();
            
            expect(resetSpy).toHaveBeenCalled();
        });
    });

    describe('Continue Button State', () => {
        test('should enable continue button when save exists', () => {
            mockLocalStorage.getItem.mockReturnValue('{"level": 1}');
            
            menuSystem.updateContinueButton();
            
            expect(mockElements.continueBtn.disabled).toBe(false);
            expect(mockElements.continueBtn.style.opacity).toBe('1');
            expect(mockElements.continueBtn.style.cursor).toBe('pointer');
        });

        test('should disable continue button when no save exists', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            
            menuSystem.updateContinueButton();
            
            expect(mockElements.continueBtn.disabled).toBe(true);
            expect(mockElements.continueBtn.style.opacity).toBe('0.5');
            expect(mockElements.continueBtn.style.cursor).toBe('not-allowed');
        });
    });

    describe('Spanish Interface', () => {
        test('should use Spanish text in confirmation dialog', () => {
            global.confirm.mockReturnValue(false);
            
            menuSystem.handleResetGame();
            
            expect(global.confirm).toHaveBeenCalledWith(
                expect.stringContaining('¿Estás seguro de que quieres reiniciar desde cero?')
            );
        });

        test('should show Spanish error messages', () => {
            const showMessageSpy = vi.spyOn(menuSystem, 'showMessage').mockImplementation(() => {});
            mockLocalStorage.getItem.mockReturnValue(null);
            
            menuSystem.handleContinueGame();
            
            expect(showMessageSpy).toHaveBeenCalledWith('No hay partida guardada disponible');
        });

        test('should create settings menu with Spanish labels', () => {
            menuSystem.createSettingsMenu();
            
            const createdElement = document.createElement.mock.results[0].value;
            expect(createdElement.innerHTML).toContain('Configuración');
            expect(createdElement.innerHTML).toContain('Volumen:');
            expect(createdElement.innerHTML).toContain('Volver al Menú');
        });
    });

    describe('Volume Control', () => {
        beforeEach(() => {
            menuSystem.volumeSlider = mockSettingsElements.volumeSlider;
            menuSystem.volumeValue = mockSettingsElements.volumeValue;
        });

        test('should get current volume', () => {
            const volume = menuSystem.getVolume();
            expect(volume).toBe(0.7);
        });

        test('should set volume', () => {
            menuSystem.setVolume(0.5);
            
            expect(menuSystem.volumeSlider.value).toBe(50);
            expect(menuSystem.volumeValue.textContent).toBe('50%');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing DOM elements gracefully', () => {
            global.document.getElementById = vi.fn(() => null);
            
            expect(() => {
                const menuWithMissingElements = new MenuSystem();
                menuWithMissingElements.init();
            }).not.toThrow();
        });

        test('should handle errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const showMessageSpy = vi.spyOn(menuSystem, 'showMessage').mockImplementation(() => {});
            
            menuSystem.handleError(new Error('Test error'), 'TestContext');
            
            expect(consoleSpy).toHaveBeenCalledWith('TestContext error:', expect.any(Error));
            expect(showMessageSpy).toHaveBeenCalledWith('Ha ocurrido un error. Por favor, recarga la página.');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Message Display', () => {
        test('should show temporary message', () => {
            menuSystem.showMessage('Test message', 1000);
            
            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(document.body.appendChild).toHaveBeenCalled();
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
        });
    });
});