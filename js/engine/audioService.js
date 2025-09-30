/**
 * Audio Service
 * High-level audio service that integrates AudioManager with game systems
 * Handles sound effects, music, and audio feedback for game events
 */

import { SOUND_EFFECTS, MUSIC_TRACKS, AUDIO_PATHS, getSoundConfig, getMusicConfig, getLevelMusic } from '../data/audioData.js';

export class AudioService {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        this.isInitialized = false;
        this.currentLevelMusic = null;
        this.loadingPromises = new Map();
        
        // Audio loading state
        this.soundsLoaded = new Set();
        this.musicLoaded = new Set();
        
        // Cooldown system to prevent audio spam
        this.lastPlayTimes = new Map();
        this.cooldownDuration = 100; // milliseconds
    }

    /**
     * Initialize audio service and load essential sounds
     * @param {AudioManager} audioManager - AudioManager instance
     */
    async init(audioManager) {
        if (!audioManager) {
            console.warn('AudioService: No AudioManager provided');
            return;
        }

        this.audioManager = audioManager;
        
        if (!this.audioManager.isReady()) {
            console.warn('AudioService: AudioManager not ready');
            return;
        }

        try {
            // Load essential sound effects first
            await this.loadEssentialSounds();
            
            // Load menu music
            await this.loadMenuMusic();
            
            this.isInitialized = true;
            console.log('AudioService initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize AudioService:', error);
        }
    }

    /**
     * Load essential sound effects for immediate use
     */
    async loadEssentialSounds() {
        const essentialSounds = [
            SOUND_EFFECTS.MOVE_STEP,
            SOUND_EFFECTS.MOVE_BLOCKED,
            SOUND_EFFECTS.MENU_SELECT,
            SOUND_EFFECTS.BUTTON_CLICK,
            SOUND_EFFECTS.SUCCESS,
            SOUND_EFFECTS.ERROR
        ];

        const loadPromises = essentialSounds.map(sound => this.loadSoundEffect(sound));
        await Promise.allSettled(loadPromises);
        
        console.log('Essential sounds loaded');
    }

    /**
     * Load menu music
     */
    async loadMenuMusic() {
        try {
            await this.loadMusicTrack(MUSIC_TRACKS.MENU_THEME);
            console.log('Menu music loaded');
        } catch (error) {
            console.warn('Failed to load menu music:', error);
        }
    }

    /**
     * Load sound effect
     * @param {string} soundName - Sound effect name
     */
    async loadSoundEffect(soundName) {
        if (!this.audioManager || this.soundsLoaded.has(soundName)) {
            return;
        }

        const soundPath = AUDIO_PATHS[soundName];
        if (!soundPath) {
            console.warn(`AudioService: No path defined for sound: ${soundName}`);
            return;
        }

        try {
            await this.audioManager.loadSound(soundName, soundPath);
            this.soundsLoaded.add(soundName);
        } catch (error) {
            console.warn(`Failed to load sound effect ${soundName}:`, error);
        }
    }

    /**
     * Load music track
     * @param {string} musicName - Music track name
     */
    async loadMusicTrack(musicName) {
        if (!this.audioManager || this.musicLoaded.has(musicName)) {
            return;
        }

        const musicPath = AUDIO_PATHS[musicName];
        if (!musicPath) {
            console.warn(`AudioService: No path defined for music: ${musicName}`);
            return;
        }

        try {
            await this.audioManager.loadMusic(musicName, musicPath);
            this.musicLoaded.add(musicName);
        } catch (error) {
            console.warn(`Failed to load music track ${musicName}:`, error);
        }
    }

    /**
     * Play sound effect with cooldown protection
     * @param {string} soundName - Sound effect name
     * @param {Object} options - Additional options
     */
    playSoundEffect(soundName, options = {}) {
        if (!this.isReady() || !this.soundsLoaded.has(soundName)) {
            return;
        }

        // Check cooldown to prevent audio spam
        if (this.isOnCooldown(soundName)) {
            return;
        }

        const config = getSoundConfig(soundName);
        const playOptions = { ...config, ...options };

        this.audioManager.playSound(soundName, playOptions);
        this.updateCooldown(soundName);
    }

    /**
     * Play music track
     * @param {string} musicName - Music track name
     * @param {Object} options - Additional options
     */
    async playMusic(musicName, options = {}) {
        if (!this.isReady()) {
            return;
        }

        // Load music if not already loaded
        if (!this.musicLoaded.has(musicName)) {
            await this.loadMusicTrack(musicName);
        }

        if (!this.musicLoaded.has(musicName)) {
            console.warn(`Failed to load music: ${musicName}`);
            return;
        }

        const config = getMusicConfig(musicName);
        const playOptions = { ...config, ...options };

        this.audioManager.playMusic(musicName, playOptions);
        this.currentLevelMusic = musicName;
    }

    /**
     * Stop current music
     */
    stopMusic() {
        if (this.audioManager) {
            this.audioManager.stopMusic();
            this.currentLevelMusic = null;
        }
    }

    /**
     * Check if sound is on cooldown
     * @param {string} soundName - Sound effect name
     * @returns {boolean} - True if on cooldown
     */
    isOnCooldown(soundName) {
        const lastPlayTime = this.lastPlayTimes.get(soundName) || 0;
        return Date.now() - lastPlayTime < this.cooldownDuration;
    }

    /**
     * Update cooldown for sound
     * @param {string} soundName - Sound effect name
     */
    updateCooldown(soundName) {
        this.lastPlayTimes.set(soundName, Date.now());
    }

    /**
     * Check if audio service is ready
     * @returns {boolean} - True if ready
     */
    isReady() {
        return this.isInitialized && this.audioManager && this.audioManager.isReady();
    }

    // Game Event Audio Methods

    /**
     * Play movement sound
     * @param {boolean} successful - Whether movement was successful
     */
    playMovementSound(successful = true) {
        if (successful) {
            this.playSoundEffect(SOUND_EFFECTS.MOVE_STEP);
        } else {
            this.playSoundEffect(SOUND_EFFECTS.MOVE_BLOCKED);
        }
    }

    /**
     * Play objective completion sound
     * @param {string} objectiveType - Type of objective completed
     */
    playObjectiveSound(objectiveType) {
        switch (objectiveType) {
            case 'virgilio':
                this.playSoundEffect(SOUND_EFFECTS.VIRGILIO_FOUND);
                break;
            case 'fragment':
                this.playSoundEffect(SOUND_EFFECTS.FRAGMENT_COLLECTED);
                break;
            case 'exit':
                this.playSoundEffect(SOUND_EFFECTS.EXIT_UNLOCKED);
                break;
            case 'level_complete':
                this.playSoundEffect(SOUND_EFFECTS.LEVEL_COMPLETE);
                break;
            default:
                this.playSoundEffect(SOUND_EFFECTS.SUCCESS);
        }
    }

    /**
     * Play UI interaction sound
     * @param {string} interactionType - Type of UI interaction
     */
    playUISound(interactionType) {
        switch (interactionType) {
            case 'select':
                this.playSoundEffect(SOUND_EFFECTS.MENU_SELECT);
                break;
            case 'navigate':
                this.playSoundEffect(SOUND_EFFECTS.MENU_NAVIGATE);
                break;
            case 'back':
                this.playSoundEffect(SOUND_EFFECTS.MENU_BACK);
                break;
            case 'click':
                this.playSoundEffect(SOUND_EFFECTS.BUTTON_CLICK);
                break;
            case 'error':
                this.playSoundEffect(SOUND_EFFECTS.ERROR);
                break;
            default:
                this.playSoundEffect(SOUND_EFFECTS.BUTTON_CLICK);
        }
    }

    /**
     * Play level-specific music
     * @param {number} levelNumber - Level number
     */
    async playLevelMusic(levelNumber) {
        const musicTrack = getLevelMusic(levelNumber);
        await this.playMusic(musicTrack);
    }

    /**
     * Play menu music
     */
    async playMenuMusic() {
        await this.playMusic(MUSIC_TRACKS.MENU_THEME);
    }

    /**
     * Load sounds for specific level
     * @param {number} levelNumber - Level number
     */
    async loadLevelAudio(levelNumber) {
        const promises = [];

        // Load level-specific music
        const musicTrack = getLevelMusic(levelNumber);
        promises.push(this.loadMusicTrack(musicTrack));

        // Load objective completion sounds if not already loaded
        const objectiveSounds = [
            SOUND_EFFECTS.VIRGILIO_FOUND,
            SOUND_EFFECTS.FRAGMENT_COLLECTED,
            SOUND_EFFECTS.EXIT_UNLOCKED,
            SOUND_EFFECTS.LEVEL_COMPLETE
        ];

        objectiveSounds.forEach(sound => {
            if (!this.soundsLoaded.has(sound)) {
                promises.push(this.loadSoundEffect(sound));
            }
        });

        await Promise.allSettled(promises);
        console.log(`Audio loaded for level ${levelNumber}`);
    }

    /**
     * Set volume levels
     * @param {number} masterVolume - Master volume (0-1)
     * @param {number} musicVolume - Music volume (0-1)
     * @param {number} sfxVolume - SFX volume (0-1)
     */
    setVolume(masterVolume, musicVolume = null, sfxVolume = null) {
        if (!this.audioManager) return;

        this.audioManager.setVolume(masterVolume);
        
        if (musicVolume !== null) {
            this.audioManager.setMusicVolume(musicVolume);
        }
        
        if (sfxVolume !== null) {
            this.audioManager.setSfxVolume(sfxVolume);
        }
    }

    /**
     * Get current audio status
     * @returns {Object} - Audio status information
     */
    getStatus() {
        return {
            isReady: this.isReady(),
            soundsLoaded: Array.from(this.soundsLoaded),
            musicLoaded: Array.from(this.musicLoaded),
            currentMusic: this.currentLevelMusic,
            audioManagerInfo: this.audioManager ? this.audioManager.getSystemInfo() : null
        };
    }

    /**
     * Cleanup audio service
     */
    cleanup() {
        this.stopMusic();
        this.soundsLoaded.clear();
        this.musicLoaded.clear();
        this.lastPlayTimes.clear();
        this.loadingPromises.clear();
        this.isInitialized = false;
        this.currentLevelMusic = null;
        
        console.log('AudioService cleaned up');
    }
}