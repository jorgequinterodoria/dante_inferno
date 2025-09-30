/**
 * Unit tests for InputManager
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '../../js/engine/inputManager.js';

// Mock DOM environment for testing
global.document = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

describe('InputManager', () => {
    let inputManager;

    beforeEach(() => {
        inputManager = new InputManager();
        // Clear mock calls
        document.addEventListener.mockClear();
        document.removeEventListener.mockClear();
    });

    afterEach(() => {
        if (inputManager) {
            inputManager.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with empty key state', () => {
            expect(inputManager.keys).toEqual({});
            expect(inputManager.inputBuffer).toEqual([]);
        });

        test('should have correct key bindings', () => {
            expect(inputManager.keyBindings['KeyW']).toBe('up');
            expect(inputManager.keyBindings['KeyA']).toBe('left');
            expect(inputManager.keyBindings['KeyS']).toBe('down');
            expect(inputManager.keyBindings['KeyD']).toBe('right');
            expect(inputManager.keyBindings['ArrowUp']).toBe('up');
            expect(inputManager.keyBindings['ArrowLeft']).toBe('left');
            expect(inputManager.keyBindings['ArrowDown']).toBe('down');
            expect(inputManager.keyBindings['ArrowRight']).toBe('right');
        });

        test('should bind event listeners on init', () => {
            inputManager.init();
            expect(document.addEventListener).toHaveBeenCalledTimes(3);
            expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
        });
    });

    describe('Key State Tracking', () => {
        test('should track key press state', () => {
            const mockEvent = { code: 'KeyW' };
            inputManager.handleKeyDown(mockEvent);
            
            expect(inputManager.keys['KeyW']).toBe(true);
            expect(inputManager.isKeyPressed('up')).toBe(true);
        });

        test('should track key release state', () => {
            // First press the key
            inputManager.handleKeyDown({ code: 'KeyW' });
            expect(inputManager.keys['KeyW']).toBe(true);
            
            // Then release it
            inputManager.handleKeyUp({ code: 'KeyW' });
            expect(inputManager.keys['KeyW']).toBe(false);
            expect(inputManager.isKeyPressed('up')).toBe(false);
        });

        test('should handle multiple keys simultaneously', () => {
            inputManager.handleKeyDown({ code: 'KeyW' });
            inputManager.handleKeyDown({ code: 'KeyA' });
            
            expect(inputManager.isKeyPressed('up')).toBe(true);
            expect(inputManager.isKeyPressed('left')).toBe(true);
            expect(inputManager.isKeyPressed('down')).toBe(false);
        });
    });

    describe('Input Validation', () => {
        test('should validate game keys correctly', () => {
            expect(inputManager.isValidGameKey('KeyW')).toBe(true);
            expect(inputManager.isValidGameKey('ArrowUp')).toBe(true);
            expect(inputManager.isValidGameKey('KeyX')).toBe(false);
            expect(inputManager.isValidGameKey('InvalidKey')).toBe(false);
        });

        test('should ignore invalid keys', () => {
            inputManager.handleKeyDown({ code: 'KeyX' });
            expect(inputManager.keys['KeyX']).toBeUndefined();
            expect(inputManager.inputBuffer).toHaveLength(0);
        });

        test('should process valid keys', () => {
            inputManager.handleKeyDown({ code: 'KeyW' });
            expect(inputManager.keys['KeyW']).toBe(true);
            expect(inputManager.inputBuffer).toHaveLength(1);
        });
    });

    describe('Input Buffering', () => {
        test('should add events to input buffer', () => {
            inputManager.handleKeyDown({ code: 'KeyW' });
            
            expect(inputManager.inputBuffer).toHaveLength(1);
            expect(inputManager.inputBuffer[0]).toMatchObject({
                type: 'keydown',
                keyCode: 'KeyW',
                action: 'up'
            });
        });

        test('should maintain buffer size limit', () => {
            // Add more events than buffer limit
            for (let i = 0; i < 15; i++) {
                inputManager.handleKeyDown({ code: 'KeyW' });
            }
            
            expect(inputManager.inputBuffer.length).toBeLessThanOrEqual(inputManager.bufferMaxSize);
        });

        test('should clear buffer when requested', () => {
            inputManager.handleKeyDown({ code: 'KeyW' });
            expect(inputManager.inputBuffer).toHaveLength(1);
            
            const buffer = inputManager.getInputBuffer();
            expect(buffer).toHaveLength(1);
            expect(inputManager.inputBuffer).toHaveLength(0);
        });
    });

    describe('Input State Retrieval', () => {
        test('should return current input state', () => {
            inputManager.handleKeyDown({ code: 'KeyW' });
            inputManager.handleKeyDown({ code: 'KeyA' });
            
            const inputState = inputManager.getInputState();
            expect(inputState.up).toBe(true);
            expect(inputState.left).toBe(true);
            expect(inputState.down).toBeUndefined();
        });

        test('should return movement direction', () => {
            expect(inputManager.getMovementDirection()).toBeNull();
            
            inputManager.handleKeyDown({ code: 'KeyW' });
            expect(inputManager.getMovementDirection()).toBe('up');
            
            inputManager.handleKeyUp({ code: 'KeyW' });
            inputManager.handleKeyDown({ code: 'ArrowLeft' });
            expect(inputManager.getMovementDirection()).toBe('left');
        });
    });

    describe('Cleanup', () => {
        test('should clear input state', () => {
            inputManager.handleKeyDown({ code: 'KeyW' });
            expect(inputManager.keys['KeyW']).toBe(true);
            
            inputManager.clearInput();
            expect(inputManager.keys).toEqual({});
            expect(inputManager.inputBuffer).toEqual([]);
        });

        test('should remove event listeners on destroy', () => {
            inputManager.destroy();
            expect(document.removeEventListener).toHaveBeenCalledWith('keydown', inputManager.handleKeyDown);
            expect(document.removeEventListener).toHaveBeenCalledWith('keyup', inputManager.handleKeyUp);
        });
    });

    describe('Arrow Keys Support', () => {
        test('should handle arrow keys same as WASD', () => {
            inputManager.handleKeyDown({ code: 'ArrowUp' });
            expect(inputManager.isKeyPressed('up')).toBe(true);
            
            inputManager.handleKeyDown({ code: 'ArrowLeft' });
            expect(inputManager.isKeyPressed('left')).toBe(true);
            
            inputManager.handleKeyDown({ code: 'ArrowDown' });
            expect(inputManager.isKeyPressed('down')).toBe(true);
            
            inputManager.handleKeyDown({ code: 'ArrowRight' });
            expect(inputManager.isKeyPressed('right')).toBe(true);
        });
    });
});