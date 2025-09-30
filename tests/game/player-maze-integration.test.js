/**
 * Integration tests for Player and Maze classes
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Player } from '../../js/game/player.js';
import { Maze } from '../../js/game/maze.js';

describe('Player-Maze Integration', () => {
    let player;
    let maze;

    beforeEach(() => {
        maze = new Maze(15, 15, 1);
        maze.generate();
        
        // Place player at maze start position
        const startPos = maze.getStartPosition();
        player = new Player(startPos.x, startPos.y);
        
        // Mock Date.now for consistent testing
        vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    test('should allow movement to walkable positions in generated maze', () => {
        const walkableNeighbors = maze.getWalkableNeighbors(player.x, player.y);
        
        if (walkableNeighbors.length > 0) {
            const neighbor = walkableNeighbors[0];
            let direction;
            
            if (neighbor.x > player.x) direction = 'right';
            else if (neighbor.x < player.x) direction = 'left';
            else if (neighbor.y > player.y) direction = 'down';
            else if (neighbor.y < player.y) direction = 'up';
            
            const result = player.move(direction, maze);
            expect(result).toBe(true);
            expect(player.targetX).toBe(neighbor.x);
            expect(player.targetY).toBe(neighbor.y);
        }
    });

    test('should prevent movement into walls in generated maze', () => {
        // Find a wall position adjacent to player
        const directions = [
            { dir: 'up', dx: 0, dy: -1 },
            { dir: 'down', dx: 0, dy: 1 },
            { dir: 'left', dx: -1, dy: 0 },
            { dir: 'right', dx: 1, dy: 0 }
        ];

        let wallFound = false;
        for (const { dir, dx, dy } of directions) {
            const targetX = player.x + dx;
            const targetY = player.y + dy;
            
            if (!maze.isWalkable(targetX, targetY)) {
                const result = player.move(dir, maze);
                expect(result).toBe(false);
                expect(player.isMoving).toBe(false);
                wallFound = true;
                break; // Found a wall, test passed
            }
        }
        
        // If no walls found adjacent to start position, that's also valid
        // (though unlikely with proper maze generation)
        if (!wallFound) {
            // At least verify boundary walls work
            player.reset({ x: 0, y: 1 });
            const result = player.move('left', maze);
            expect(result).toBe(false);
        }
    });

    test('should respect maze boundaries', () => {
        // Test boundary conditions
        expect(player.isValidMove(-1, 0, maze)).toBe(false);
        expect(player.isValidMove(0, -1, maze)).toBe(false);
        expect(player.isValidMove(maze.width, 0, maze)).toBe(false);
        expect(player.isValidMove(0, maze.height, maze)).toBe(false);
    });

    test('should work with different maze sizes', () => {
        const smallMaze = new Maze(7, 7, 1);
        smallMaze.generate();
        
        const startPos = smallMaze.getStartPosition();
        player.reset(startPos);
        
        // Should be able to validate moves with smaller maze
        expect(player.isValidMove(startPos.x, startPos.y, smallMaze)).toBe(true);
        expect(player.isValidMove(-1, startPos.y, smallMaze)).toBe(false);
        expect(player.isValidMove(startPos.x, -1, smallMaze)).toBe(false);
    });

    test('should handle maze cell types correctly', () => {
        const startPos = maze.getStartPosition();
        const exitPos = maze.getExitPosition();
        
        // Should be able to move to start and exit positions
        expect(player.isValidMove(startPos.x, startPos.y, maze)).toBe(true);
        expect(player.isValidMove(exitPos.x, exitPos.y, maze)).toBe(true);
    });

    test('should work correctly after maze regeneration', () => {
        // Generate a new maze
        maze.generate();
        const newStartPos = maze.getStartPosition();
        player.reset(newStartPos);
        
        // Should still work with new maze layout
        expect(player.isValidMove(newStartPos.x, newStartPos.y, maze)).toBe(true);
        
        // Should still prevent invalid moves
        expect(player.isValidMove(-1, -1, maze)).toBe(false);
    });

    test('should handle collision detection with various maze configurations', () => {
        // Test with multiple maze generations to ensure consistency
        for (let i = 0; i < 3; i++) {
            maze.generate();
            const startPos = maze.getStartPosition();
            player.reset(startPos);
            
            // Player should always be able to be at start position
            expect(maze.isWalkable(startPos.x, startPos.y)).toBe(true);
            expect(player.isValidMove(startPos.x, startPos.y, maze)).toBe(true);
            
            // Maze should always be solvable
            expect(maze.isSolvable()).toBe(true);
        }
    });

    test('should properly integrate movement validation with maze walls', () => {
        // Create a simple test scenario
        const testMaze = new Maze(5, 5, 1);
        testMaze.generate();
        
        const startPos = testMaze.getStartPosition();
        const testPlayer = new Player(startPos.x, startPos.y);
        
        // Test all four directions
        const directions = ['up', 'down', 'left', 'right'];
        
        for (const direction of directions) {
            const result = testPlayer.move(direction, testMaze);
            
            if (result) {
                // If movement succeeded, target position should be walkable
                expect(testMaze.isWalkable(testPlayer.targetX, testPlayer.targetY)).toBe(true);
                testPlayer.completeMovement(); // Reset for next test
            } else {
                // If movement failed, player should not be moving
                expect(testPlayer.isMoving).toBe(false);
            }
        }
    });

    test('should maintain player position consistency with maze coordinates', () => {
        const startPos = maze.getStartPosition();
        
        // Verify player starts at correct maze position
        expect(player.x).toBe(startPos.x);
        expect(player.y).toBe(startPos.y);
        
        // Verify position is walkable in maze
        expect(maze.isWalkable(player.x, player.y)).toBe(true);
        
        // Test movement to walkable neighbor if available
        const neighbors = maze.getWalkableNeighbors(player.x, player.y);
        if (neighbors.length > 0) {
            const neighbor = neighbors[0];
            let direction;
            
            if (neighbor.x > player.x) direction = 'right';
            else if (neighbor.x < player.x) direction = 'left';
            else if (neighbor.y > player.y) direction = 'down';
            else direction = 'up';
            
            player.move(direction, maze);
            player.completeMovement();
            
            // Verify final position matches expected neighbor
            expect(player.x).toBe(neighbor.x);
            expect(player.y).toBe(neighbor.y);
            expect(maze.isWalkable(player.x, player.y)).toBe(true);
        }
    });
});