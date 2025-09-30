/**
 * Save Manager
 * Handles game state persistence using localStorage
 */

export class SaveManager {
  constructor() {
    this.saveKey = "danteInfernoGameSave";
    this.settingsKey = "danteInfernoSettings";
    this.backupKey = "danteInfernoGameSave_backup";
    this.saveVersion = "1.0.0";
    this.maxSaveSize = 1024 * 1024; // 1MB limit for safety
  }

  /**
   * Save game state to localStorage with error handling and validation
   * @param {Object} gameState - Complete game state object
   * @returns {boolean} - Success status
   */
  saveGame(gameState) {
    try {
      // Test localStorage availability first (but don't call testLocalStorage to avoid side effects)
      if (typeof Storage === "undefined" || !window.localStorage) {
        console.error("localStorage not available for saving");
        return false;
      }

      // Validate game state before saving
      if (!this.validateGameState(gameState)) {
        console.error("Invalid game state provided to saveGame");
        return false;
      }

      // Create save data with metadata
      const saveData = {
        version: this.saveVersion,
        timestamp: Date.now(),
        gameState: this.serializeGameState(gameState),
        offline: !navigator.onLine, // Track if saved while offline
      };

      // Convert to JSON string
      const saveString = JSON.stringify(saveData);

      // Check size limit
      if (saveString.length > this.maxSaveSize) {
        console.error("Save data exceeds maximum size limit");
        return false;
      }

      // Create backup of existing save before overwriting
      this.createBackup();

      // Save to localStorage with retry mechanism
      const saveSuccess = this.saveWithRetry(this.saveKey, saveString);

      if (saveSuccess) {
        console.log("Game saved successfully");
        return true;
      } else {
        throw new Error("Failed to save after retries");
      }
    } catch (error) {
      console.error("Failed to save game:", error);

      // Attempt to restore from backup if save failed
      this.restoreFromBackup();
      return false;
    }
  }

  /**
   * Load game state from localStorage with validation and error recovery
   * @returns {Object|null} - Game state object or null if no valid save exists
   */
  loadGame() {
    try {
      // Try to load from primary save
      const saveString = localStorage.getItem(this.saveKey);

      if (!saveString) {
        console.log("No save data found");
        return null;
      }

      // Parse JSON data
      const saveData = JSON.parse(saveString);

      // Validate save data structure
      if (!this.validateSaveData(saveData)) {
        console.warn("Invalid save data structure, attempting backup recovery");
        return this.loadFromBackup();
      }

      // Check version compatibility
      if (!this.isVersionCompatible(saveData.version)) {
        console.warn("Save version incompatible, attempting migration");
        const migratedState = this.migrateSaveData(saveData);
        if (migratedState) {
          return migratedState;
        }
        return this.loadFromBackup();
      }

      // Deserialize and validate game state
      const gameState = this.deserializeGameState(saveData.gameState);

      if (!this.validateGameState(gameState)) {
        console.warn("Corrupted game state, attempting backup recovery");
        return this.loadFromBackup();
      }

      console.log("Game loaded successfully");
      return gameState;
    } catch (error) {
      console.error("Failed to load game:", error);

      // Attempt to load from backup
      return this.loadFromBackup();
    }
  }

  /**
   * Clear all save data including backups
   * @returns {boolean} - Success status
   */
  clearSave() {
    try {
      localStorage.removeItem(this.saveKey);
      localStorage.removeItem(this.backupKey);
      localStorage.removeItem(this.settingsKey);

      console.log("Save data cleared successfully");
      return true;
    } catch (error) {
      console.error("Failed to clear save data:", error);
      return false;
    }
  }

  /**
   * Auto-save game state with throttling and validation
   * @param {Object} gameState - Game state to save
   * @param {boolean} force - Force save even if throttled
   * @returns {boolean} - Success status
   */
  autoSave(gameState, force = false) {
    try {
      // Initialize auto-save properties if not already done
      if (!this.autoSaveState) {
        this.autoSaveState = {
          lastSaveTime: 0,
          saveThrottle: 5000, // 5 seconds between auto-saves
          pendingSave: false,
          saveQueue: null,
          consecutiveFailures: 0,
          maxFailures: 3,
          backoffMultiplier: 2,
          baseThrottle: 5000,
        };
      }

      const now = Date.now();
      const timeSinceLastSave = now - this.autoSaveState.lastSaveTime;

      // Validate game state before auto-saving
      if (!this.validateAutoSaveState(gameState)) {
        console.warn("Auto-save skipped due to invalid game state");
        return false;
      }

      // Check for significant changes to avoid unnecessary saves
      if (!force && !this.hasSignificantChanges(gameState)) {
        console.log("Auto-save skipped - no significant changes detected");
        return true;
      }

      // Check if we should throttle the save
      if (!force && timeSinceLastSave < this.autoSaveState.saveThrottle) {
        // Queue the save for later if not already queued
        if (!this.autoSaveState.pendingSave) {
          this.queueAutoSave(gameState);
        }
        return true; // Return true as save is queued
      }

      // Attempt to save
      const saveResult = this.saveGame(gameState);

      if (saveResult) {
        // Reset failure counter on successful save
        this.autoSaveState.consecutiveFailures = 0;
        this.autoSaveState.saveThrottle = this.autoSaveState.baseThrottle;
        this.autoSaveState.lastSaveTime = now;
        this.autoSaveState.lastSavedState = this.createStateSnapshot(gameState);

        console.log("Auto-save completed successfully");
        return true;
      } else {
        // Handle save failure with exponential backoff
        this.handleAutoSaveFailure();
        return false;
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      this.handleAutoSaveFailure();
      return false;
    }
  }

  /**
   * Check if save exists
   * @returns {boolean} - True if save exists
   */
  hasSave() {
    try {
      const saveString = localStorage.getItem(this.saveKey);
      if (!saveString) return false;

      // Quick validation to ensure it's not corrupted
      const saveData = JSON.parse(saveString);
      return this.validateSaveData(saveData);
    } catch (error) {
      console.warn("Save data appears corrupted:", error);
      return false;
    }
  }

  /**
   * Get save metadata without loading full game state
   * @returns {Object|null} - Save metadata or null
   */
  getSaveInfo() {
    try {
      const saveString = localStorage.getItem(this.saveKey);
      if (!saveString) return null;

      const saveData = JSON.parse(saveString);

      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        date: new Date(saveData.timestamp).toLocaleString("es-ES"),
        level: saveData.gameState?.currentLevel || 1,
        playTime: saveData.gameState?.gameStats?.playTime || 0,
      };
    } catch (error) {
      console.error("Failed to get save info:", error);
      return null;
    }
  }

  /**
   * Serialize game state for storage
   * @param {Object} gameState - Game state object
   * @returns {Object} - Serialized game state
   */
  serializeGameState(gameState) {
    // Create a clean copy with only serializable data
    return {
      currentLevel: gameState.currentLevel,
      playerPosition: { ...gameState.playerPosition },
      collectedItems: [...gameState.collectedItems],
      objectivesCompleted: { ...gameState.objectivesCompleted },
      gameSettings: { ...gameState.gameSettings },
      gameStats: { ...gameState.gameStats },
      levelProgress: [...gameState.levelProgress],
      // Note: currentMaze is not saved as it will be regenerated
      // Add any additional serializable state here
    };
  }

  /**
   * Deserialize game state from storage
   * @param {Object} serializedState - Serialized game state
   * @returns {Object} - Deserialized game state
   */
  deserializeGameState(serializedState) {
    // Ensure all required properties exist with defaults
    return {
      currentLevel: serializedState.currentLevel || 1,
      playerPosition: serializedState.playerPosition || { x: 0, y: 0 },
      collectedItems: serializedState.collectedItems || [],
      objectivesCompleted: serializedState.objectivesCompleted || {
        virgilioFound: false,
        fragmentsCollected: 0,
        exitUnlocked: false,
      },
      gameSettings: serializedState.gameSettings || {
        volume: 0.7,
        difficulty: "normal",
      },
      gameStats: serializedState.gameStats || {
        playTime: 0,
        deathCount: 0,
        dialoguesSeen: [],
      },
      levelProgress: serializedState.levelProgress || [],
      currentMaze: null, // Will be regenerated
    };
  }

  /**
   * Validate game state structure
   * @param {Object} gameState - Game state to validate
   * @returns {boolean} - True if valid
   */
  validateGameState(gameState) {
    if (!gameState || typeof gameState !== "object") {
      return false;
    }

    // Check required properties
    const requiredProps = [
      "currentLevel",
      "playerPosition",
      "objectivesCompleted",
      "gameSettings",
      "gameStats",
    ];

    for (const prop of requiredProps) {
      if (!(prop in gameState)) {
        console.error(`Missing required property: ${prop}`);
        return false;
      }
    }

    // Validate specific property types and ranges
    if (
      typeof gameState.currentLevel !== "number" ||
      gameState.currentLevel < 1
    ) {
      console.error("Invalid currentLevel");
      return false;
    }

    if (
      !gameState.playerPosition ||
      typeof gameState.playerPosition.x !== "number" ||
      typeof gameState.playerPosition.y !== "number"
    ) {
      console.error("Invalid playerPosition");
      return false;
    }

    if (
      !gameState.objectivesCompleted ||
      typeof gameState.objectivesCompleted.virgilioFound !== "boolean" ||
      typeof gameState.objectivesCompleted.fragmentsCollected !== "number"
    ) {
      console.error("Invalid objectivesCompleted");
      return false;
    }

    return true;
  }

  /**
   * Validate save data structure
   * @param {Object} saveData - Save data to validate
   * @returns {boolean} - True if valid
   */
  validateSaveData(saveData) {
    if (!saveData || typeof saveData !== "object") {
      return false;
    }

    // Check required save data properties
    if (!saveData.version || !saveData.timestamp || !saveData.gameState) {
      return false;
    }

    // Validate timestamp
    if (typeof saveData.timestamp !== "number" || saveData.timestamp <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if save version is compatible
   * @param {string} version - Save version to check
   * @returns {boolean} - True if compatible
   */
  isVersionCompatible(version) {
    // For now, only accept exact version match
    // Future versions can implement backward compatibility
    return version === this.saveVersion;
  }

  /**
   * Migrate save data from older versions
   * @param {Object} saveData - Old save data
   * @returns {Object|null} - Migrated game state or null
   */
  migrateSaveData(saveData) {
    // Placeholder for future version migrations
    console.warn(
      "Save data migration not implemented for version:",
      saveData.version
    );
    return null;
  }

  /**
   * Create backup of current save
   */
  createBackup() {
    try {
      const currentSave = localStorage.getItem(this.saveKey);
      if (currentSave) {
        localStorage.setItem(this.backupKey, currentSave);
      }
    } catch (error) {
      console.warn("Failed to create backup:", error);
    }
  }

  /**
   * Restore from backup save
   */
  restoreFromBackup() {
    try {
      const backup = localStorage.getItem(this.backupKey);
      if (backup) {
        localStorage.setItem(this.saveKey, backup);
        console.log("Restored from backup save");
      }
    } catch (error) {
      console.error("Failed to restore from backup:", error);
    }
  }

  /**
   * Load game state from backup
   * @returns {Object|null} - Game state from backup or null
   */
  loadFromBackup() {
    try {
      const backupString = localStorage.getItem(this.backupKey);

      if (!backupString) {
        console.log("No backup save found");
        return null;
      }

      const saveData = JSON.parse(backupString);

      if (!this.validateSaveData(saveData)) {
        console.error("Backup save is also corrupted");
        return null;
      }

      const gameState = this.deserializeGameState(saveData.gameState);

      if (!this.validateGameState(gameState)) {
        console.error("Backup game state is corrupted");
        return null;
      }

      console.log("Loaded from backup save");
      return gameState;
    } catch (error) {
      console.error("Failed to load from backup:", error);
      return null;
    }
  }

  /**
   * Get localStorage usage information
   * @returns {Object} - Storage usage stats
   */
  getStorageInfo() {
    try {
      const saveSize = localStorage.getItem(this.saveKey)?.length || 0;
      const backupSize = localStorage.getItem(this.backupKey)?.length || 0;
      const settingsSize = localStorage.getItem(this.settingsKey)?.length || 0;

      return {
        totalSize: saveSize + backupSize + settingsSize,
        saveSize,
        backupSize,
        settingsSize,
        maxSize: this.maxSaveSize,
        usagePercent: (
          ((saveSize + backupSize + settingsSize) / this.maxSaveSize) *
          100
        ).toFixed(2),
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return null;
    }
  }

  /**
   * Test localStorage availability and functionality
   * @returns {boolean} - True if localStorage is working
   */
  testLocalStorage() {
    try {
      const testKey = "danteInfernoTest";
      const testValue = "test";

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      return retrieved === testValue;
    } catch (error) {
      console.error("localStorage test failed:", error);
      return false;
    }
  }

  /**
   * Queue an auto-save for later execution
   * @param {Object} gameState - Game state to save later
   */
  queueAutoSave(gameState) {
    if (this.autoSaveState.saveQueue) {
      clearTimeout(this.autoSaveState.saveQueue);
    }

    this.autoSaveState.pendingSave = true;

    const delay =
      this.autoSaveState.saveThrottle -
      (Date.now() - this.autoSaveState.lastSaveTime);

    this.autoSaveState.saveQueue = setTimeout(() => {
      this.autoSaveState.pendingSave = false;
      this.autoSaveState.saveQueue = null;
      this.autoSave(gameState, true); // Force save when queue executes
    }, Math.max(delay, 0));

    console.log(`Auto-save queued for ${Math.max(delay, 0)}ms`);
  }

  /**
   * Validate game state for auto-save (more lenient than regular save)
   * @param {Object} gameState - Game state to validate
   * @returns {boolean} - True if valid for auto-save
   */
  validateAutoSaveState(gameState) {
    if (!gameState || typeof gameState !== "object") {
      return false;
    }

    // Check critical properties only for auto-save
    const criticalProps = ["currentLevel", "playerPosition"];

    for (const prop of criticalProps) {
      if (!(prop in gameState)) {
        console.warn(`Auto-save validation failed: missing ${prop}`);
        return false;
      }
    }

    // Validate currentLevel
    if (
      typeof gameState.currentLevel !== "number" ||
      gameState.currentLevel < 1
    ) {
      console.warn("Auto-save validation failed: invalid currentLevel");
      return false;
    }

    // Validate playerPosition
    if (
      !gameState.playerPosition ||
      typeof gameState.playerPosition.x !== "number" ||
      typeof gameState.playerPosition.y !== "number"
    ) {
      console.warn("Auto-save validation failed: invalid playerPosition");
      return false;
    }

    return true;
  }

  /**
   * Check if game state has significant changes worth saving
   * @param {Object} gameState - Current game state
   * @returns {boolean} - True if significant changes detected
   */
  hasSignificantChanges(gameState) {
    if (!this.autoSaveState.lastSavedState) {
      return true; // First save is always significant
    }

    const lastState = this.autoSaveState.lastSavedState;
    const currentState = gameState;

    // Check for level changes
    if (currentState.currentLevel !== lastState.currentLevel) {
      return true;
    }

    // Check for position changes (only if significant movement)
    if (currentState.playerPosition && lastState.playerPosition) {
      const positionChanged =
        Math.abs(currentState.playerPosition.x - lastState.playerPosition.x) >
          0 ||
        Math.abs(currentState.playerPosition.y - lastState.playerPosition.y) >
          0;

      if (positionChanged) {
        return true;
      }
    }

    // Check for objective changes
    if (currentState.objectivesCompleted && lastState.objectivesCompleted) {
      const lastObjectives = lastState.objectivesCompleted;
      const currentObjectives = currentState.objectivesCompleted;

      if (
        currentObjectives.virgilioFound !== lastObjectives.virgilioFound ||
        currentObjectives.fragmentsCollected !==
          lastObjectives.fragmentsCollected ||
        currentObjectives.exitUnlocked !== lastObjectives.exitUnlocked
      ) {
        return true;
      }
    }

    // Check for collected items changes
    if (currentState.collectedItems && lastState.collectedItems) {
      if (
        currentState.collectedItems.length !== lastState.collectedItems.length
      ) {
        return true;
      }
    }

    // Check for significant play time changes (save every 30 seconds of play time)
    if (currentState.gameStats && lastState.gameStats) {
      const playTimeDiff =
        (currentState.gameStats.playTime || 0) -
        (lastState.gameStats.playTime || 0);
      if (playTimeDiff >= 30000) {
        // 30 seconds
        return true;
      }
    }

    return false;
  }

  /**
   * Create a lightweight snapshot of game state for comparison
   * @param {Object} gameState - Game state to snapshot
   * @returns {Object} - State snapshot
   */
  createStateSnapshot(gameState) {
    return {
      currentLevel: gameState.currentLevel,
      playerPosition: { ...gameState.playerPosition },
      objectivesCompleted: gameState.objectivesCompleted
        ? { ...gameState.objectivesCompleted }
        : {},
      collectedItems: gameState.collectedItems
        ? [...gameState.collectedItems]
        : [],
      gameStats: gameState.gameStats
        ? {
            playTime: gameState.gameStats.playTime || 0,
            deathCount: gameState.gameStats.deathCount || 0,
          }
        : {},
    };
  }

  /**
   * Handle auto-save failure with exponential backoff
   */
  handleAutoSaveFailure() {
    if (!this.autoSaveState) return;

    this.autoSaveState.consecutiveFailures++;

    if (
      this.autoSaveState.consecutiveFailures >= this.autoSaveState.maxFailures
    ) {
      // Implement exponential backoff
      this.autoSaveState.saveThrottle = Math.min(
        this.autoSaveState.baseThrottle *
          Math.pow(
            this.autoSaveState.backoffMultiplier,
            this.autoSaveState.consecutiveFailures -
              this.autoSaveState.maxFailures
          ),
        300000 // Max 5 minutes
      );

      console.warn(
        `Auto-save failures detected. Throttle increased to ${this.autoSaveState.saveThrottle}ms`
      );
    }
  }

  /**
   * Initialize auto-save system and restore game state on startup
   * @returns {Object|null} - Restored game state or null
   */
  initializeAutoSave() {
    try {
      console.log("Initializing auto-save system...");

      // Test localStorage availability
      if (!this.testLocalStorage()) {
        console.error("localStorage not available - auto-save disabled");
        return null;
      }

      // Initialize auto-save state
      this.autoSaveState = {
        lastSaveTime: 0,
        saveThrottle: 5000,
        pendingSave: false,
        saveQueue: null,
        consecutiveFailures: 0,
        maxFailures: 3,
        backoffMultiplier: 2,
        baseThrottle: 5000,
        lastSavedState: null,
      };

      // Attempt to restore previous game state
      const restoredState = this.loadGame();

      if (restoredState) {
        console.log("Game state restored from auto-save");
        this.autoSaveState.lastSavedState =
          this.createStateSnapshot(restoredState);
        return restoredState;
      } else {
        console.log("No previous save found - starting fresh");
        return null;
      }
    } catch (error) {
      console.error("Failed to initialize auto-save system:", error);
      return null;
    }
  }

  /**
   * Set up automatic save triggers for common game events
   * @param {Object} gameEngine - Game engine instance to attach listeners to
   */
  setupAutoSaveTriggers(gameEngine) {
    if (!gameEngine) {
      console.warn("No game engine provided for auto-save triggers");
      return;
    }

    try {
      // Save on level completion
      gameEngine.on?.("levelComplete", (gameState) => {
        console.log("Auto-save triggered: level complete");
        this.autoSave(gameState, true); // Force save on level completion
      });

      // Save on objective completion
      gameEngine.on?.("objectiveComplete", (gameState) => {
        console.log("Auto-save triggered: objective complete");
        this.autoSave(gameState);
      });

      // Save on player death/restart
      gameEngine.on?.("playerDeath", (gameState) => {
        console.log("Auto-save triggered: player death");
        this.autoSave(gameState);
      });

      // Periodic auto-save during gameplay
      if (gameEngine.addPeriodicCallback) {
        gameEngine.addPeriodicCallback(
          "autoSave",
          () => {
            if (gameEngine.currentState === "playing" && gameEngine.gameState) {
              this.autoSave(gameEngine.gameState);
            }
          },
          30000
        ); // Every 30 seconds during gameplay
      }

      // Save on window beforeunload (page close/refresh)
      window.addEventListener("beforeunload", () => {
        if (gameEngine.gameState) {
          // Use synchronous save for page unload
          this.saveGame(gameEngine.gameState);
        }
      });

      // Save on visibility change (tab switch)
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && gameEngine.gameState) {
          this.autoSave(gameEngine.gameState);
        }
      });

      console.log("Auto-save triggers configured successfully");
    } catch (error) {
      console.error("Failed to setup auto-save triggers:", error);
    }
  }

  /**
   * Get auto-save system status and statistics
   * @returns {Object} - Auto-save status information
   */
  getAutoSaveStatus() {
    if (!this.autoSaveState) {
      return { enabled: false, reason: "Not initialized" };
    }

    return {
      enabled: true,
      lastSaveTime: this.autoSaveState.lastSaveTime,
      saveThrottle: this.autoSaveState.saveThrottle,
      pendingSave: this.autoSaveState.pendingSave,
      consecutiveFailures: this.autoSaveState.consecutiveFailures,
      timeSinceLastSave: Date.now() - this.autoSaveState.lastSaveTime,
      nextSaveAvailable: Math.max(
        0,
        this.autoSaveState.saveThrottle -
          (Date.now() - this.autoSaveState.lastSaveTime)
      ),
    };
  }

  /**
   * Force an immediate auto-save (bypasses throttling)
   * @param {Object} gameState - Game state to save
   * @returns {boolean} - Success status
   */
  forceSave(gameState) {
    console.log("Force save requested");
    return this.autoSave(gameState, true);
  }

  /**
   * Disable auto-save system temporarily
   */
  disableAutoSave() {
    if (this.autoSaveState) {
      if (this.autoSaveState.saveQueue) {
        clearTimeout(this.autoSaveState.saveQueue);
        this.autoSaveState.saveQueue = null;
      }
      this.autoSaveState.pendingSave = false;
      console.log("Auto-save system disabled");
    }
  }

  /**
   * Re-enable auto-save system
   */
  enableAutoSave() {
    if (this.autoSaveState) {
      this.autoSaveState.consecutiveFailures = 0;
      this.autoSaveState.saveThrottle = this.autoSaveState.baseThrottle;
      console.log("Auto-save system re-enabled");
    } else {
      this.initializeAutoSave();
    }
  }

  /**
   * Update game statistics in the save data
   * @param {Object} gameState - Current game state
   * @param {string} statType - Type of statistic to update
   * @param {*} value - Value to set or increment
   * @returns {boolean} - Success status
   */
  updateStatistics(gameState, statType, value) {
    try {
      if (!gameState.gameStats) {
        gameState.gameStats = {
          playTime: 0,
          deathCount: 0,
          dialoguesSeen: [],
          sessionStartTime: Date.now(),
          totalSessions: 0,
          levelsCompleted: 0,
          objectivesCompleted: 0,
          fragmentsCollected: 0,
          averageSessionTime: 0,
          fastestLevelCompletion: {},
          totalDistance: 0,
          achievements: [],
        };
      }

      const stats = gameState.gameStats;

      switch (statType) {
        case "playTime":
          stats.playTime = typeof value === "number" ? value : stats.playTime;
          break;

        case "incrementPlayTime":
          stats.playTime =
            (stats.playTime || 0) + (typeof value === "number" ? value : 0);
          break;

        case "death":
          stats.deathCount = (stats.deathCount || 0) + 1;
          console.log(`Death count updated: ${stats.deathCount}`);
          break;

        case "dialogue":
          if (
            typeof value === "string" &&
            !stats.dialoguesSeen.includes(value)
          ) {
            stats.dialoguesSeen.push(value);
            console.log(`New dialogue seen: ${value}`);
          }
          break;

        case "sessionStart":
          stats.sessionStartTime = Date.now();
          stats.totalSessions = (stats.totalSessions || 0) + 1;
          console.log(`Session ${stats.totalSessions} started`);
          break;

        case "sessionEnd":
          if (stats.sessionStartTime) {
            const sessionDuration = Date.now() - stats.sessionStartTime;
            const totalSessionTime =
              (stats.totalSessions - 1) * stats.averageSessionTime +
              sessionDuration;
            stats.averageSessionTime = Math.round(
              totalSessionTime / stats.totalSessions
            );
            console.log(
              `Session ended. Duration: ${Math.round(sessionDuration / 1000)}s`
            );
          }
          break;

        case "levelComplete":
          stats.levelsCompleted = (stats.levelsCompleted || 0) + 1;
          if (typeof value === "object" && value.level && value.time) {
            const currentFastest = stats.fastestLevelCompletion[value.level];
            if (!currentFastest || value.time < currentFastest) {
              stats.fastestLevelCompletion[value.level] = value.time;
              console.log(
                `New fastest time for level ${value.level}: ${Math.round(
                  value.time / 1000
                )}s`
              );
            }
          }
          break;

        case "objectiveComplete":
          stats.objectivesCompleted = (stats.objectivesCompleted || 0) + 1;
          break;

        case "fragmentCollected":
          stats.fragmentsCollected = (stats.fragmentsCollected || 0) + 1;
          break;

        case "distance":
          stats.totalDistance =
            (stats.totalDistance || 0) +
            (typeof value === "number" ? value : 0);
          break;

        case "achievement":
          if (
            typeof value === "string" &&
            !stats.achievements.includes(value)
          ) {
            stats.achievements.push(value);
            console.log(`Achievement unlocked: ${value}`);
          }
          break;

        default:
          console.warn(`Unknown statistic type: ${statType}`);
          return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to update statistics:", error);
      return false;
    }
  }

  /**
   * Get formatted statistics for display
   * @param {Object} gameState - Current game state
   * @returns {Object} - Formatted statistics
   */
  getFormattedStatistics(gameState) {
    try {
      if (!gameState.gameStats) {
        return this.getDefaultStatistics();
      }

      const stats = gameState.gameStats;

      return {
        playTime: this.formatTime(stats.playTime || 0),
        playTimeMs: stats.playTime || 0,
        deathCount: stats.deathCount || 0,
        dialoguesSeen: stats.dialoguesSeen ? stats.dialoguesSeen.length : 0,
        totalDialogues: stats.dialoguesSeen || [],
        totalSessions: stats.totalSessions || 0,
        averageSessionTime: this.formatTime(stats.averageSessionTime || 0),
        levelsCompleted: stats.levelsCompleted || 0,
        objectivesCompleted: stats.objectivesCompleted || 0,
        fragmentsCollected: stats.fragmentsCollected || 0,
        totalDistance: Math.round(stats.totalDistance || 0),
        achievements: stats.achievements || [],
        fastestCompletions: stats.fastestLevelCompletion || {},
        efficiency: this.calculateEfficiency(stats),
        completionRate: this.calculateCompletionRate(gameState, stats),
      };
    } catch (error) {
      console.error("Failed to get formatted statistics:", error);
      return this.getDefaultStatistics();
    }
  }

  /**
   * Get default statistics structure
   * @returns {Object} - Default statistics
   */
  getDefaultStatistics() {
    return {
      playTime: "0:00:00",
      playTimeMs: 0,
      deathCount: 0,
      dialoguesSeen: 0,
      totalDialogues: [],
      totalSessions: 0,
      averageSessionTime: "0:00:00",
      levelsCompleted: 0,
      objectivesCompleted: 0,
      fragmentsCollected: 0,
      totalDistance: 0,
      achievements: [],
      fastestCompletions: {},
      efficiency: 0,
      completionRate: 0,
    };
  }

  /**
   * Format time in milliseconds to readable string
   * @param {number} timeMs - Time in milliseconds
   * @returns {string} - Formatted time string (H:MM:SS)
   */
  formatTime(timeMs) {
    if (!timeMs || timeMs < 0) return "0:00:00";

    const totalSeconds = Math.floor(timeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  /**
   * Calculate player efficiency based on statistics
   * @param {Object} stats - Game statistics
   * @returns {number} - Efficiency percentage (0-100)
   */
  calculateEfficiency(stats) {
    try {
      if (!stats.playTime || stats.playTime === 0) return 0;

      const objectivesPerHour =
        (stats.objectivesCompleted || 0) / (stats.playTime / 3600000);
      const deathRate = (stats.deathCount || 0) / (stats.playTime / 3600000);

      // Base efficiency on objectives completed vs time played, penalized by death rate
      const baseEfficiency = Math.min(objectivesPerHour * 10, 100);
      const deathPenalty = Math.min(deathRate * 5, 50);

      return Math.max(0, Math.round(baseEfficiency - deathPenalty));
    } catch (error) {
      console.error("Failed to calculate efficiency:", error);
      return 0;
    }
  }

  /**
   * Calculate completion rate based on current progress
   * @param {Object} gameState - Current game state
   * @param {Object} stats - Game statistics
   * @returns {number} - Completion percentage (0-100)
   */
  calculateCompletionRate(gameState, stats) {
    try {
      // Estimate total content based on current level and objectives
      const currentLevel = gameState.currentLevel || 1;
      const estimatedTotalLevels = 10; // Based on Divine Comedy circles
      const estimatedObjectivesPerLevel = 4; // Virgilio + 3 fragments typically

      const levelProgress = (currentLevel - 1) / estimatedTotalLevels;
      const objectiveProgress =
        (stats.objectivesCompleted || 0) /
        (estimatedTotalLevels * estimatedObjectivesPerLevel);

      // Weight level progression more heavily than individual objectives
      const completionRate =
        (levelProgress * 0.7 + objectiveProgress * 0.3) * 100;

      return Math.min(100, Math.round(completionRate));
    } catch (error) {
      console.error("Failed to calculate completion rate:", error);
      return 0;
    }
  }

  /**
   * Track dialogue viewing for narrative progress
   * @param {Object} gameState - Current game state
   * @param {string} dialogueId - Unique identifier for the dialogue
   * @param {Object} dialogueData - Additional dialogue metadata
   * @returns {boolean} - Success status
   */
  trackDialogue(gameState, dialogueId, dialogueData = {}) {
    try {
      if (!dialogueId || typeof dialogueId !== "string") {
        console.warn("Invalid dialogue ID provided");
        return false;
      }

      // Update basic dialogue tracking
      this.updateStatistics(gameState, "dialogue", dialogueId);

      // Store additional dialogue metadata if provided
      if (!gameState.dialogueMetadata) {
        gameState.dialogueMetadata = {};
      }

      gameState.dialogueMetadata[dialogueId] = {
        firstSeen:
          gameState.dialogueMetadata[dialogueId]?.firstSeen || Date.now(),
        lastSeen: Date.now(),
        viewCount: (gameState.dialogueMetadata[dialogueId]?.viewCount || 0) + 1,
        level: gameState.currentLevel,
        ...dialogueData,
      };

      console.log(
        `Dialogue tracked: ${dialogueId} (viewed ${gameState.dialogueMetadata[dialogueId].viewCount} times)`
      );
      return true;
    } catch (error) {
      console.error("Failed to track dialogue:", error);
      return false;
    }
  }

  /**
   * Get dialogue statistics and progress
   * @param {Object} gameState - Current game state
   * @returns {Object} - Dialogue statistics
   */
  getDialogueStatistics(gameState) {
    try {
      const stats = gameState.gameStats || {};
      const metadata = gameState.dialogueMetadata || {};

      const dialoguesSeen = stats.dialoguesSeen || [];
      const uniqueDialogues = dialoguesSeen.length;

      // Calculate dialogue categories
      const categories = {
        narrative: 0,
        tutorial: 0,
        character: 0,
        objective: 0,
      };

      Object.values(metadata).forEach((dialogue) => {
        const category = dialogue.category || "narrative";
        if (categories.hasOwnProperty(category)) {
          categories[category]++;
        }
      });

      return {
        totalSeen: uniqueDialogues,
        categories,
        recentDialogues: dialoguesSeen.slice(-5), // Last 5 dialogues
        mostViewedDialogue: this.getMostViewedDialogue(metadata),
        dialogueMetadata: metadata,
      };
    } catch (error) {
      console.error("Failed to get dialogue statistics:", error);
      return {
        totalSeen: 0,
        categories: { narrative: 0, tutorial: 0, character: 0, objective: 0 },
        recentDialogues: [],
        mostViewedDialogue: null,
        dialogueMetadata: {},
      };
    }
  }

  /**
   * Find the most viewed dialogue
   * @param {Object} dialogueMetadata - Dialogue metadata object
   * @returns {Object|null} - Most viewed dialogue info
   */
  getMostViewedDialogue(dialogueMetadata) {
    try {
      let mostViewed = null;
      let maxViews = 0;

      Object.entries(dialogueMetadata).forEach(([id, data]) => {
        if (data.viewCount > maxViews) {
          maxViews = data.viewCount;
          mostViewed = { id, ...data };
        }
      });

      return mostViewed;
    } catch (error) {
      console.error("Failed to get most viewed dialogue:", error);
      return null;
    }
  }

  /**
   * Export statistics for external analysis or sharing
   * @param {Object} gameState - Current game state
   * @returns {Object} - Exportable statistics data
   */
  exportStatistics(gameState) {
    try {
      const formattedStats = this.getFormattedStatistics(gameState);
      const dialogueStats = this.getDialogueStatistics(gameState);

      return {
        exportDate: new Date().toISOString(),
        gameVersion: this.saveVersion,
        playerStats: formattedStats,
        dialogueProgress: dialogueStats,
        gameProgress: {
          currentLevel: gameState.currentLevel || 1,
          playerPosition: gameState.playerPosition || { x: 0, y: 0 },
          objectivesCompleted: gameState.objectivesCompleted || {},
          collectedItems: gameState.collectedItems || [],
        },
        rawStats: gameState.gameStats || {},
      };
    } catch (error) {
      console.error("Failed to export statistics:", error);
      return null;
    }
  }

  /**
   * Test localStorage availability and functionality
   * @returns {boolean} - Whether localStorage is working
   */
  testLocalStorage() {
    try {
      const testKey = "dante_inferno_test";
      const testValue = "test_value_" + Date.now();

      // Test write
      localStorage.setItem(testKey, testValue);

      // Test read
      const retrieved = localStorage.getItem(testKey);

      // Test delete
      localStorage.removeItem(testKey);

      // Verify the test worked
      return retrieved === testValue;
    } catch (error) {
      console.error("localStorage test failed:", error);
      return false;
    }
  }

  /**
   * Save with retry mechanism for better offline reliability
   * @param {string} key - Storage key
   * @param {string} value - Value to save
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {boolean} - Success status
   */
  saveWithRetry(key, value, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        localStorage.setItem(key, value);

        // Verify the save worked
        const saved = localStorage.getItem(key);
        if (saved === value) {
          return true;
        }

        console.warn(`Save verification failed on attempt ${attempt}`);
      } catch (error) {
        console.warn(`Save attempt ${attempt} failed:`, error);

        // If quota exceeded, try to free up space
        if (error.name === "QuotaExceededError") {
          this.cleanupOldSaves();
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          // Simple synchronous delay
          const start = Date.now();
          while (Date.now() - start < 100) {
            // Wait 100ms
          }
        }
      }
    }

    return false;
  }

  /**
   * Clean up old saves to free localStorage space
   */
  cleanupOldSaves() {
    try {
      console.log("Attempting to clean up localStorage space...");

      // Remove backup saves older than 7 days
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("dante_inferno") && key.includes("backup")) {
          backupKeys.push(key);
        }
      }

      backupKeys.forEach((key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const age = Date.now() - (data.timestamp || 0);
          const sevenDays = 7 * 24 * 60 * 60 * 1000;

          if (age > sevenDays) {
            localStorage.removeItem(key);
            console.log(`Removed old backup: ${key}`);
          }
        } catch (error) {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
          console.log(`Removed corrupted backup: ${key}`);
        }
      });

      // Remove any test keys that might be left over
      const testKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes("test")) {
          testKeys.push(key);
        }
      }

      testKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log("localStorage cleanup completed");
    } catch (error) {
      console.error("Failed to cleanup localStorage:", error);
    }
  }

  /**
   * Handle offline save scenarios
   * @param {Object} gameState - Game state to save
   * @returns {boolean} - Success status
   */
  handleOfflineSave(gameState) {
    try {
      console.log("Handling offline save...");

      // Ensure localStorage is available
      if (!this.testLocalStorage()) {
        throw new Error("localStorage not available offline");
      }

      // Save with offline flag
      const success = this.saveGame(gameState);

      if (success) {
        console.log("Offline save successful");
        return true;
      } else {
        throw new Error("Offline save failed");
      }
    } catch (error) {
      console.error("Offline save error:", error);

      // Try to save minimal essential data
      return this.saveMinimalState(gameState);
    }
  }

  /**
   * Save minimal essential game state when full save fails
   * @param {Object} gameState - Full game state
   * @returns {boolean} - Success status
   */
  saveMinimalState(gameState) {
    try {
      console.log("Attempting minimal state save...");

      const minimalState = {
        currentLevel: gameState.currentLevel || 1,
        playerPosition: gameState.playerPosition || { x: 0, y: 0 },
        objectivesCompleted: gameState.objectivesCompleted || {},
        gameStats: {
          playTime: gameState.gameStats?.playTime || 0,
          deathCount: gameState.gameStats?.deathCount || 0,
        },
      };

      const saveData = {
        version: this.saveVersion,
        timestamp: Date.now(),
        gameState: minimalState,
        minimal: true,
        offline: true,
      };

      const saveString = JSON.stringify(saveData);
      const success = this.saveWithRetry(this.saveKey + "_minimal", saveString);

      if (success) {
        console.log("Minimal state saved successfully");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Minimal state save failed:", error);
      return false;
    }
  }

  /**
   * Load game with offline fallback
   * @returns {Object|null} - Loaded game state or null
   */
  loadGameWithOfflineFallback() {
    try {
      // Try normal load first
      const gameState = this.loadGame();
      if (gameState) {
        return gameState;
      }

      // Try minimal save fallback
      console.log("Attempting to load minimal save...");
      const minimalData = localStorage.getItem(this.saveKey + "_minimal");

      if (minimalData) {
        const parsed = JSON.parse(minimalData);
        console.log("Loaded minimal save data");
        return parsed.gameState;
      }

      return null;
    } catch (error) {
      console.error("Failed to load game with offline fallback:", error);
      return null;
    }
  }

  /**
   * Export save data for backup
   * @returns {string|null} - Exported save data
   */
  exportSaveData() {
    try {
      const saveData = localStorage.getItem(this.saveKey);
      if (!saveData) {
        return null;
      }

      // Add export metadata
      const exportData = {
        exportVersion: "1.0.0",
        exportTimestamp: Date.now(),
        gameData: JSON.parse(saveData),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("Failed to export save data:", error);
      return null;
    }
  }

  /**
   * Import save data from backup
   * @param {string} importData - Imported save data
   * @returns {boolean} - Success status
   */
  importSaveData(importData) {
    try {
      const parsed = JSON.parse(importData);

      // Validate import data
      if (!parsed.gameData || !parsed.exportVersion) {
        throw new Error("Invalid import data format");
      }

      // Create backup before importing
      this.createBackup();

      // Import the save data
      const saveString = JSON.stringify(parsed.gameData);
      const success = this.saveWithRetry(this.saveKey, saveString);

      if (success) {
        console.log("Save data imported successfully");
        return true;
      } else {
        throw new Error("Failed to save imported data");
      }
    } catch (error) {
      console.error("Failed to import save data:", error);
      return false;
    }
  }
}
