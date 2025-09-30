/**
 * AudioManager Tests
 * Tests for the audio system with Web Audio API and HTML5 Audio fallback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager } from '../../js/engine/audioManager.js';

describe('AudioManager', () => {
    let audioManager;
    let mockAudioContext;
    let mockAudio;

    beforeEach(() => {
        // Mock Web Audio API
        mockAudioContext = {
            createGain: vi.fn(() => ({
                connect: vi.fn(),
                gain: { value: 0 }
            })),
            createBufferSource: vi.fn(() => ({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                buffer: null,
                loop: false,
                playbackRate: { value: 1 }
            })),
            decodeAudioData: vi.fn(() => Promise.resolve({})),
            resume: vi.fn(() => Promise.resolve()),
            close: vi.fn(() => Promise.resolve()),
            state: 'running',
            currentTime: 0,
            destination: {},
            addEventListener: vi.fn()
        };

        // Mock HTML5 Audio
        mockAudio = {
            play: vi.fn(() => Promise.resolve()),
            pause: vi.fn(),
            load: vi.fn(),
            cloneNode: vi.fn(() => mockAudio),
            addEventListener: vi.fn(),
            volume: 1,
            loop: false,
            playbackRate: 1,
            currentTime: 0,
            src: ''
        };

        // Mock global objects
        global.AudioContext = vi.fn(() => mockAudioContext);
        global.webkitAudioContext = vi.fn(() => mockAudioContext);
        global.Audio = vi.fn(() => mockAudio);
        global.fetch = vi.fn();

        // Mock document.createElement for audio support check
        global.document = {
            createElement: vi.fn(() => ({
                canPlayType: vi.fn(() => 'probably')
            }))
        };

        audioManager = new AudioManager();
    });

    afterEach(() => {
        if (audioManager) {
            audioManager.cleanup();
        }
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(audioManager.volume).toBe(0.7);
            expect(audioManager.musicVolume).toBe(0.5);
            expect(audioManager.sfxVolume).toBe(0.7);
            expect(audioManager.isEnabled).toBe(true);
            expect(audioManager.isInitialized).toBe(false);
            expect(audioManager.useWebAudio).toBe(false);
        });

        it('should detect browser support correctly', () => {
            audioManager.checkBrowserSupport();
            expect(audioManager.supportsWebAudio).toBe(true);
            expect(audioManager.supportsHTML5Audio).toBe(true);
        });

        it('should initialize with Web Audio API when supported', async () => {
            await audioManager.init();
            
            expect(audioManager.isInitialized).toBe(true);
            expect(audioManager.useWebAudio).toBe(true);
            expect(global.AudioContext).toHaveBeenCalled();
            expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2); // music and sfx gain nodes
        });

        it('should fall back to HTML5 Audio when Web Audio API fails', async () => {
            // Make Web Audio API fail
            global.AudioContext = vi.fn(() => {
                throw new Error('Web Audio API not available');
            });
            global.webkitAudioContext = undefined;

            await audioManager.init();
            
            expect(audioManager.isInitialized).toBe(true);
            expect(audioManager.useWebAudio).toBe(false);
            expect(global.Audio).toHaveBeenCalled();
        });

        it('should disable audio when no support is available', async () => {
            // Remove all audio support
            global.AudioContext = undefined;
            global.webkitAudioContext = undefined;
            global.Audio = undefined;
            global.document.createElement = vi.fn(() => ({
                canPlayType: undefined
            }));

            await audioManager.init();
            
            expect(audioManager.isInitialized).toBe(true);
            expect(audioManager.isEnabled).toBe(false);
        });
    });

    describe('Volume Control', () => {
        beforeEach(async () => {
            await audioManager.init();
        });

        it('should set master volume correctly', () => {
            audioManager.setVolume(0.5);
            expect(audioManager.volume).toBe(0.5);
        });

        it('should clamp volume values to valid range', () => {
            audioManager.setVolume(-0.5);
            expect(audioManager.volume).toBe(0);
            
            audioManager.setVolume(1.5);
            expect(audioManager.volume).toBe(1);
        });

        it('should set music volume correctly', () => {
            audioManager.setMusicVolume(0.3);
            expect(audioManager.musicVolume).toBe(0.3);
        });

        it('should set SFX volume correctly', () => {
            audioManager.setSfxVolume(0.8);
            expect(audioManager.sfxVolume).toBe(0.8);
        });

        it('should return current volume levels', () => {
            audioManager.setVolume(0.6);
            audioManager.setMusicVolume(0.4);
            audioManager.setSfxVolume(0.9);

            const volumes = audioManager.getVolumes();
            expect(volumes).toEqual({
                master: 0.6,
                music: 0.4,
                sfx: 0.9
            });
        });
    });

    describe('Sound Loading and Playback', () => {
        beforeEach(async () => {
            await audioManager.init();
        });

        it('should load sound with Web Audio API', async () => {
            const mockArrayBuffer = new ArrayBuffer(8);
            const mockAudioBuffer = {};
            
            global.fetch = vi.fn(() => Promise.resolve({
                arrayBuffer: () => Promise.resolve(mockArrayBuffer)
            }));
            
            mockAudioContext.decodeAudioData = vi.fn(() => Promise.resolve(mockAudioBuffer));

            await audioManager.loadSound('test-sound', '/test.mp3');
            
            expect(global.fetch).toHaveBeenCalledWith('/test.mp3');
            expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
            expect(audioManager.sounds.has('test-sound')).toBe(true);
        });

        it('should load sound with HTML5 Audio fallback', async () => {
            // Force HTML5 Audio mode
            audioManager.useWebAudio = false;
            
            // Mock successful audio loading
            setTimeout(() => {
                const loadEvent = new Event('canplaythrough');
                mockAudio.addEventListener.mock.calls
                    .find(call => call[0] === 'canplaythrough')[1](loadEvent);
            }, 0);

            await audioManager.loadSound('test-sound', '/test.mp3');
            
            expect(mockAudio.addEventListener).toHaveBeenCalledWith('canplaythrough', expect.any(Function));
            expect(audioManager.audioElements.has('test-sound')).toBe(true);
        });

        it('should play sound with Web Audio API', async () => {
            const mockAudioBuffer = {};
            audioManager.sounds.set('test-sound', mockAudioBuffer);

            audioManager.playSound('test-sound');
            
            expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
        });

        it('should play sound with HTML5 Audio', async () => {
            audioManager.useWebAudio = false;
            audioManager.audioElements.set('test-sound', mockAudio);

            audioManager.playSound('test-sound');
            
            expect(mockAudio.cloneNode).toHaveBeenCalled();
            expect(mockAudio.play).toHaveBeenCalled();
        });

        it('should handle missing sounds gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            audioManager.playSound('non-existent-sound');
            
            expect(consoleSpy).toHaveBeenCalledWith('Sound not found: non-existent-sound');
            consoleSpy.mockRestore();
        });
    });

    describe('Music Playback', () => {
        beforeEach(async () => {
            await audioManager.init();
        });

        it('should load music track', async () => {
            audioManager.useWebAudio = false; // Use HTML5 for simpler testing
            
            await audioManager.loadMusic('background', '/music.mp3');
            
            expect(audioManager.musicTracks.has('background')).toBe(true);
            expect(audioManager.musicTracks.get('background')).toBe('/music.mp3');
        });

        it('should play music with HTML5 Audio', () => {
            audioManager.useWebAudio = false;
            audioManager.musicTracks.set('background', '/music.mp3');
            audioManager.musicElement = mockAudio;

            audioManager.playMusic('background');
            
            expect(mockAudio.play).toHaveBeenCalled();
            expect(audioManager.currentMusic).toBe('background');
        });

        it('should stop current music when playing new track', () => {
            audioManager.useWebAudio = false;
            audioManager.musicTracks.set('background', '/music.mp3');
            audioManager.musicElement = mockAudio;
            audioManager.currentMusic = 'old-track';

            audioManager.playMusic('background');
            
            expect(mockAudio.pause).toHaveBeenCalled();
            expect(audioManager.currentMusic).toBe('background');
        });

        it('should stop music correctly', () => {
            audioManager.useWebAudio = false;
            audioManager.musicElement = mockAudio;
            audioManager.currentMusic = 'background';

            audioManager.stopMusic();
            
            expect(mockAudio.pause).toHaveBeenCalled();
            expect(mockAudio.currentTime).toBe(0);
            expect(audioManager.currentMusic).toBe(null);
        });
    });

    describe('System Information', () => {
        beforeEach(async () => {
            await audioManager.init();
        });

        it('should return correct system information', () => {
            const info = audioManager.getSystemInfo();
            
            expect(info).toHaveProperty('isEnabled');
            expect(info).toHaveProperty('isInitialized');
            expect(info).toHaveProperty('useWebAudio');
            expect(info).toHaveProperty('supportsWebAudio');
            expect(info).toHaveProperty('supportsHTML5Audio');
            expect(info).toHaveProperty('audioContextState');
            expect(info).toHaveProperty('loadedSounds');
            expect(info).toHaveProperty('loadedMusic');
            expect(info).toHaveProperty('currentMusic');
        });

        it('should report ready state correctly', () => {
            expect(audioManager.isReady()).toBe(true);
            
            audioManager.setEnabled(false);
            expect(audioManager.isReady()).toBe(false);
        });
    });

    describe('Cleanup', () => {
        beforeEach(async () => {
            await audioManager.init();
        });

        it('should cleanup resources correctly', () => {
            audioManager.sounds.set('test', {});
            audioManager.musicTracks.set('music', '/test.mp3');
            audioManager.currentMusic = 'music';

            audioManager.cleanup();
            
            expect(audioManager.sounds.size).toBe(0);
            expect(audioManager.musicTracks.size).toBe(0);
            expect(audioManager.audioElements.size).toBe(0);
            expect(audioManager.isInitialized).toBe(false);
            expect(audioManager.currentMusic).toBe(null);
            expect(mockAudioContext.close).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // Make everything fail
            global.AudioContext = vi.fn(() => {
                throw new Error('Audio context failed');
            });
            global.Audio = vi.fn(() => {
                throw new Error('HTML5 Audio failed');
            });

            await audioManager.init();
            
            expect(audioManager.isEnabled).toBe(false);
            expect(audioManager.isInitialized).toBe(true);
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });

        it('should handle sound loading errors', async () => {
            await audioManager.init();
            
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

            // The loadSound method should catch errors and log them, not throw
            try {
                await audioManager.loadSound('failing-sound', '/fail.mp3');
            } catch (error) {
                // Expected to catch the error
            }
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(audioManager.sounds.has('failing-sound')).toBe(false);
            
            consoleSpy.mockRestore();
        });
    });
});