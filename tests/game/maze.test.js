/**
 * Unit tests for Maze class
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Maze } from '../../js/game/maze.js';

describe('Maze', () => {
    let maze;

    beforeEach(() => {
        maze = new Maze(15, 15, 1);
    });

    describe('Constructor', () => {
        test('should initialize with correct dimensions', () => {
            expect(maze.width).toBe(15);
            expect(maze.height).toBe(15);
            expect(maze.difficulty).toBe(1);
        });

        test('should set default start and exit positions', () => {
            expect(maze.getStartPosition()).toEqual({ x: 1, y: 1 });
            expect(maze.getExitPosition()).toEqual({ x: 13, y: 13 });
        });

        test('should initialize with custom dimensions', () => {
            const customMaze = new Maze(21, 21, 2);
            expect(customMaze.width).toBe(21);
            expect(customMaze.height).toBe(21);
            expect(customMaze.difficulty).toBe(2);
        });
    });

    describe('Maze Generation', () => {
        test('should generate maze with correct dimensions', () => {
            maze.generate();
            expect(maze.cells.length).toBe(15);
            expect(maze.cells[0].length).toBe(15);
        });

        test('should have start position marked correctly', () => {
            maze.generate();
            const start = maze.getStartPosition();
            expect(maze.getCellType(start.x, start.y)).toBe(maze.START);
        });

        test('should have exit position marked correctly', () => {
            maze.generate();
            const exit = maze.getExitPosition();
            expect(maze.getCellType(exit.x, exit.y)).toBe(maze.EXIT);
        });

        test('should generate solvable maze', () => {
            maze.generate();
            expect(maze.isSolvable()).toBe(true);
        });

        test('should have walkable paths', () => {
            maze.generate();
            const walkablePositions = maze.getWalkablePositions();
            expect(walkablePositions.length).toBeGreaterThan(0);
        });

        test('should have walls around perimeter', () => {
            maze.generate();
            
            // Check top and bottom walls
            for (let x = 0; x < maze.width; x++) {
                expect(maze.getCellType(x, 0)).toBe(maze.WALL);
                expect(maze.getCellType(x, maze.height - 1)).toBe(maze.WALL);
            }
            
            // Check left and right walls
            for (let y = 0; y < maze.height; y++) {
                expect(maze.getCellType(0, y)).toBe(maze.WALL);
                expect(maze.getCellType(maze.width - 1, y)).toBe(maze.WALL);
            }
        });
    });

    describe('Walkability Checks', () => {
        beforeEach(() => {
            maze.generate();
        });

        test('should return false for out-of-bounds positions', () => {
            expect(maze.isWalkable(-1, 0)).toBe(false);
            expect(maze.isWalkable(0, -1)).toBe(false);
            expect(maze.isWalkable(maze.width, 0)).toBe(false);
            expect(maze.isWalkable(0, maze.height)).toBe(false);
        });

        test('should return false for wall positions', () => {
            // Find a wall position
            let wallFound = false;
            for (let y = 0; y < maze.height && !wallFound; y++) {
                for (let x = 0; x < maze.width && !wallFound; x++) {
                    if (maze.getCellType(x, y) === maze.WALL) {
                        expect(maze.isWalkable(x, y)).toBe(false);
                        wallFound = true;
                    }
                }
            }
            expect(wallFound).toBe(true);
        });

        test('should return true for path positions', () => {
            const start = maze.getStartPosition();
            expect(maze.isWalkable(start.x, start.y)).toBe(true);
            
            const exit = maze.getExitPosition();
            expect(maze.isWalkable(exit.x, exit.y)).toBe(true);
        });

        test('should return true for start and exit positions', () => {
            const start = maze.getStartPosition();
            const exit = maze.getExitPosition();
            
            expect(maze.isWalkable(start.x, start.y)).toBe(true);
            expect(maze.isWalkable(exit.x, exit.y)).toBe(true);
        });
    });

    describe('Cell Type Methods', () => {
        beforeEach(() => {
            maze.generate();
        });

        test('should return correct cell types', () => {
            const start = maze.getStartPosition();
            const exit = maze.getExitPosition();
            
            expect(maze.getCellType(start.x, start.y)).toBe(maze.START);
            expect(maze.getCellType(exit.x, exit.y)).toBe(maze.EXIT);
        });

        test('should return WALL for out-of-bounds positions', () => {
            expect(maze.getCellType(-1, 0)).toBe(maze.WALL);
            expect(maze.getCellType(maze.width, 0)).toBe(maze.WALL);
        });
    });

    describe('Walkable Positions', () => {
        beforeEach(() => {
            maze.generate();
        });

        test('should return array of walkable positions', () => {
            const positions = maze.getWalkablePositions();
            expect(Array.isArray(positions)).toBe(true);
            expect(positions.length).toBeGreaterThan(0);
        });

        test('should include start and exit in walkable positions', () => {
            const positions = maze.getWalkablePositions();
            const start = maze.getStartPosition();
            const exit = maze.getExitPosition();
            
            const hasStart = positions.some(pos => pos.x === start.x && pos.y === start.y);
            const hasExit = positions.some(pos => pos.x === exit.x && pos.y === exit.y);
            
            expect(hasStart).toBe(true);
            expect(hasExit).toBe(true);
        });

        test('should only return actually walkable positions', () => {
            const positions = maze.getWalkablePositions();
            
            for (const pos of positions) {
                expect(maze.isWalkable(pos.x, pos.y)).toBe(true);
            }
        });
    });

    describe('Maze Solvability', () => {
        test('should detect solvable maze', () => {
            maze.generate();
            expect(maze.isSolvable()).toBe(true);
        });

        test('should handle unsolvable maze by creating guaranteed path', () => {
            // Create an unsolvable maze manually
            maze.initializeMaze();
            maze.setSpecialPositions();
            
            // Should be unsolvable initially
            expect(maze.isSolvable()).toBe(false);
            
            // Create guaranteed path
            maze.createGuaranteedPath();
            
            // Should now be solvable
            expect(maze.isSolvable()).toBe(true);
        });
    });

    describe('Neighbor Finding', () => {
        beforeEach(() => {
            maze.generate();
        });

        test('should find walkable neighbors correctly', () => {
            const start = maze.getStartPosition();
            const neighbors = maze.getWalkableNeighbors(start.x, start.y);
            
            expect(Array.isArray(neighbors)).toBe(true);
            
            // All neighbors should be walkable
            for (const neighbor of neighbors) {
                expect(maze.isWalkable(neighbor.x, neighbor.y)).toBe(true);
            }
        });

        test('should not include out-of-bounds neighbors', () => {
            const neighbors = maze.getWalkableNeighbors(0, 0);
            
            for (const neighbor of neighbors) {
                expect(neighbor.x).toBeGreaterThanOrEqual(0);
                expect(neighbor.x).toBeLessThan(maze.width);
                expect(neighbor.y).toBeGreaterThanOrEqual(0);
                expect(neighbor.y).toBeLessThan(maze.height);
            }
        });
    });

    describe('Different Maze Sizes', () => {
        test('should generate valid small maze', () => {
            const smallMaze = new Maze(7, 7, 1);
            smallMaze.generate();
            
            expect(smallMaze.isSolvable()).toBe(true);
            expect(smallMaze.getWalkablePositions().length).toBeGreaterThan(0);
        });

        test('should generate valid large maze', () => {
            const largeMaze = new Maze(25, 25, 1);
            largeMaze.generate();
            
            expect(largeMaze.isSolvable()).toBe(true);
            expect(largeMaze.getWalkablePositions().length).toBeGreaterThan(0);
        });
    });

    describe('Maze Consistency', () => {
        test('should generate different mazes on multiple calls', () => {
            maze.generate();
            const firstMaze = JSON.stringify(maze.cells);
            
            maze.generate();
            const secondMaze = JSON.stringify(maze.cells);
            
            // While not guaranteed, it's extremely unlikely to generate identical mazes
            // This test may occasionally fail due to randomness, but it's very rare
            expect(firstMaze).not.toBe(secondMaze);
        });

        test('should maintain maze properties after regeneration', () => {
            for (let i = 0; i < 5; i++) {
                maze.generate();
                expect(maze.isSolvable()).toBe(true);
                expect(maze.getWalkablePositions().length).toBeGreaterThan(0);
            }
        });
    });

    describe('Entity Placement System', () => {
        beforeEach(() => {
            maze.generate();
        });

        test('should place entities in walkable positions', () => {
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
            
            for (const entity of maze.entities) {
                expect(maze.isWalkable(entity.x, entity.y)).toBe(true);
            }
        });

        test('should place Virgilio when requested', () => {
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 0 });
            
            const virgilioEntities = maze.getEntitiesByType('virgilio');
            expect(virgilioEntities.length).toBe(1);
            expect(virgilioEntities[0].type).toBe('virgilio');
            expect(virgilioEntities[0].collected).toBe(false);
        });

        test('should not place Virgilio when not requested', () => {
            maze.placeEntities({ hasVirgilio: false, fragmentCount: 3 });
            
            const virgilioEntities = maze.getEntitiesByType('virgilio');
            expect(virgilioEntities.length).toBe(0);
        });

        test('should place correct number of fragments', () => {
            maze.placeEntities({ hasVirgilio: false, fragmentCount: 5 });
            
            const fragmentEntities = maze.getEntitiesByType('fragment');
            expect(fragmentEntities.length).toBe(5);
            
            fragmentEntities.forEach((fragment, index) => {
                expect(fragment.type).toBe('fragment');
                expect(fragment.collected).toBe(false);
                expect(fragment.id).toBe(index);
            });
        });

        test('should not place entities on start or exit positions', () => {
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
            
            const startPos = maze.getStartPosition();
            const exitPos = maze.getExitPosition();
            
            for (const entity of maze.entities) {
                expect(entity.x !== startPos.x || entity.y !== startPos.y).toBe(true);
                expect(entity.x !== exitPos.x || entity.y !== exitPos.y).toBe(true);
            }
        });

        test('should handle limited available positions', () => {
            // Create a small maze with limited positions
            const smallMaze = new Maze(5, 5, 1);
            smallMaze.generate();
            
            // Try to place more entities than available positions
            smallMaze.placeEntities({ hasVirgilio: true, fragmentCount: 20 });
            
            // Should place as many as possible without errors
            expect(smallMaze.entities.length).toBeGreaterThan(0);
            
            // All placed entities should be in walkable positions
            for (const entity of smallMaze.entities) {
                expect(smallMaze.isWalkable(entity.x, entity.y)).toBe(true);
            }
        });

        test('should handle maze with no available positions gracefully', () => {
            // Create a maze with only start and exit walkable
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Mock a maze with no available positions
            const originalGetWalkablePositions = maze.getWalkablePositions;
            maze.getWalkablePositions = () => [
                maze.getStartPosition(),
                maze.getExitPosition()
            ];
            
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
            
            expect(consoleSpy).toHaveBeenCalledWith('No available positions for entity placement');
            expect(maze.entities.length).toBe(0);
            
            // Restore original method
            maze.getWalkablePositions = originalGetWalkablePositions;
            consoleSpy.mockRestore();
        });
    });

    describe('Entity Interaction', () => {
        beforeEach(() => {
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
        });

        test('should find entity at specific position', () => {
            const entity = maze.entities[0];
            const foundEntity = maze.getEntityAt(entity.x, entity.y);
            
            expect(foundEntity).toBe(entity);
            expect(foundEntity.type).toBe(entity.type);
        });

        test('should return null when no entity at position', () => {
            const foundEntity = maze.getEntityAt(-1, -1);
            expect(foundEntity).toBeNull();
        });

        test('should collect entity at position', () => {
            const entity = maze.entities[0];
            const collectedEntity = maze.collectEntity(entity.x, entity.y);
            
            expect(collectedEntity).toBe(entity);
            expect(entity.collected).toBe(true);
        });

        test('should not find collected entities', () => {
            const entity = maze.entities[0];
            maze.collectEntity(entity.x, entity.y);
            
            const foundEntity = maze.getEntityAt(entity.x, entity.y);
            expect(foundEntity).toBeNull();
        });

        test('should return null when collecting from empty position', () => {
            const collectedEntity = maze.collectEntity(-1, -1);
            expect(collectedEntity).toBeNull();
        });
    });

    describe('Entity Queries', () => {
        beforeEach(() => {
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
        });

        test('should get entities by type', () => {
            const virgilioEntities = maze.getEntitiesByType('virgilio');
            const fragmentEntities = maze.getEntitiesByType('fragment');
            
            expect(virgilioEntities.length).toBe(1);
            expect(fragmentEntities.length).toBe(3);
            
            virgilioEntities.forEach(entity => {
                expect(entity.type).toBe('virgilio');
            });
            
            fragmentEntities.forEach(entity => {
                expect(entity.type).toBe('fragment');
            });
        });

        test('should get uncollected entities', () => {
            const initialUncollected = maze.getUncollectedEntities();
            expect(initialUncollected.length).toBe(4); // 1 Virgilio + 3 fragments
            
            // Collect one entity
            maze.collectEntity(maze.entities[0].x, maze.entities[0].y);
            
            const afterCollection = maze.getUncollectedEntities();
            expect(afterCollection.length).toBe(3);
        });

        test('should check if all fragments are collected', () => {
            expect(maze.areAllFragmentsCollected()).toBe(false);
            
            // Collect all fragments
            const fragments = maze.getEntitiesByType('fragment');
            fragments.forEach(fragment => {
                maze.collectEntity(fragment.x, fragment.y);
            });
            
            expect(maze.areAllFragmentsCollected()).toBe(true);
        });

        test('should check if Virgilio is found', () => {
            expect(maze.isVirgilioFound()).toBe(false);
            
            // Find Virgilio
            const virgilio = maze.getEntitiesByType('virgilio')[0];
            maze.collectEntity(virgilio.x, virgilio.y);
            
            expect(maze.isVirgilioFound()).toBe(true);
        });

        test('should count collected fragments', () => {
            expect(maze.getCollectedFragmentsCount()).toBe(0);
            expect(maze.getTotalFragmentsCount()).toBe(3);
            
            // Collect one fragment
            const fragment = maze.getEntitiesByType('fragment')[0];
            maze.collectEntity(fragment.x, fragment.y);
            
            expect(maze.getCollectedFragmentsCount()).toBe(1);
            expect(maze.getTotalFragmentsCount()).toBe(3);
        });

        test('should handle maze without Virgilio', () => {
            maze.placeEntities({ hasVirgilio: false, fragmentCount: 3 });
            
            expect(maze.isVirgilioFound()).toBe(false);
            expect(maze.getEntitiesByType('virgilio').length).toBe(0);
        });

        test('should handle maze without fragments', () => {
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 0 });
            
            expect(maze.areAllFragmentsCollected()).toBe(false);
            expect(maze.getCollectedFragmentsCount()).toBe(0);
            expect(maze.getTotalFragmentsCount()).toBe(0);
        });
    });

    describe('Entity Reset and Rendering', () => {
        beforeEach(() => {
            maze.generate();
            maze.placeEntities({ hasVirgilio: true, fragmentCount: 3 });
        });

        test('should reset all entities to uncollected state', () => {
            // Collect some entities
            maze.collectEntity(maze.entities[0].x, maze.entities[0].y);
            maze.collectEntity(maze.entities[1].x, maze.entities[1].y);
            
            expect(maze.getUncollectedEntities().length).toBe(2);
            
            // Reset entities
            maze.resetEntities();
            
            expect(maze.getUncollectedEntities().length).toBe(4);
            maze.entities.forEach(entity => {
                expect(entity.collected).toBe(false);
            });
        });

        test('should get entity render data', () => {
            const renderData = maze.getEntityRenderData();
            
            expect(renderData.length).toBe(4); // 1 Virgilio + 3 fragments
            
            renderData.forEach(data => {
                expect(data).toHaveProperty('type');
                expect(data).toHaveProperty('x');
                expect(data).toHaveProperty('y');
                expect(data).toHaveProperty('color');
                expect(typeof data.x).toBe('number');
                expect(typeof data.y).toBe('number');
                expect(typeof data.color).toBe('string');
            });
        });

        test('should exclude collected entities from render data', () => {
            // Collect one entity
            maze.collectEntity(maze.entities[0].x, maze.entities[0].y);
            
            const renderData = maze.getEntityRenderData();
            expect(renderData.length).toBe(3);
        });

        test('should return correct colors for entity types', () => {
            expect(maze.getEntityColor('virgilio')).toBe('#800080'); // Purple
            expect(maze.getEntityColor('fragment')).toBe('#0000FF'); // Blue
            expect(maze.getEntityColor('unknown')).toBe('#FFFFFF'); // White fallback
        });

        test('should include correct colors in render data', () => {
            const renderData = maze.getEntityRenderData();
            
            const virgilioData = renderData.find(data => data.type === 'virgilio');
            const fragmentData = renderData.find(data => data.type === 'fragment');
            
            if (virgilioData) {
                expect(virgilioData.color).toBe('#800080');
            }
            
            if (fragmentData) {
                expect(fragmentData.color).toBe('#0000FF');
            }
        });
    });
});