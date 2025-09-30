/**
 * Game Balance Configuration
 * Fine-tuned difficulty progression and game balance settings
 * Requirements: 12.2 - Fine-tune game balance and difficulty progression
 */

/**
 * Difficulty scaling configuration
 */
export const DifficultyScaling = {
    // Base values for level 1
    BASE_MAZE_SIZE: { width: 15, height: 15 },
    BASE_FRAGMENTS: 3,
    BASE_DIFFICULTY: 1,
    
    // Scaling factors per level
    MAZE_SIZE_INCREASE: { width: 3, height: 3 },
    FRAGMENT_INCREASE: 1,
    DIFFICULTY_MULTIPLIER: 1.2,
    
    // Maximum values to prevent excessive difficulty
    MAX_MAZE_SIZE: { width: 45, height: 45 },
    MAX_FRAGMENTS: 15,
    MAX_DIFFICULTY: 10,
    
    // Minimum values to ensure playability
    MIN_MAZE_SIZE: { width: 10, height: 10 },
    MIN_FRAGMENTS: 2,
    MIN_DIFFICULTY: 1
};

/**
 * Player movement and interaction settings
 */
export const PlayerSettings = {
    // Movement timing
    MOVEMENT_DURATION: 200, // milliseconds
    MOVEMENT_EASING: 'ease-out',
    
    // Input handling
    INPUT_BUFFER_TIME: 100, // milliseconds
    RAPID_INPUT_THRESHOLD: 50, // milliseconds between inputs
    
    // Collision feedback
    COLLISION_FEEDBACK_DURATION: 150,
    COLLISION_SHAKE_INTENSITY: 2, // pixels
    
    // Visual feedback
    HIGHLIGHT_DURATION: 300,
    INTERACTION_RADIUS: 1.5 // grid units
};

/**
 * Objective completion balance
 */
export const ObjectiveBalance = {
    // Fragment distribution
    FRAGMENT_MIN_DISTANCE: 3, // minimum distance between fragments
    FRAGMENT_CORNER_BIAS: 0.3, // probability of placing in corners
    FRAGMENT_DEAD_END_BIAS: 0.4, // probability of placing in dead ends
    
    // Virgilio placement
    VIRGILIO_MIN_DISTANCE_FROM_START: 5,
    VIRGILIO_MAX_DISTANCE_FROM_START: 15,
    VIRGILIO_CENTRAL_BIAS: 0.6, // probability of placing in central areas
    
    // Exit placement
    EXIT_MIN_DISTANCE_FROM_START: 8,
    EXIT_CORNER_PREFERENCE: 0.8, // probability of placing in corners
    
    // Completion rewards
    FRAGMENT_COLLECTION_SCORE: 100,
    VIRGILIO_ENCOUNTER_SCORE: 500,
    LEVEL_COMPLETION_SCORE: 1000,
    SPEED_BONUS_THRESHOLD: 300000, // 5 minutes in milliseconds
    SPEED_BONUS_MULTIPLIER: 1.5
};

/**
 * Maze generation balance
 */
export const MazeBalance = {
    // Generation algorithm parameters
    WALL_DENSITY: 0.4, // 0.0 = no walls, 1.0 = maximum walls
    DEAD_END_REDUCTION: 0.3, // probability of removing dead ends
    LOOP_CREATION: 0.2, // probability of creating loops
    
    // Path width and connectivity
    MIN_PATH_WIDTH: 1,
    CONNECTIVITY_FACTOR: 0.8, // how connected the maze should be
    
    // Difficulty adjustments per level
    DIFFICULTY_WALL_DENSITY_INCREASE: 0.05,
    DIFFICULTY_DEAD_END_INCREASE: 0.02,
    DIFFICULTY_LOOP_DECREASE: 0.02,
    
    // Solvability guarantees
    MAX_GENERATION_ATTEMPTS: 10,
    SOLVABILITY_CHECK_TIMEOUT: 5000, // milliseconds
    
    // Visual balance
    WALL_THICKNESS: 1,
    PATH_CLARITY: 0.9 // how clear paths should be visually
};

/**
 * Audio and visual feedback balance
 */
export const FeedbackBalance = {
    // Audio settings
    SFX_VOLUME_SCALE: 0.7,
    MUSIC_VOLUME_SCALE: 0.5,
    AUDIO_FADE_DURATION: 1000,
    
    // Visual effects
    LIGHTING_INTENSITY: 0.8,
    LIGHTING_RADIUS: 3.5, // grid units
    LIGHTING_FALLOFF: 0.6,
    
    // Animation timing
    OBJECTIVE_COMPLETE_DURATION: 2000,
    LEVEL_TRANSITION_DURATION: 3000,
    ERROR_MESSAGE_DURATION: 4000,
    SUCCESS_MESSAGE_DURATION: 2000,
    
    // Particle effects
    FRAGMENT_COLLECT_PARTICLES: 8,
    PARTICLE_LIFETIME: 1000,
    PARTICLE_SPREAD: 30, // degrees
    
    // Screen effects
    SCREEN_SHAKE_DURATION: 200,
    SCREEN_SHAKE_INTENSITY: 3,
    FLASH_EFFECT_DURATION: 150
};

/**
 * Performance optimization settings
 */
export const PerformanceSettings = {
    // Rendering optimization
    TARGET_FPS: 60,
    MIN_FPS_THRESHOLD: 30,
    PERFORMANCE_CHECK_INTERVAL: 1000, // milliseconds
    
    // Automatic quality adjustment
    AUTO_QUALITY_ADJUSTMENT: true,
    QUALITY_REDUCTION_THRESHOLD: 25, // FPS
    QUALITY_INCREASE_THRESHOLD: 55, // FPS
    
    // Memory management
    MAX_PARTICLE_COUNT: 50,
    PARTICLE_CLEANUP_INTERVAL: 5000,
    AUDIO_BUFFER_SIZE: 4096,
    
    // Canvas optimization
    CANVAS_BUFFER_SIZE: 2, // multiplier for high DPI displays
    RENDER_SCALE_FACTOR: 1.0,
    PIXEL_RATIO_LIMIT: 2,
    
    // Update frequency
    GAME_LOGIC_UPDATE_RATE: 60, // Hz
    RENDER_UPDATE_RATE: 60, // Hz
    UI_UPDATE_RATE: 30 // Hz
};

/**
 * User experience settings
 */
export const UXSettings = {
    // Tutorial and guidance
    SHOW_TUTORIAL_HINTS: true,
    TUTORIAL_HINT_DURATION: 5000,
    HINT_FADE_DURATION: 500,
    
    // Save system
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    AUTO_SAVE_ON_OBJECTIVE: true,
    AUTO_SAVE_ON_LEVEL_CHANGE: true,
    SAVE_CONFIRMATION_DURATION: 1500,
    
    // Error handling
    ERROR_RETRY_ATTEMPTS: 3,
    ERROR_RETRY_DELAY: 1000,
    GRACEFUL_DEGRADATION: true,
    
    // Accessibility
    HIGH_CONTRAST_MODE: false,
    REDUCED_MOTION_MODE: false,
    SCREEN_READER_SUPPORT: true,
    KEYBOARD_NAVIGATION: true,
    
    // Mobile optimization
    TOUCH_GESTURE_SUPPORT: true,
    MOBILE_UI_SCALING: 1.2,
    MOBILE_PERFORMANCE_MODE: false
};

/**
 * Progression and rewards system
 */
export const ProgressionSettings = {
    // Experience and scoring
    BASE_SCORE_PER_LEVEL: 1000,
    TIME_BONUS_THRESHOLD: 600000, // 10 minutes
    TIME_PENALTY_THRESHOLD: 1800000, // 30 minutes
    
    // Achievement thresholds
    SPEED_RUN_THRESHOLDS: [300000, 600000, 900000], // 5, 10, 15 minutes
    DEATH_COUNT_THRESHOLDS: [0, 3, 10], // perfect, good, acceptable
    EXPLORATION_THRESHOLDS: [0.8, 0.9, 1.0], // percentage of maze explored
    
    // Unlock conditions
    LEVEL_UNLOCK_REQUIREMENTS: {
        OBJECTIVES_COMPLETED: true,
        MIN_SCORE: 0,
        MAX_DEATHS: null // no limit
    },
    
    // Statistics tracking
    TRACK_DETAILED_STATS: true,
    STATS_CATEGORIES: [
        'playTime',
        'deathCount',
        'levelsCompleted',
        'fragmentsCollected',
        'dialoguesSeen',
        'averageCompletionTime',
        'bestTimes',
        'explorationRate'
    ]
};

/**
 * Dynamic difficulty adjustment
 */
export class DynamicDifficulty {
    constructor() {
        this.playerSkillLevel = 1.0;
        this.adjustmentHistory = [];
        this.lastAdjustment = Date.now();
    }

    /**
     * Analyze player performance and adjust difficulty
     * @param {Object} performanceData - Player performance metrics
     * @returns {Object} - Difficulty adjustments
     */
    analyzePerfomance(performanceData) {
        const {
            completionTime,
            deathCount,
            hintsUsed,
            retryCount,
            explorationEfficiency
        } = performanceData;

        let skillAdjustment = 0;

        // Analyze completion time
        if (completionTime < ObjectiveBalance.SPEED_BONUS_THRESHOLD) {
            skillAdjustment += 0.1; // Player is fast
        } else if (completionTime > ObjectiveBalance.SPEED_BONUS_THRESHOLD * 3) {
            skillAdjustment -= 0.1; // Player is struggling
        }

        // Analyze death count
        if (deathCount === 0) {
            skillAdjustment += 0.05; // Perfect run
        } else if (deathCount > 5) {
            skillAdjustment -= 0.1; // Many deaths
        }

        // Analyze exploration efficiency
        if (explorationEfficiency > 0.9) {
            skillAdjustment += 0.05; // Efficient exploration
        } else if (explorationEfficiency < 0.5) {
            skillAdjustment -= 0.05; // Inefficient exploration
        }

        // Update skill level
        this.playerSkillLevel = Math.max(0.5, Math.min(2.0, this.playerSkillLevel + skillAdjustment));

        return this.getDifficultyAdjustments();
    }

    /**
     * Get current difficulty adjustments based on skill level
     * @returns {Object} - Difficulty modifiers
     */
    getDifficultyAdjustments() {
        const skillFactor = this.playerSkillLevel;

        return {
            mazeComplexity: Math.max(0.5, Math.min(1.5, skillFactor)),
            fragmentCount: Math.max(0.8, Math.min(1.3, skillFactor)),
            hintFrequency: Math.max(0.5, Math.min(2.0, 2.0 - skillFactor)),
            timeBonus: Math.max(0.8, Math.min(1.5, skillFactor)),
            visualClarity: Math.max(0.7, Math.min(1.0, 2.0 - skillFactor))
        };
    }

    /**
     * Reset difficulty to default
     */
    reset() {
        this.playerSkillLevel = 1.0;
        this.adjustmentHistory = [];
        this.lastAdjustment = Date.now();
    }

    /**
     * Get current skill level
     * @returns {number} - Current skill level (0.5 - 2.0)
     */
    getSkillLevel() {
        return this.playerSkillLevel;
    }
}

/**
 * Validate and apply balance settings
 * @param {Object} customSettings - Custom balance settings to apply
 * @returns {Object} - Validated and merged settings
 */
export function applyBalanceSettings(customSettings = {}) {
    const settings = {
        difficulty: { ...DifficultyScaling, ...customSettings.difficulty },
        player: { ...PlayerSettings, ...customSettings.player },
        objectives: { ...ObjectiveBalance, ...customSettings.objectives },
        maze: { ...MazeBalance, ...customSettings.maze },
        feedback: { ...FeedbackBalance, ...customSettings.feedback },
        performance: { ...PerformanceSettings, ...customSettings.performance },
        ux: { ...UXSettings, ...customSettings.ux },
        progression: { ...ProgressionSettings, ...customSettings.progression }
    };

    // Validate settings
    validateBalanceSettings(settings);

    return settings;
}

/**
 * Validate balance settings for consistency
 * @param {Object} settings - Settings to validate
 */
function validateBalanceSettings(settings) {
    // Validate difficulty scaling
    if (settings.difficulty.MAX_MAZE_SIZE.width < settings.difficulty.MIN_MAZE_SIZE.width) {
        console.warn('Max maze width is smaller than min maze width');
    }

    // Validate performance settings
    if (settings.performance.TARGET_FPS < settings.performance.MIN_FPS_THRESHOLD) {
        console.warn('Target FPS is lower than minimum FPS threshold');
    }

    // Validate player settings
    if (settings.player.MOVEMENT_DURATION <= 0) {
        console.warn('Movement duration must be positive');
        settings.player.MOVEMENT_DURATION = 200;
    }

    // Validate objective balance
    if (settings.objectives.FRAGMENT_MIN_DISTANCE < 1) {
        console.warn('Fragment minimum distance too small');
        settings.objectives.FRAGMENT_MIN_DISTANCE = 1;
    }
}

/**
 * Get recommended settings for different device types
 * @param {string} deviceType - 'desktop', 'tablet', 'mobile'
 * @returns {Object} - Recommended settings
 */
export function getRecommendedSettings(deviceType = 'desktop') {
    const baseSettings = applyBalanceSettings();

    switch (deviceType) {
        case 'mobile':
            return {
                ...baseSettings,
                performance: {
                    ...baseSettings.performance,
                    TARGET_FPS: 30,
                    MAX_PARTICLE_COUNT: 20,
                    RENDER_SCALE_FACTOR: 0.8
                },
                ux: {
                    ...baseSettings.ux,
                    MOBILE_PERFORMANCE_MODE: true,
                    MOBILE_UI_SCALING: 1.3,
                    TOUCH_GESTURE_SUPPORT: true
                },
                feedback: {
                    ...baseSettings.feedback,
                    LIGHTING_INTENSITY: 0.6,
                    PARTICLE_LIFETIME: 500
                }
            };

        case 'tablet':
            return {
                ...baseSettings,
                performance: {
                    ...baseSettings.performance,
                    TARGET_FPS: 45,
                    MAX_PARTICLE_COUNT: 35
                },
                ux: {
                    ...baseSettings.ux,
                    MOBILE_UI_SCALING: 1.1,
                    TOUCH_GESTURE_SUPPORT: true
                }
            };

        default: // desktop
            return baseSettings;
    }
}

/**
 * Export default balanced configuration
 */
export const DefaultGameBalance = applyBalanceSettings();