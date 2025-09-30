/**
 * AudioService Tests
 * Tests for the high-level audio service integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioService } from '../../js/engine/audioService.js';

describe('AudioService', () => {
    let audioService;
    let mockAudioManager;

    beforeEach(() => {
        // Mock AudioManager
        mockAudioManager = {
            isReady: vi.fn(() => true),
            loadSound: vi.fn(() => Promise.resolve()),
            loadMusic: vi.fn(() => Promise.resolve()),
            playSound: vi.fn(),
            playMusic: vi.fn(),
            stopMusic: vi.fn(),
            setVolume: vi.fn(),
            setMusicVolume: vi.fn(),
            setSfxVolume: vi.fn(),
            getSystemInfo: vi.fn(() => ({
                isEnabled: true,
                isInitialized: true,
                useWebAudio: true
            }))
        };

        audioService = new AudioService();
    });

    afterEach(() => {
        if (audioService) {
            audioService.cleanup();
        }
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(audioService.isInitialized).toBe(false);
            expect(audioService.currentLevelMusic).toBe(null);
            expect(audioService.soundsLoaded.size).toBe(0);
            expect(audioService.musicLoaded.size).toBe(0);
        });

        it('should initialize with AudioManager', async () => {
            await audioService.init(mockAudioManager);
            
            expect(audioService.audioManager).toBe(mockAudioManager);
            expect(audioService.isInitialized).toBe(true);
            expect(mockAudioManager.loadSound).toHaveBeenCalled();
            expect(mockAudioManager.loadMusic).toHaveBeenCalled();
        });

        it('should handle initialization without AudioManager', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            await audioService.init(null);
            
            expect(audioService.isInitialized).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('AudioService: No AudioManager provided');
            
            consoleSpy.mockRestore();
        });

        it('should handle AudioManager not ready', async () => {
            mockAudioManager.isReady = vi.fn(() => false);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            await audioService.init(mockAudioManager);
            
            expect(audioService.isInitialized).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('AudioService: AudioManager not ready');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Sound Loading', () => {
        beforeEach(async () => {
            await audioService.init(mockAudioManager);
        });

        it('should load sound effects', async () => {
            // Clear previous calls from initialization
            mockAudioManager.loadSound.mockClear();
            
            // Test with a sound that's not loaded during initialization
            await audioService.loadSoundEffect('virgilio_found');
            
            expect(mockAudioManager.loadSound).toHaveBeenCalledWith('virgilio_found', '/audio/sfx/virgilio_found.mp3');
        });

        it('should load music tracks', async () => {
            // Clear previous calls from initialization
            mockAudioManager.loadMusic.mockClear();
            
            // Test with a music track that's not loaded during initialization
            await audioService.loadMusicTrack('level_1_forest');
            
            expect(mockAudioManager.loadMusic).toHaveBeenCalledWith('level_1_forest', '/audio/music/level_1_forest.mp3');
        });

        it('should not reload already loaded sounds', async () => {
            audioService.soundsLoaded.add('test_sound');
            
            await audioService.loadSoundEffect('test_sound');
            
            expect(mockAudioManager.loadSound).not.toHaveBeenCalledWith('test_sound', expect.any(String));
        });

        it('should handle missing sound paths', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            await audioService.loadSoundEffect('non_existent_sound');
            
            expect(consoleSpy).toHaveBeenCalledWith('AudioService: No path defined for sound: non_existent_sound');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Sound Playback', () => {
        beforeEach(async () => {
            await audioService.init(mockAudioManager);
            audioService.soundsLoaded.add('move_step');
            audioService.soundsLoaded.add('move_blocked');
        });

        it('should play sound effects', () => {
            audioService.playSoundEffect('move_step');
            
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('move_step', expect.any(Object));
        });

        it('should not play unloaded sounds', () => {
            audioService.playSoundEffect('unloaded_sound');
            
            expect(mockAudioManager.playSound).not.toHaveBeenCalled();
        });

        it('should respect cooldown periods', () => {
            audioService.playSoundEffect('move_step');
            audioService.playSoundEffect('move_step'); // Should be blocked by cooldown
            
            expect(mockAudioManager.playSound).toHaveBeenCalledTimes(1);
        });

        it('should play music tracks', async () => {
            audioService.musicLoaded.add('menu_theme');
            
            await audioService.playMusic('menu_theme');
            
            expect(mockAudioManager.playMusic).toHaveBeenCalledWith('menu_theme', expect.any(Object));
            expect(audioService.currentLevelMusic).toBe('menu_theme');
        });

        it('should stop music', () => {
            audioService.currentLevelMusic = 'test_music';
            
            audioService.stopMusic();
            
            expect(mockAudioManager.stopMusic).toHaveBeenCalled();
            expect(audioService.currentLevelMusic).toBe(null);
        });
    });

    describe('Game Event Audio', () => {
        beforeEach(async () => {
            await audioService.init(mockAudioManager);
            audioService.soundsLoaded.add('move_step');
            audioService.soundsLoaded.add('move_blocked');
            audioService.soundsLoaded.add('virgilio_found');
            audioService.soundsLoaded.add('fragment_collected');
            audioService.soundsLoaded.add('exit_unlocked');
            audioService.soundsLoaded.add('menu_select');
            audioService.soundsLoaded.add('button_click');
        });

        it('should play movement sounds', () => {
            audioService.playMovementSound(true);
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('move_step', expect.any(Object));
            
            audioService.playMovementSound(false);
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('move_blocked', expect.any(Object));
        });

        it('should play objective completion sounds', () => {
            audioService.playObjectiveSound('virgilio');
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('virgilio_found', expect.any(Object));
            
            audioService.playObjectiveSound('fragment');
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('fragment_collected', expect.any(Object));
            
            audioService.playObjectiveSound('exit');
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('exit_unlocked', expect.any(Object));
        });

        it('should play UI interaction sounds', () => {
            audioService.playUISound('select');
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('menu_select', expect.any(Object));
            
            audioService.playUISound('click');
            expect(mockAudioManager.playSound).toHaveBeenCalledWith('button_click', expect.any(Object));
        });
    });

    describe('Level Audio Management', () => {
        beforeEach(async () => {
            await audioService.init(mockAudioManager);
        });

        it('should play level-specific music', async () => {
            audioService.musicLoaded.add('level_1_forest');
            
            await audioService.playLevelMusic(1);
            
            expect(mockAudioManager.playMusic).toHaveBeenCalledWith('level_1_forest', expect.any(Object));
        });

        it('should play menu music', async () => {
            audioService.musicLoaded.add('menu_theme');
            
            await audioService.playMenuMusic();
            
            expect(mockAudioManager.playMusic).toHaveBeenCalledWith('menu_theme', expect.any(Object));
        });

        it('should load level audio', async () => {
            await audioService.loadLevelAudio(1);
            
            expect(mockAudioManager.loadMusic).toHaveBeenCalledWith('level_1_forest', expect.any(String));
            expect(mockAudioManager.loadSound).toHaveBeenCalledWith('virgilio_found', expect.any(String));
            expect(mockAudioManager.loadSound).toHaveBeenCalledWith('fragment_collected', expect.any(String));
        });
    });

    describe('Volume Control', () => {
        beforeEach(async () => {
            await audioService.init(mockAudioManager);
        });

        it('should set volume levels', () => {
            audioService.setVolume(0.8, 0.6, 0.9);
            
            expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.8);
            expect(mockAudioManager.setMusicVolume).toHaveBeenCalledWith(0.6);
            expect(mockAudioManager.setSfxVolume).toHaveBeenCalledWith(0.9);
        });

        it('should set only master volume', () => {
            audioService.setVolume(0.5);
            
            expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5);
            expect(mockAudioManager.setMusicVolume).not.toHaveBeenCalled();
            expect(mockAudioManager.setSfxVolume).not.toHaveBeenCalled();
        });
    });

    describe('Status and Cleanup', () => {
        beforeEach(async () => {
            await audioService.init(mockAudioManager);
        });

        it('should return status information', () => {
            const status = audioService.getStatus();
            
            expect(status).toHaveProperty('isReady');
            expect(status).toHaveProperty('soundsLoaded');
            expect(status).toHaveProperty('musicLoaded');
            expect(status).toHaveProperty('currentMusic');
            expect(status).toHaveProperty('audioManagerInfo');
        });

        it('should report ready state correctly', () => {
            expect(audioService.isReady()).toBe(true);
        });

        it('should cleanup resources', () => {
            audioService.soundsLoaded.add('test');
            audioService.musicLoaded.add('test');
            audioService.currentLevelMusic = 'test';
            
            audioService.cleanup();
            
            expect(audioService.soundsLoaded.size).toBe(0);
            expect(audioService.musicLoaded.size).toBe(0);
            expect(audioService.currentLevelMusic).toBe(null);
            expect(audioService.isInitialized).toBe(false);
            expect(mockAudioManager.stopMusic).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle service not ready', () => {
            audioService.isInitialized = false;
            
            audioService.playSoundEffect('test_sound');
            
            expect(mockAudioManager.playSound).not.toHaveBeenCalled();
        });

        it('should handle AudioManager not ready', async () => {
            mockAudioManager.isReady = vi.fn(() => false);
            await audioService.init(mockAudioManager);
            
            audioService.playSoundEffect('test_sound');
            
            expect(mockAudioManager.playSound).not.toHaveBeenCalled();
        });
    });
});