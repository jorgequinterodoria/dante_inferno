/**
 * Maze Class
 * Handles maze generation and collision detection
 */

export class Maze {
    constructor(width = 15, height = 15, difficulty = 1) {
        this.width = width;
        this.height = height;
        this.difficulty = difficulty;
        this.cells = [];
        this.entities = [];
        this.startPosition = { x: 1, y: 1 };
        this.exitPosition = { x: width - 2, y: height - 2 };
        
        // Cell types
        this.WALL = 0;
        this.PATH = 1;
        this.START = 2;
        this.EXIT = 3;
    }

    /**
     * Generate maze layout using recursive backtracking algorithm
     */
    generate() {
        // Initialize maze with all walls
        this.initializeMaze();
        
        // Use recursive backtracking to generate paths
        this.generatePaths();
        
        // Set start and exit positions
        this.setSpecialPositions();
        
        // Ensure maze is solvable by verifying path from start to exit
        if (!this.isSolvable()) {
            // If not solvable, create a guaranteed path
            this.createGuaranteedPath();
        }
    }

    /**
     * Initialize maze with all walls
     */
    initializeMaze() {
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x] = this.WALL;
            }
        }
    }

    /**
     * Generate paths using recursive backtracking algorithm
     */
    generatePaths() {
        const stack = [];
        const visited = new Set();
        
        // Start from position (1,1) to ensure odd coordinates
        const startX = 1;
        const startY = 1;
        
        this.cells[startY][startX] = this.PATH;
        stack.push({ x: startX, y: startY });
        visited.add(`${startX},${startY}`);
        
        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current.x, current.y, visited);
            
            if (neighbors.length > 0) {
                // Choose random neighbor
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Remove wall between current and next
                const wallX = current.x + (next.x - current.x) / 2;
                const wallY = current.y + (next.y - current.y) / 2;
                
                this.cells[wallY][wallX] = this.PATH;
                this.cells[next.y][next.x] = this.PATH;
                
                visited.add(`${next.x},${next.y}`);
                stack.push(next);
            } else {
                stack.pop();
            }
        }
    }

    /**
     * Get unvisited neighbors for maze generation
     */
    getUnvisitedNeighbors(x, y, visited) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -2 }, // Up
            { x: 2, y: 0 },  // Right
            { x: 0, y: 2 },  // Down
            { x: -2, y: 0 }  // Left
        ];

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (this.isValidPosition(newX, newY) && !visited.has(`${newX},${newY}`)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }

    /**
     * Check if position is valid for maze generation
     */
    isValidPosition(x, y) {
        return x >= 1 && x < this.width - 1 && y >= 1 && y < this.height - 1;
    }

    /**
     * Set start and exit positions
     */
    setSpecialPositions() {
        this.cells[this.startPosition.y][this.startPosition.x] = this.START;
        this.cells[this.exitPosition.y][this.exitPosition.x] = this.EXIT;
    }

    /**
     * Check if maze is solvable using breadth-first search
     */
    isSolvable() {
        const queue = [this.startPosition];
        const visited = new Set();
        visited.add(`${this.startPosition.x},${this.startPosition.y}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === this.exitPosition.x && current.y === this.exitPosition.y) {
                return true;
            }
            
            const neighbors = this.getWalkableNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }
        
        return false;
    }

    /**
     * Get walkable neighbors for pathfinding
     */
    getWalkableNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];

        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            
            if (this.isWalkable(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }

    /**
     * Create guaranteed path from start to exit if maze is not solvable
     */
    createGuaranteedPath() {
        let currentX = this.startPosition.x;
        let currentY = this.startPosition.y;
        
        // Create path to exit
        while (currentX !== this.exitPosition.x || currentY !== this.exitPosition.y) {
            this.cells[currentY][currentX] = this.PATH;
            
            if (currentX < this.exitPosition.x) {
                currentX++;
            } else if (currentX > this.exitPosition.x) {
                currentX--;
            } else if (currentY < this.exitPosition.y) {
                currentY++;
            } else if (currentY > this.exitPosition.y) {
                currentY--;
            }
        }
        
        // Ensure exit is accessible
        this.cells[this.exitPosition.y][this.exitPosition.x] = this.EXIT;
    }

    /**
     * Check if position is walkable
     */
    isWalkable(x, y) {
        // Check bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        // Check if cell is not a wall
        return this.cells[y][x] !== this.WALL;
    }

    /**
     * Get cell type at position
     */
    getCellType(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return this.WALL;
        }
        return this.cells[y][x];
    }

    /**
     * Get maze start position
     */
    getStartPosition() {
        return this.startPosition;
    }

    /**
     * Get maze exit position
     */
    getExitPosition() {
        return this.exitPosition;
    }

    /**
     * Get all walkable positions in the maze
     */
    getWalkablePositions() {
        const positions = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isWalkable(x, y)) {
                    positions.push({ x, y });
                }
            }
        }
        return positions;
    }

    /**
     * Place entities in maze (Virgilio, fragments, exit)
     * @param {Object} config - Entity configuration
     * @param {boolean} config.hasVirgilio - Whether to place Virgilio
     * @param {number} config.fragmentCount - Number of fragments to place
     */
    placeEntities(config = { hasVirgilio: true, fragmentCount: 3 }) {
        this.entities = [];
        const walkablePositions = this.getWalkablePositions();
        
        // Filter out start and exit positions for entity placement
        const availablePositions = walkablePositions.filter(pos => 
            !(pos.x === this.startPosition.x && pos.y === this.startPosition.y) &&
            !(pos.x === this.exitPosition.x && pos.y === this.exitPosition.y)
        );
        
        if (availablePositions.length === 0) {
            console.warn('No available positions for entity placement');
            return;
        }
        
        // Place Virgilio if required
        if (config.hasVirgilio && availablePositions.length > 0) {
            const virgilioIndex = Math.floor(Math.random() * availablePositions.length);
            const virgilioPos = availablePositions[virgilioIndex];
            
            this.entities.push({
                type: 'virgilio',
                x: virgilioPos.x,
                y: virgilioPos.y,
                collected: false
            });
            
            // Remove used position
            availablePositions.splice(virgilioIndex, 1);
        }
        
        // Place fragments
        const fragmentsToPlace = Math.min(config.fragmentCount, availablePositions.length);
        for (let i = 0; i < fragmentsToPlace; i++) {
            const fragmentIndex = Math.floor(Math.random() * availablePositions.length);
            const fragmentPos = availablePositions[fragmentIndex];
            
            this.entities.push({
                type: 'fragment',
                x: fragmentPos.x,
                y: fragmentPos.y,
                collected: false,
                id: i
            });
            
            // Remove used position
            availablePositions.splice(fragmentIndex, 1);
        }
    }

    /**
     * Get entity at specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} - Entity at position or null
     */
    getEntityAt(x, y) {
        return this.entities.find(entity => 
            entity.x === x && entity.y === y && !entity.collected
        ) || null;
    }

    /**
     * Collect entity at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} - Collected entity or null
     */
    collectEntity(x, y) {
        const entity = this.getEntityAt(x, y);
        if (entity) {
            entity.collected = true;
            return entity;
        }
        return null;
    }

    /**
     * Get all entities of a specific type
     * @param {string} type - Entity type ('virgilio', 'fragment')
     * @returns {Array} - Array of entities
     */
    getEntitiesByType(type) {
        return this.entities.filter(entity => entity.type === type);
    }

    /**
     * Get all uncollected entities
     * @returns {Array} - Array of uncollected entities
     */
    getUncollectedEntities() {
        return this.entities.filter(entity => !entity.collected);
    }

    /**
     * Check if all fragments are collected
     * @returns {boolean} - True if all fragments are collected
     */
    areAllFragmentsCollected() {
        const fragments = this.getEntitiesByType('fragment');
        return fragments.length > 0 && fragments.every(fragment => fragment.collected);
    }

    /**
     * Check if Virgilio is found
     * @returns {boolean} - True if Virgilio is collected
     */
    isVirgilioFound() {
        const virgilio = this.getEntitiesByType('virgilio')[0];
        return virgilio ? virgilio.collected : false;
    }

    /**
     * Get collected fragments count
     * @returns {number} - Number of collected fragments
     */
    getCollectedFragmentsCount() {
        return this.getEntitiesByType('fragment').filter(f => f.collected).length;
    }

    /**
     * Get total fragments count
     * @returns {number} - Total number of fragments
     */
    getTotalFragmentsCount() {
        return this.getEntitiesByType('fragment').length;
    }

    /**
     * Reset all entities to uncollected state
     */
    resetEntities() {
        this.entities.forEach(entity => {
            entity.collected = false;
        });
    }

    /**
     * Get entity render data for renderer
     * @returns {Array} - Array of entity render data
     */
    getEntityRenderData() {
        return this.getUncollectedEntities().map(entity => ({
            type: entity.type,
            x: entity.x,
            y: entity.y,
            color: this.getEntityColor(entity.type)
        }));
    }

    /**
     * Get color for entity type based on requirements
     * @param {string} type - Entity type
     * @returns {string} - Color code
     */
    getEntityColor(type) {
        switch (type) {
            case 'virgilio':
                return '#800080'; // Purple
            case 'fragment':
                return '#0000FF'; // Blue
            default:
                return '#FFFFFF'; // White fallback
        }
    }
}