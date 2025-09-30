/**
 * Unit tests for Player class
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Player } from '../../js/game/player.js';

// Mock Maze class for testing
class MockMaze {
    constructor(width = 10, height = 10) {
        this.width = width;
        this.height = height;
        this.walkablePositions = new Set();
        
        // By default, make all positions walkable except boundaries
        for (let x = 1; x < width - 1; x++) {
            for (let y = 1; y < height - 1; y++) {
                this.walkablePositions.add(`${x},${y}`);
            }
        }
    }

    isWalkable(x, y) {
        return this.walkablePositions.has(`${x},${y}`);
    }

    setWalkable(x, y, walkable = true) {
        if (walkable) {
            this.walkablePositions.add(`${x},${y}`);
        } else {
            this.walkablePositions.delete(`${x},${y}`);
        }
    }
}

describe('Player', () => {
    let player;
    let mockMaze;

    beforeEach(() => {
        player = new Player(5, 5);
        mockMaze = new MockMaze(10, 10);
        
        // Mock Date.now for consistent testing
        vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    describe('Initialization', () => {
        test('should initialize with correct starting position', () => {
            const newPlayer = new Player(3, 7);
            expect(newPlayer.x).toBe(3);
            expect(newPlayer.y).toBe(7);
            expect(newPlayer.previousX).toBe(3);
            expect(newPlayer.previousY).toBe(7);
            expect(newPlayer.targetX).toBe(3);
            expect(newPlayer.targetY).toBe(7);
        });

        test('should initialize with default position (0,0)', () => {
            const newPlayer = new Player();
            expect(newPlayer.x).toBe(0);
            expect(newPlayer.y).toBe(0);
        });

        test('should initialize animation properties', () => {
            expect(player.isMoving).toBe(false);
            expect(player.moveSpeed).toBe(0.15);
            expect(player.animationProgress).toBe(0);
            expect(player.moveCooldown).toBe(150);
        });
    });

    describe('Movement', () => {
        test('should move up when direction is up', () => {
            const result = player.move('up', mockMaze);
            
            expect(result).toBe(true);
            expect(player.targetX).toBe(5);
            expect(player.targetY).toBe(4);
            expect(player.isMoving).toBe(true);
        });

        test('should move down when direction is down', () => {
            const result = player.move('down', mockMaze);
            
            expect(result).toBe(true);
            expect(player.targetX).toBe(5);
            expect(player.targetY).toBe(6);
            expect(player.isMoving).toBe(true);
        });

        test('should move left when direction is left', () => {
            const result = player.move('left', mockMaze);
            
            expect(result).toBe(true);
            expect(player.targetX).toBe(4);
            expect(player.targetY).toBe(5);
            expect(player.isMoving).toBe(true);
        });

        test('should move right when direction is right', () => {
            const result = player.move('right', mockMaze);
            
            expect(result).toBe(true);
            expect(player.targetX).toBe(6);
            expect(player.targetY).toBe(5);
            expect(player.isMoving).toBe(true);
        });

        test('should reject invalid direction', () => {
            const result = player.move('invalid', mockMaze);
            
            expect(result).toBe(false);
            expect(player.isMoving).toBe(false);
        });

        test('should prevent movement while already moving', () => {
            player.move('up', mockMaze);
            expect(player.isMoving).toBe(true);
            
            const result = player.move('down', mockMaze);
            expect(result).toBe(false);
        });

        test('should respect movement cooldown', () => {
            player.move('up', mockMaze);
            
            // Try to move again immediately (should fail due to cooldown)
            const result = player.move('down', mockMaze);
            expect(result).toBe(false);
        });

        test('should allow movement after cooldown period', () => {
            player.move('up', mockMaze);
            player.completeMovement(); // Complete first movement
            
            // Advance time past cooldown
            vi.spyOn(Date, 'now').mockReturnValue(1200);
            
            const result = player.move('down', mockMaze);
            expect(result).toBe(true);
        });
    });

    describe('Collision Detection', () => {
        test('should prevent movement into non-walkable positions', () => {
            // Make position (5,4) non-walkable
            mockMaze.setWalkable(5, 4, false);
            
            const result = player.move('up', mockMaze);
            expect(result).toBe(false);
            expect(player.isMoving).toBe(false);
        });

        test('should prevent movement outside maze boundaries', () => {
            // Move player to edge
            player.reset({ x: 0, y: 0 });
            
            const result = player.move('left', mockMaze);
            expect(result).toBe(false);
        });

        test('should handle maze without width/height properties', () => {
            // Create a simple maze that allows movement from player's current position (5,5)
            const simpleMaze = {
                isWalkable: (x, y) => x >= 0 && y >= 0 && x < 10 && y < 10
            };
            
            const result = player.move('up', simpleMaze);
            expect(result).toBe(true);
        });

        test('should handle missing maze parameter', () => {
            const result = player.move('up', null);
            expect(result).toBe(true); // Should use fallback boundary check
        });
    });

    describe('Input Validation', () => {
        test('should validate move parameters', () => {
            expect(player.isValidMove(5, 4, mockMaze)).toBe(true);
            expect(player.isValidMove('invalid', 4, mockMaze)).toBe(false);
            expect(player.isValidMove(5, 'invalid', mockMaze)).toBe(false);
        });

        test('should handle maze without isWalkable method', () => {
            const invalidMaze = { width: 10, height: 10 };
            expect(player.isValidMove(5, 4, invalidMaze)).toBe(true);
        });
    });

    describe('Animation', () => {
        test('should update position during animation', () => {
            player.move('right', mockMaze);
            
            // Simulate animation update
            player.update(16.67); // One frame at 60fps
            
            expect(player.x).toBeGreaterThan(5);
            expect(player.x).toBeLessThan(6);
            expect(player.isMoving).toBe(true);
        });

        test('should complete animation when progress reaches 1', () => {
            player.move('right', mockMaze);
            
            // Force animation to complete
            player.animationProgress = 1;
            player.update(16.67);
            
            expect(player.x).toBe(6);
            expect(player.y).toBe(5);
            expect(player.isMoving).toBe(false);
        });

        test('should not update when not moving', () => {
            const initialX = player.x;
            const initialY = player.y;
            
            player.update(16.67);
            
            expect(player.x).toBe(initialX);
            expect(player.y).toBe(initialY);
        });
    });

    describe('Position Tracking', () => {
        test('should return current position', () => {
            const position = player.getPosition();
            expect(position).toEqual({ x: 5, y: 5 });
        });

        test('should return grid position during animation', () => {
            player.move('right', mockMaze);
            
            const gridPosition = player.getGridPosition();
            expect(gridPosition).toEqual({ x: 6, y: 5 });
        });

        test('should return previous position', () => {
            player.move('right', mockMaze);
            
            const prevPosition = player.getPreviousPosition();
            expect(prevPosition).toEqual({ x: 5, y: 5 });
        });

        test('should track moving state', () => {
            expect(player.getIsMoving()).toBe(false);
            
            player.move('right', mockMaze);
            expect(player.getIsMoving()).toBe(true);
        });
    });

    describe('Reset and Control', () => {
        test('should reset to new position', () => {
            player.move('right', mockMaze);
            player.reset({ x: 8, y: 3 });
            
            expect(player.x).toBe(8);
            expect(player.y).toBe(3);
            expect(player.targetX).toBe(8);
            expect(player.targetY).toBe(3);
            expect(player.isMoving).toBe(false);
        });

        test('should handle invalid reset position', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            player.reset(null);
            expect(consoleSpy).toHaveBeenCalledWith('Invalid position provided to Player.reset()');
            
            player.reset({ x: 'invalid', y: 5 });
            expect(consoleSpy).toHaveBeenCalledTimes(2);
            
            consoleSpy.mockRestore();
        });

        test('should complete movement when forced', () => {
            player.move('right', mockMaze);
            expect(player.isMoving).toBe(true);
            
            player.completeMovement();
            expect(player.x).toBe(6);
            expect(player.isMoving).toBe(false);
        });

        test('should set movement speed', () => {
            player.setMoveSpeed(0.5);
            expect(player.moveSpeed).toBe(0.5);
            
            // Should ignore invalid values
            player.setMoveSpeed(-1);
            expect(player.moveSpeed).toBe(0.5);
            
            player.setMoveSpeed(2);
            expect(player.moveSpeed).toBe(0.5);
        });

        test('should set movement cooldown', () => {
            player.setMoveCooldown(200);
            expect(player.moveCooldown).toBe(200);
            
            // Should ignore invalid values
            player.setMoveCooldown(-1);
            expect(player.moveCooldown).toBe(200);
        });
    });

    describe('Utility Functions', () => {
        test('should interpolate values correctly', () => {
            expect(player.lerp(0, 10, 0)).toBe(0);
            expect(player.lerp(0, 10, 1)).toBe(10);
            expect(player.lerp(0, 10, 0.5)).toBe(5);
        });

        test('should apply easing function', () => {
            expect(player.easeInOutQuad(0)).toBe(0);
            expect(player.easeInOutQuad(1)).toBe(1);
            expect(player.easeInOutQuad(0.5)).toBe(0.5);
        });
    });
});