/**
 * Audio Manager
 * Handles sound effects and background music using Web Audio API with HTML5 Audio fallback
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.volume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.isEnabled = true;
        this.useWebAudio = false;
        this.currentMusic = null;
        this.musicGainNode = null;
        this.sfxGainNode = null;
        
        // HTML5 Audio fallback elements
        this.audioElements = new Map();
        this.musicElement = null;
        
        // Browser compatibility flags
        this.supportsWebAudio = false;
        this.supportsHTML5Audio = false;
        
        // Loading state
        this.isInitialized = false;
        this.loadingPromises = new Map();
        
        // User interaction state
        this.hasUserInteracted = false;
        this.pendingAudioInit = false;
    }

    /**
     * Initialize audio system with Web Audio API or HTML5 Audio fallback
     */
    async init() {
        try {
            console.log('Initializing AudioManager...');
            
            // Check browser compatibility
            this.checkBrowserSupport();
            
            if (!this.supportsWebAudio && !this.supportsHTML5Audio) {
                console.warn('No audio support detected, running in silent mode');
                this.isEnabled = false;
                this.isInitialized = true;
                return;
            }
            
            // Set up user interaction listener for Web Audio API
            if (this.supportsWebAudio) {
                this.setupUserInteractionListener();
            }
            
            // Initialize HTML5 Audio immediately (doesn't require user interaction)
            if (this.supportsHTML5Audio) {
                this.initHTML5Audio();
                console.log('HTML5 Audio initialized successfully');
            }
            
            this.isInitialized = true;
            console.log('AudioManager initialized successfully (Web Audio pending user interaction)');
            
        } catch (error) {
            console.error('Failed to initialize AudioManager:', error);
            this.isEnabled = false;
            this.isInitialized = true;
        }
    }

    /**
     * Set up listener for user interaction to enable Web Audio API
     */
    setupUserInteractionListener() {
        const enableAudio = async () => {
            if (this.hasUserInteracted) return;
            
            this.hasUserInteracted = true;
            console.log('User interaction detected, initializing Web Audio API...');
            
            try {
                await this.initWebAudio();
                this.useWebAudio = true;
                console.log('Web Audio API initialized successfully after user interaction');
                
                // Remove event listeners
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('keydown', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
                
            } catch (error) {
                console.warn('Web Audio API initialization failed after user interaction:', error);
                this.useWebAudio = false;
            }
        };
        
        // Listen for various user interaction events
        document.addEventListener('click', enableAudio, { once: false });
        document.addEventListener('keydown', enableAudio, { once: false });
        document.addEventListener('touchstart', enableAudio, { once: false });
    }

    /**
     * Check browser support for audio APIs
     */
    checkBrowserSupport() {
        // Check Web Audio API support
        this.supportsWebAudio = !!(window.AudioContext || window.webkitAudioContext);
        
        // Check HTML5 Audio support
        this.supportsHTML5Audio = !!window.Audio && !!document.createElement('audio').canPlayType;
    }

    /**
     * Initialize Web Audio API
     */
    async initWebAudio() {
        // Create audio context
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        
        // Create gain nodes for volume control
        this.musicGainNode = this.audioContext.createGain();
        this.sfxGainNode = this.audioContext.createGain();
        
        // Connect gain nodes to destination
        this.musicGainNode.connect(this.audioContext.destination);
        this.sfxGainNode.connect(this.audioContext.destination);
        
        // Set initial volumes
        this.musicGainNode.gain.value = this.musicVolume;
        this.sfxGainNode.gain.value = this.sfxVolume;
        
        // Handle audio context state changes
        this.handleAudioContextState();
        
        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            await this.resumeAudioContext();
        }
    }

    /**
     * Initialize HTML5 Audio fallback
     */
    initHTML5Audio() {
        // Create music element for background music
        this.musicElement = new Audio();
        this.musicElement.loop = true;
        this.musicElement.volume = this.musicVolume;
        
        // Handle music element events
        this.musicElement.addEventListener('error', (e) => {
            console.error('Music playback error:', e);
        });
        
        this.musicElement.addEventListener('canplaythrough', () => {
            console.log('Music ready to play');
        });
    }

    /**
     * Handle audio context state changes
     */
    handleAudioContextState() {
        if (!this.audioContext) return;
        
        this.audioContext.addEventListener('statechange', () => {
            console.log(`Audio context state: ${this.audioContext.state}`);
            
            if (this.audioContext.state === 'suspended') {
                console.warn('Audio context suspended - user interaction may be required');
            }
        });
    }

    /**
     * Resume audio context (required after user interaction in some browsers)
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
            } catch (error) {
                console.error('Failed to resume audio context:', error);
            }
        }
    }

    /**
     * Load sound effect
     * @param {string} name - Sound identifier
     * @param {string} url - Path to audio file
     * @returns {Promise} - Loading promise
     */
    async loadSound(name, url) {
        if (!this.isEnabled || !this.isInitialized) {
            return Promise.resolve();
        }
        
        // Return existing loading promise if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        const loadingPromise = this.useWebAudio ? 
            this.loadSoundWebAudio(name, url) : 
            this.loadSoundHTML5(name, url);
        
        this.loadingPromises.set(name, loadingPromise);
        
        try {
            await loadingPromise;
            console.log(`Sound loaded: ${name}`);
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
        } finally {
            this.loadingPromises.delete(name);
        }
        
        return loadingPromise;
    }

    /**
     * Load sound using Web Audio API
     */
    async loadSoundWebAudio(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, audioBuffer);
        } catch (error) {
            throw new Error(`Failed to load sound with Web Audio API: ${error.message}`);
        }
    }

    /**
     * Load sound using HTML5 Audio
     */
    async loadSoundHTML5(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                this.audioElements.set(name, audio);
                resolve();
            });
            
            audio.addEventListener('error', (e) => {
                reject(new Error(`Failed to load sound with HTML5 Audio: ${e.message}`));
            });
            
            audio.src = url;
            audio.load();
        });
    }

    /**
     * Load background music
     * @param {string} name - Music track identifier
     * @param {string} url - Path to music file
     * @returns {Promise} - Loading promise
     */
    async loadMusic(name, url) {
        if (!this.isEnabled || !this.isInitialized) {
            return Promise.resolve();
        }
        
        if (this.useWebAudio) {
            return this.loadSoundWebAudio(name, url);
        } else {
            // For HTML5 Audio, we'll load music on-demand
            this.musicTracks.set(name, url);
            return Promise.resolve();
        }
    }

    /**
     * Play sound effect
     * @param {string} name - Sound identifier
     * @param {Object} options - Playback options
     */
    playSound(name, options = {}) {
        if (!this.isEnabled || !this.isInitialized) {
            return;
        }
        
        // Try to initialize Web Audio if user has interacted but it's not initialized yet
        if (!this.useWebAudio && this.hasUserInteracted && this.supportsWebAudio && !this.pendingAudioInit) {
            this.pendingAudioInit = true;
            this.initWebAudio().then(() => {
                this.useWebAudio = true;
                this.pendingAudioInit = false;
                this.playSound(name, options); // Retry with Web Audio
            }).catch(() => {
                this.pendingAudioInit = false;
                this.playSoundHTML5(name, options); // Fallback to HTML5
            });
            return;
        }
        
        if (this.useWebAudio) {
            this.playSoundWebAudio(name, options);
        } else {
            this.playSoundHTML5(name, options);
        }
    }

    /**
     * Play background music
     * @param {string} name - Music track identifier
     * @param {Object} options - Playback options
     */
    playMusic(name, options = {}) {
        if (!this.isEnabled || !this.isInitialized) {
            return;
        }
        
        // Try to initialize Web Audio if user has interacted but it's not initialized yet
        if (!this.useWebAudio && this.hasUserInteracted && this.supportsWebAudio && !this.pendingAudioInit) {
            this.pendingAudioInit = true;
            this.initWebAudio().then(() => {
                this.useWebAudio = true;
                this.pendingAudioInit = false;
                this.playMusic(name, options); // Retry with Web Audio
            }).catch(() => {
                this.pendingAudioInit = false;
                this.playMusicHTML5(name, options); // Fallback to HTML5
            });
            return;
        }
        
        if (this.useWebAudio) {
            this.playMusicWebAudio(name, options);
        } else {
            this.playMusicHTML5(name, options);
        }
    }

    /**
     * Play sound using Web Audio API
     */
    playSoundWebAudio(name, options) {
        const audioBuffer = this.sounds.get(name);
        if (!audioBuffer) {
            console.warn(`Sound not found: ${name}`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = audioBuffer;
            source.loop = options.loop;
            source.playbackRate.value = options.playbackRate;
            
            gainNode.gain.value = options.volume * this.sfxVolume;
            
            source.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            source.start(0);
            
        } catch (error) {
            console.error(`Failed to play sound ${name}:`, error);
        }
    }

    /**
     * Play sound using HTML5 Audio
     */
    playSoundHTML5(name, options) {
        const audio = this.audioElements.get(name);
        if (!audio) {
            console.warn(`Sound not found: ${name}`);
            return;
        }
        
        try {
            // Clone audio element for overlapping sounds
            const audioClone = audio.cloneNode();
            audioClone.volume = options.volume * this.sfxVolume;
            audioClone.loop = options.loop;
            audioClone.playbackRate = options.playbackRate;
            
            audioClone.play().catch(error => {
                console.error(`Failed to play sound ${name}:`, error);
            });
            
        } catch (error) {
            console.error(`Failed to play sound ${name}:`, error);
        }
    }

    /**
     * Play music using Web Audio API
     */
    playMusicWebAudio(name, options) {
        const audioBuffer = this.sounds.get(name);
        if (!audioBuffer) {
            console.warn(`Music not found: ${name}`);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;
            
            source.connect(this.musicGainNode);
            
            if (options.fadeIn) {
                this.musicGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                this.musicGainNode.gain.linearRampToValueAtTime(
                    this.musicVolume, 
                    this.audioContext.currentTime + options.fadeDuration / 1000
                );
            }
            
            source.start(0);
            this.currentMusicSource = source;
            
        } catch (error) {
            console.error(`Failed to play music ${name}:`, error);
        }
    }

    /**
     * Play music using HTML5 Audio
     */
    playMusicHTML5(name, options) {
        const url = this.musicTracks.get(name);
        if (!url) {
            console.warn(`Music not found: ${name}`);
            return;
        }
        
        try {
            this.musicElement.src = url;
            this.musicElement.volume = options.fadeIn ? 0 : this.musicVolume;
            
            this.musicElement.play().then(() => {
                if (options.fadeIn) {
                    this.fadeInMusic(options.fadeDuration);
                }
            }).catch(error => {
                console.error(`Failed to play music ${name}:`, error);
            });
            
        } catch (error) {
            console.error(`Failed to play music ${name}:`, error);
        }
    }

    /**
     * Fade in music for HTML5 Audio
     */
    fadeInMusic(duration) {
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = this.musicVolume / steps;
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            this.musicElement.volume = Math.min(volumeStep * currentStep, this.musicVolume);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepDuration);
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (this.useWebAudio && this.currentMusicSource) {
            try {
                this.currentMusicSource.stop();
                this.currentMusicSource = null;
            } catch (error) {
                console.error('Failed to stop Web Audio music:', error);
            }
        } else if (this.musicElement) {
            this.musicElement.pause();
            this.musicElement.currentTime = 0;
        }
        
        this.currentMusic = null;
    }

    /**
     * Set master volume level
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * Set music volume level
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * Set sound effects volume level
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }

    /**
     * Update all volume levels
     */
    updateVolumes() {
        const masterVolume = this.volume;
        
        if (this.useWebAudio) {
            if (this.musicGainNode) {
                this.musicGainNode.gain.value = this.musicVolume * masterVolume;
            }
            if (this.sfxGainNode) {
                this.sfxGainNode.gain.value = this.sfxVolume * masterVolume;
            }
        } else {
            if (this.musicElement) {
                this.musicElement.volume = this.musicVolume * masterVolume;
            }
            // HTML5 Audio sound effects volume is handled per-sound
        }
    }

    /**
     * Enable/disable audio
     * @param {boolean} enabled - Whether audio should be enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            this.stopMusic();
        }
    }

    /**
     * Get current volume levels
     * @returns {Object} - Volume levels object
     */
    getVolumes() {
        return {
            master: this.volume,
            music: this.musicVolume,
            sfx: this.sfxVolume
        };
    }

    /**
     * Check if audio is enabled and initialized
     * @returns {boolean} - Whether audio is ready
     */
    isReady() {
        return this.isEnabled && this.isInitialized;
    }

    /**
     * Get audio system information
     * @returns {Object} - Audio system info
     */
    getSystemInfo() {
        return {
            isEnabled: this.isEnabled,
            isInitialized: this.isInitialized,
            useWebAudio: this.useWebAudio,
            supportsWebAudio: this.supportsWebAudio,
            supportsHTML5Audio: this.supportsHTML5Audio,
            audioContextState: this.audioContext ? this.audioContext.state : 'not available',
            loadedSounds: Array.from(this.sounds.keys()),
            loadedMusic: Array.from(this.musicTracks.keys()),
            currentMusic: this.currentMusic
        };
    }

    /**
     * Cleanup audio resources
     */
    cleanup() {
        // Stop all audio
        this.stopMusic();
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Clear all data
        this.sounds.clear();
        this.musicTracks.clear();
        this.audioElements.clear();
        this.loadingPromises.clear();
        
        // Reset state
        this.isInitialized = false;
        this.currentMusic = null;
        this.currentMusicSource = null;
        
        console.log('AudioManager cleaned up');
    }
}