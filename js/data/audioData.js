/**
 * Audio Data Configuration
 * Defines sound effects and music tracks for the game
 */

export const SOUND_EFFECTS = {
  // Movement sounds
  MOVE_STEP: "move_step",
  MOVE_BLOCKED: "move_blocked",

  // Objective completion sounds
  VIRGILIO_FOUND: "virgilio_found",
  FRAGMENT_COLLECTED: "fragment_collected",
  EXIT_UNLOCKED: "exit_unlocked",
  LEVEL_COMPLETE: "level_complete",

  // UI interaction sounds
  MENU_SELECT: "menu_select",
  MENU_NAVIGATE: "menu_navigate",
  MENU_BACK: "menu_back",
  BUTTON_CLICK: "button_click",

  // Atmospheric sounds
  AMBIENT_FOREST: "ambient_forest",
  AMBIENT_HELL: "ambient_hell",

  // Error/feedback sounds
  ERROR: "error",
  SUCCESS: "success",
};

export const MUSIC_TRACKS = {
  MENU_THEME: "menu_theme",
  LEVEL_1_FOREST: "level_1_forest",
  LEVEL_2_LIMBO: "level_2_limbo",
  LEVEL_3_LUST: "level_3_lust",
  LEVEL_4_GLUTTONY: "level_4_gluttony",
  LEVEL_5_GREED: "level_5_greed",
  LEVEL_6_WRATH: "level_6_wrath",
  LEVEL_7_HERESY: "level_7_heresy",
  LEVEL_8_VIOLENCE: "level_8_violence",
  LEVEL_9_FRAUD: "level_9_fraud",
  LEVEL_10_TREACHERY: "level_10_treachery",
};

// Audio file paths (using placeholder URLs for now)
export const AUDIO_PATHS = {
  // Sound effects paths
  [SOUND_EFFECTS.MOVE_STEP]: "/audio/sfx/move_step.mp3",
  [SOUND_EFFECTS.MOVE_BLOCKED]: "/audio/sfx/move_blocked.mp3",
  [SOUND_EFFECTS.VIRGILIO_FOUND]: "/audio/sfx/virgilio_found.mp3",
  [SOUND_EFFECTS.FRAGMENT_COLLECTED]: "/audio/sfx/fragment_collected.mp3",
  [SOUND_EFFECTS.EXIT_UNLOCKED]: "/audio/sfx/exit_unlocked.mp3",
  [SOUND_EFFECTS.LEVEL_COMPLETE]: "/audio/sfx/level_complete.mp3",
  [SOUND_EFFECTS.MENU_SELECT]: "/audio/sfx/menu_select.mp3",
  [SOUND_EFFECTS.MENU_NAVIGATE]: "/audio/sfx/menu_navigate.mp3",
  [SOUND_EFFECTS.MENU_BACK]: "/audio/sfx/menu_back.mp3",
  [SOUND_EFFECTS.BUTTON_CLICK]: "/audio/sfx/button_click.mp3",
  [SOUND_EFFECTS.AMBIENT_FOREST]: "/audio/sfx/ambient_forest.mp3",
  [SOUND_EFFECTS.AMBIENT_HELL]: "/audio/sfx/ambient_hell.mp3",
  [SOUND_EFFECTS.ERROR]: "/audio/sfx/error.mp3",
  [SOUND_EFFECTS.SUCCESS]: "/audio/sfx/success.mp3",

  // Music tracks paths
  [MUSIC_TRACKS.MENU_THEME]: "/audio/music/menu_theme.mp3",
  [MUSIC_TRACKS.LEVEL_1_FOREST]: "/audio/music/level_1_forest.mp3",
  [MUSIC_TRACKS.LEVEL_2_LIMBO]: "/audio/music/level_2_limbo.mp3",
  [MUSIC_TRACKS.LEVEL_3_LUST]: "/audio/music/level_3_lust.mp3",
  [MUSIC_TRACKS.LEVEL_4_GLUTTONY]: "/audio/music/level_4_gluttony.mp3",
  [MUSIC_TRACKS.LEVEL_5_GREED]: "/audio/music/level_5_greed.mp3",
  [MUSIC_TRACKS.LEVEL_6_WRATH]: "/audio/music/level_6_wrath.mp3",
  [MUSIC_TRACKS.LEVEL_7_HERESY]: "/audio/music/level_7_heresy.mp3",
  [MUSIC_TRACKS.LEVEL_8_VIOLENCE]: "/audio/music/level_8_violence.mp3",
  [MUSIC_TRACKS.LEVEL_9_FRAUD]: "/audio/music/level_9_fraud.mp3",
  [MUSIC_TRACKS.LEVEL_10_TREACHERY]: "/audio/music/level_10_treachery.mp3",
};

// Audio configuration for different sound types
export const AUDIO_CONFIG = {
  soundEffects: {
    [SOUND_EFFECTS.MOVE_STEP]: {
      volume: 0.3,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.MOVE_BLOCKED]: {
      volume: 0.4,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.VIRGILIO_FOUND]: {
      volume: 0.8,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.FRAGMENT_COLLECTED]: {
      volume: 0.6,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.EXIT_UNLOCKED]: {
      volume: 0.7,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.LEVEL_COMPLETE]: {
      volume: 0.9,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.MENU_SELECT]: {
      volume: 0.5,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.MENU_NAVIGATE]: {
      volume: 0.3,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.MENU_BACK]: {
      volume: 0.4,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.BUTTON_CLICK]: {
      volume: 0.4,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.AMBIENT_FOREST]: {
      volume: 0.2,
      loop: true,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.AMBIENT_HELL]: {
      volume: 0.3,
      loop: true,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.ERROR]: {
      volume: 0.5,
      loop: false,
      playbackRate: 1.0,
    },
    [SOUND_EFFECTS.SUCCESS]: {
      volume: 0.6,
      loop: false,
      playbackRate: 1.0,
    },
  },

  music: {
    [MUSIC_TRACKS.MENU_THEME]: {
      volume: 0.4,
      fadeIn: true,
      fadeDuration: 2000,
    },
    [MUSIC_TRACKS.LEVEL_1_FOREST]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_2_LIMBO]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_3_LUST]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_4_GLUTTONY]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_5_GREED]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_6_WRATH]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_7_HERESY]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_8_VIOLENCE]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_9_FRAUD]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
    [MUSIC_TRACKS.LEVEL_10_TREACHERY]: {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 3000,
    },
  },
};

// Level-specific music mapping
export const LEVEL_MUSIC_MAP = {
  1: MUSIC_TRACKS.LEVEL_1_FOREST,
  2: MUSIC_TRACKS.LEVEL_2_LIMBO,
  3: MUSIC_TRACKS.LEVEL_3_LUST,
  4: MUSIC_TRACKS.LEVEL_4_GLUTTONY,
  5: MUSIC_TRACKS.LEVEL_5_GREED,
  6: MUSIC_TRACKS.LEVEL_6_WRATH,
  7: MUSIC_TRACKS.LEVEL_7_HERESY,
  8: MUSIC_TRACKS.LEVEL_8_VIOLENCE,
  9: MUSIC_TRACKS.LEVEL_9_FRAUD,
  10: MUSIC_TRACKS.LEVEL_10_TREACHERY,
};

/**
 * Get sound effect configuration
 * @param {string} soundName - Sound effect name
 * @returns {Object} - Sound configuration
 */
export function getSoundConfig(soundName) {
  return (
    AUDIO_CONFIG.soundEffects[soundName] || {
      volume: 0.5,
      loop: false,
      playbackRate: 1.0,
    }
  );
}

/**
 * Get music configuration
 * @param {string} musicName - Music track name
 * @returns {Object} - Music configuration
 */
export function getMusicConfig(musicName) {
  return (
    AUDIO_CONFIG.music[musicName] || {
      volume: 0.3,
      fadeIn: true,
      fadeDuration: 2000,
    }
  );
}

/**
 * Get music track for level
 * @param {number} levelNumber - Level number
 * @returns {string} - Music track name
 */
export function getLevelMusic(levelNumber) {
  return LEVEL_MUSIC_MAP[levelNumber] || MUSIC_TRACKS.LEVEL_1_FOREST;
}
