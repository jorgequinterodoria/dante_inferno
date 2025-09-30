/**
 * Player Class
 * Manages Dante's position, movement, and interactions
 */

export class Player {
    constructor(startX = 0, startY = 0, audioService = null) {
        this.x = startX;
        this.y = startY;
        this.previousX = startX;
        this.previousY = startY;
        
        // Animation properties for smooth movement
        this.targetX = startX;
        this.targetY = startY;
        this.isMoving = false;
        this.moveSpeed = 0.15; // Animation speed (0-1, higher = faster)
        this.animationProgress = 0;
        
        // Movement cooldown to prevent rapid movement
        this.lastMoveTime = 0;
        this.moveCooldown = 150; // milliseconds
        
        // Audio service for sound effects
        this.audioService = audioService;
    }

    /**
     * Handle player movement with collision detection
     * @param {string} direction - Movement direction ('up', 'down', 'left', 'right')
     * @param {Maze} maze - Maze instance for collision detection
     * @returns {boolean} - True if movement was successful
     */
    move(direction, maze) {
        // Check movement cooldown to prevent rapid movement
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveCooldown) {
            return false;
        }

        // Don't allow new movement while animating
        if (this.isMoving) {
            return false;
        }

        // Calculate target position based on direction
        let targetX = this.x;
        let targetY = this.y;

        switch (direction) {
            case 'up':
                targetY = this.y - 1;
                break;
            case 'down':
                targetY = this.y + 1;
                break;
            case 'left':
                targetX = this.x - 1;
                break;
            case 'right':
                targetX = this.x + 1;
                break;
            default:
                return false; // Invalid direction
        }

        // Validate movement with boundary and collision checks
        if (!this.isValidMove(targetX, targetY, maze)) {
            // Play blocked movement sound
            if (this.audioService) {
                this.audioService.playMovementSound(false);
            }
            return false;
        }

        // Store previous position for animation
        this.previousX = this.x;
        this.previousY = this.y;

        // Set target position and start animation
        this.targetX = targetX;
        this.targetY = targetY;
        this.isMoving = true;
        this.animationProgress = 0;
        this.lastMoveTime = currentTime;

        // Play successful movement sound
        if (this.audioService) {
            this.audioService.playMovementSound(true);
        }

        return true;
    }

    /**
     * Validate if a move to the target position is valid
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @param {Maze} maze - Maze instance for collision detection
     * @returns {boolean} - True if move is valid
     */
    isValidMove(targetX, targetY, maze) {
        // Input validation
        if (typeof targetX !== 'number' || typeof targetY !== 'number') {
            return false;
        }

        // Check if maze is provided and has the required method
        if (!maze || typeof maze.isWalkable !== 'function') {
            // If no maze provided, only check basic boundaries (fallback)
            return targetX >= 0 && targetY >= 0;
        }

        // Check boundaries (if maze has width/height properties)
        if (maze.width && maze.height) {
            if (targetX < 0 || targetX >= maze.width || targetY < 0 || targetY >= maze.height) {
                return false;
            }
        }

        // Check if target position is walkable (collision detection)
        // This will handle the boundary checking for mazes without width/height
        return maze.isWalkable(targetX, targetY);
    }

    /**
     * Update animation for smooth movement
     * @param {number} deltaTime - Time elapsed since last frame
     */
    update(deltaTime) {
        if (!this.isMoving) {
            return;
        }

        // Update animation progress
        this.animationProgress += this.moveSpeed * (deltaTime / 16.67); // Normalize to 60fps

        // Clamp progress to 0-1 range
        this.animationProgress = Math.min(this.animationProgress, 1);

        // Apply easing function for smooth animation
        const easedProgress = this.easeInOutQuad(this.animationProgress);

        // Interpolate position
        this.x = this.lerp(this.previousX, this.targetX, easedProgress);
        this.y = this.lerp(this.previousY, this.targetY, easedProgress);

        // Check if animation is complete
        if (this.animationProgress >= 1) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            this.animationProgress = 0;
        }
    }

    /**
     * Linear interpolation between two values
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} t - Interpolation factor (0-1)
     * @returns {number} - Interpolated value
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Easing function for smooth animation
     * @param {number} t - Time factor (0-1)
     * @returns {number} - Eased value
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Get current position (returns actual position during animation)
     * @returns {Object} - Current position {x, y}
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Get grid position (returns target position during animation)
     * @returns {Object} - Grid position {x, y}
     */
    getGridPosition() {
        if (this.isMoving) {
            return { x: this.targetX, y: this.targetY };
        }
        return { x: Math.round(this.x), y: Math.round(this.y) };
    }

    /**
     * Get previous position
     * @returns {Object} - Previous position {x, y}
     */
    getPreviousPosition() {
        return { x: this.previousX, y: this.previousY };
    }

    /**
     * Check if player is currently moving
     * @returns {boolean} - True if player is animating movement
     */
    getIsMoving() {
        return this.isMoving;
    }

    /**
     * Reset player to new position
     * @param {Object} newPosition - New position {x, y}
     */
    reset(newPosition) {
        // Input validation
        if (!newPosition || typeof newPosition.x !== 'number' || typeof newPosition.y !== 'number') {
            console.warn('Invalid position provided to Player.reset()');
            return;
        }

        this.x = newPosition.x;
        this.y = newPosition.y;
        this.previousX = newPosition.x;
        this.previousY = newPosition.y;
        this.targetX = newPosition.x;
        this.targetY = newPosition.y;
        
        // Reset animation state
        this.isMoving = false;
        this.animationProgress = 0;
        this.lastMoveTime = 0;
    }

    /**
     * Force complete any ongoing movement animation
     */
    completeMovement() {
        if (this.isMoving) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            this.animationProgress = 0;
        }
    }

    /**
     * Set movement speed for animations
     * @param {number} speed - Movement speed (0-1, higher = faster)
     */
    setMoveSpeed(speed) {
        if (typeof speed === 'number' && speed > 0 && speed <= 1) {
            this.moveSpeed = speed;
        }
    }

    /**
     * Set movement cooldown
     * @param {number} cooldown - Cooldown in milliseconds
     */
    setMoveCooldown(cooldown) {
        if (typeof cooldown === 'number' && cooldown >= 0) {
            this.moveCooldown = cooldown;
        }
    }

    /**
     * Set audio service for sound effects
     * @param {AudioService} audioService - Audio service instance
     */
    setAudioService(audioService) {
        this.audioService = audioService;
    }
}